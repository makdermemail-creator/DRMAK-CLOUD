import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import * as React from 'react';

export const useNotifications = () => {
    const firestore = useFirestore();
    const { user } = useUser();

    // 1. Pending Prescriptions (Operations Manager)
    const prescQuery = React.useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'prescriptions'), 
            where('printStatus', '==', 'Pending')
        );
    }, [firestore]);
    const { data: prescriptions } = useCollection(prescQuery);

    // 2. New Leads (Sales / Digital)
    // For Sales: only their assigned new leads
    // For Social Media Manager (Digital) / Admin: all new leads
    const leadsQuery = React.useMemo(() => {
        if (!firestore || !user) return null;
        
        const baseQuery = collection(firestore, 'leads');
        
        if (user.role === 'Sales') {
            return query(
                baseQuery, 
                where('status', '==', 'New Lead'),
                where('assignedTo', '==', user.id)
            );
        }
        
        return query(
            baseQuery, 
            where('status', '==', 'New Lead')
        );
    }, [firestore, user]);
    const { data: leads } = useCollection(leadsQuery);

    // 3. Social Inbox (Digital / Users)
    const chatsQuery = React.useMemo(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'chats'),
            where('participants', 'array-contains', user.id)
        );
    }, [firestore, user]);
    const { data: chats } = useCollection<any>(chatsQuery);

    const unreadChatsCount = React.useMemo(() => {
        if (!chats || !user) return 0;
        return chats.filter(chat => 
            chat.lastSenderId && 
            chat.lastSenderId !== user.id && 
            (!chat.readBy || !chat.readBy.includes(user.id))
        ).length;
    }, [chats, user]);

    return {
        printPrescription: prescriptions?.length || 0,
        leads: leads?.length || 0,
        socialInbox: unreadChatsCount,
    };
};
