'use client';
import * as React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Search,
    Send,
    MessageCircle,
    User,
    Plus,
    Users,
    MoreVertical,
    Check,
    CheckCheck,
    Loader2
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCollection, useFirestore, useMemoFirebase, useUser, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, orderBy, limit, doc, getDoc, setDoc, Timestamp, addDoc, serverTimestamp } from 'firebase/firestore';
import { Chat, Message, User as UserType } from '@/lib/types';
import { format } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from '@/hooks/use-toast';

export default function SocialInboxPage() {
    const firestore = useFirestore();
    const { user: currentUser } = useUser();
    const { toast } = useToast();

    const [selectedChatId, setSelectedChatId] = React.useState<string | null>(null);
    const [messageInput, setMessageInput] = React.useState('');
    const [isNewChatOpen, setIsNewChatOpen] = React.useState(false);
    const [chatSearch, setChatSearch] = React.useState('');

    // New Chat State
    const [selectedUsers, setSelectedUsers] = React.useState<string[]>([]);
    const [groupName, setGroupName] = React.useState('');
    const [userSearch, setUserSearch] = React.useState('');

    // Fetch Chats
    const chatsQuery = useMemoFirebase(() => {
        if (!firestore || !currentUser) return null;
        return query(
            collection(firestore, 'chats'),
            where('participants', 'array-contains', currentUser.id),
            orderBy('lastMessageAt', 'desc')
        );
    }, [firestore, currentUser]);

    // Fetch All Users for New Chat
    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), limit(50));
    }, [firestore]);

    const { data: chats, isLoading: chatsLoading } = useCollection<Chat>(chatsQuery);
    const { data: usersList } = useCollection<UserType>(usersQuery);

    // Fetch Messages for active chat
    const messagesQuery = useMemoFirebase(() => {
        if (!firestore || !selectedChatId) return null;
        return query(
            collection(firestore, `chats/${selectedChatId}/messages`),
            orderBy('timestamp', 'asc')
        );
    }, [firestore, selectedChatId]);

    const { data: messages, isLoading: messagesLoading } = useCollection<Message>(messagesQuery);

    const activeChat = chats?.find(c => c.id === selectedChatId);

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedChatId || !currentUser || !firestore) return;

        const content = messageInput.trim();
        setMessageInput('');

        try {
            const messageData: Omit<Message, 'id'> = {
                senderId: currentUser.id,
                content,
                timestamp: new Date().toISOString(),
                type: 'text',
                readBy: [currentUser.id]
            };

            await addDoc(collection(firestore, `chats/${selectedChatId}/messages`), messageData);

            // Update chat last message
            const chatRef = doc(firestore, 'chats', selectedChatId);
            await updateDocumentNonBlocking(chatRef, {
                lastMessage: content,
                lastMessageAt: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error sending message:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to send message.' });
        }
    };

    const handleStartChat = async (targetUser: UserType) => {
        if (!firestore || !currentUser) return;

        // Check if individual chat already exists
        const existingChat = chats?.find(c =>
            c.type === 'individual' &&
            c.participants.includes(targetUser.id) &&
            c.participants.includes(currentUser.id)
        );

        if (existingChat) {
            setSelectedChatId(existingChat.id);
            setIsNewChatOpen(false);
            return;
        }

        const newChatId = [currentUser.id, targetUser.id].sort().join('_');
        const chatData: Omit<Chat, 'id'> = {
            type: 'individual',
            participants: [currentUser.id, targetUser.id],
            createdAt: new Date().toISOString(),
            createdBy: currentUser.id,
            lastMessage: 'Conversation started',
            lastMessageAt: new Date().toISOString()
        };

        try {
            await setDoc(doc(firestore, 'chats', newChatId), chatData);
            setSelectedChatId(newChatId);
            setIsNewChatOpen(false);
            toast({ title: 'Chat Started', description: `You can now message ${targetUser.name}` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to create chat.' });
        }
    };

    const handleCreateGroup = async () => {
        if (!firestore || !currentUser || selectedUsers.length === 0 || !groupName.trim()) return;

        const participants = [currentUser.id, ...selectedUsers];
        const chatData: Omit<Chat, 'id'> = {
            type: 'group',
            participants,
            name: groupName,
            createdAt: new Date().toISOString(),
            createdBy: currentUser.id,
            lastMessage: 'Group created',
            lastMessageAt: new Date().toISOString()
        };

        try {
            const docRef = await addDoc(collection(firestore, 'chats'), chatData);
            setSelectedChatId(docRef.id);
            setIsNewChatOpen(false);
            setGroupName('');
            setSelectedUsers([]);
            toast({ title: 'Group Created', description: `Group "${groupName}" is ready.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to create group.' });
        }
    };

    const getChatName = (chat: Chat) => {
        if (chat.type === 'group') return chat.name || 'Unnamed Group';
        const otherId = chat.participants.find(id => id !== currentUser?.id);
        const otherUser = usersList?.find(u => u.id === otherId);
        return otherUser?.name || 'Unknown User';
    };

    const getChatAvatar = (chat: Chat) => {
        if (chat.type === 'group') return chat.avatarUrl || '';
        const otherId = chat.participants.find(id => id !== currentUser?.id);
        const otherUser = usersList?.find(u => u.id === otherId);
        return otherUser?.avatarUrl || '';
    };

    const filteredChats = chats?.filter(c =>
        getChatName(c).toLowerCase().includes(chatSearch.toLowerCase())
    );

    const filteredUsers = usersList?.filter(u =>
        u.id !== currentUser?.id &&
        u.name.toLowerCase().includes(userSearch.toLowerCase())
    );

    const scrollRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col space-y-4 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Social Inbox</h1>
                    <p className="text-slate-500 font-medium">Internal messaging & group collaboration.</p>
                </div>

                <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold gap-2">
                            <Plus className="h-4 w-4" />
                            New Message
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Start a Conversation</DialogTitle>
                            <DialogDescription>Message a team member or create a group.</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Search Team Members</label>
                                <Input
                                    placeholder="Search by name..."
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                />
                            </div>

                            {selectedUsers.length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Group Name</label>
                                    <Input
                                        placeholder="Enter group name..."
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                    />
                                </div>
                            )}

                            <ScrollArea className="h-64 border rounded-xl p-2">
                                <div className="space-y-1">
                                    {filteredUsers?.map(u => (
                                        <div
                                            key={u.id}
                                            className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                                            onClick={() => {
                                                if (selectedUsers.length === 0) {
                                                    handleStartChat(u);
                                                } else {
                                                    setSelectedUsers(prev =>
                                                        prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id]
                                                    );
                                                }
                                            }}
                                        >
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={u.avatarUrl} />
                                                <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-800">{u.name}</p>
                                                <p className="text-[10px] text-slate-500 font-medium">{u.role}</p>
                                            </div>
                                            <Checkbox
                                                checked={selectedUsers.includes(u.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedUsers(prev => [...prev, u.id]);
                                                    } else {
                                                        setSelectedUsers(prev => prev.filter(id => id !== u.id));
                                                    }
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>

                        <DialogFooter>
                            {selectedUsers.length > 0 && (
                                <Button
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold"
                                    onClick={handleCreateGroup}
                                    disabled={!groupName.trim()}
                                >
                                    Create Group with {selectedUsers.length} Members
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex-1 flex gap-4 overflow-hidden">
                {/* Sidebar: Chat List */}
                <Card className="w-80 flex flex-col overflow-hidden shadow-sm border-slate-200">
                    <CardHeader className="p-4 border-b bg-slate-50/50">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search conversations..."
                                className="pl-9 h-10 bg-white border-slate-200"
                                value={chatSearch}
                                onChange={(e) => setChatSearch(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-hidden">
                        <ScrollArea className="h-full">
                            {chatsLoading ? (
                                <div className="flex flex-col items-center justify-center p-8 gap-2">
                                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading Chats</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {filteredChats?.map(c => (
                                        <div
                                            key={c.id}
                                            onClick={() => setSelectedChatId(c.id)}
                                            className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors flex items-center gap-3 ${selectedChatId === c.id ? 'bg-indigo-50/50 border-r-4 border-r-indigo-600' : ''}`}
                                        >
                                            <Avatar className="h-10 w-10 border border-slate-200 shadow-sm">
                                                <AvatarImage src={getChatAvatar(c)} />
                                                <AvatarFallback>{getChatName(c).charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-0.5">
                                                    <span className="font-bold text-sm text-slate-800 truncate">{getChatName(c)}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold">
                                                        {c.lastMessageAt && format(new Date(c.lastMessageAt), 'h:mm a')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 truncate font-medium">
                                                    {c.lastMessage}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredChats?.length === 0 && (
                                        <div className="p-8 text-center text-slate-400 italic text-sm">
                                            No conversations found.
                                        </div>
                                    )}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Chat Window */}
                <Card className="flex-1 flex flex-col overflow-hidden shadow-sm border-slate-200">
                    {selectedChatId ? (
                        <>
                            <CardHeader className="p-4 border-b flex flex-row items-center gap-4 bg-slate-50/30">
                                <Avatar className="h-10 w-10 border border-indigo-100 shadow-sm">
                                    <AvatarImage src={activeChat ? getChatAvatar(activeChat) : ''} />
                                    <AvatarFallback>{activeChat ? getChatName(activeChat).charAt(0) : '?'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <CardTitle className="text-base font-black text-slate-800">{activeChat && getChatName(activeChat)}</CardTitle>
                                    <div className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest">{activeChat?.type === 'group' ? `${activeChat.participants.length} Members` : 'Active Now'}</CardDescription>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="text-slate-400"><MoreVertical className="h-4 w-4" /></Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 flex-1 overflow-hidden flex flex-col bg-[url('/chat-pattern.png')] bg-repeat">
                                <div
                                    className="flex-1 overflow-y-auto pr-4 space-y-6 py-4 scroll-smooth"
                                    ref={scrollRef}
                                >
                                    {messages?.map((m, idx) => {
                                        const isMe = m.senderId === currentUser?.id;
                                        const sender = usersList?.find(u => u.id === m.senderId);

                                        return (
                                            <div key={m.id} className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 group`}>
                                                {!isMe && (
                                                    <Avatar className="h-8 w-8 shadow-sm">
                                                        <AvatarImage src={sender?.avatarUrl} />
                                                        <AvatarFallback>{sender?.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                                                    {!isMe && activeChat?.type === 'group' && (
                                                        <span className="text-[10px] font-bold text-slate-500 mb-1 ml-1 uppercase tracking-tighter">{sender?.name}</span>
                                                    )}
                                                    <div className={`p-3 text-sm shadow-sm ${isMe
                                                            ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none'
                                                            : 'bg-white text-slate-800 rounded-2xl rounded-tl-none border border-slate-100'
                                                        }`}>
                                                        <p className="leading-relaxed font-medium">{m.content}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1 mt-1 px-1">
                                                        <span className="text-[9px] text-slate-400 font-bold">{format(new Date(m.timestamp), 'h:mm a')}</span>
                                                        {isMe && <CheckCheck className="h-3 w-3 text-indigo-400" />}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {messagesLoading && (
                                        <div className="flex justify-center p-4">
                                            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t flex gap-3">
                                    <div className="relative flex-1">
                                        <Input
                                            placeholder="Type message..."
                                            className="h-12 border-slate-200 rounded-xl shadow-inner pr-12 focus-visible:ring-indigo-600 font-medium"
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        />
                                    </div>
                                    <Button
                                        className="h-12 w-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg transition-all active:scale-95"
                                        onClick={handleSendMessage}
                                        disabled={!messageInput.trim()}
                                    >
                                        <Send className="h-5 w-5" />
                                    </Button>
                                </div>
                            </CardContent>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                            <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-100 mb-6">
                                <MessageCircle className="h-12 w-12 text-slate-200" />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Your Team Hub</h3>
                            <p className="max-w-[200px] text-center text-sm font-medium mt-2 leading-relaxed text-slate-500">Select a conversation to start collaborating with your team.</p>
                            <Button
                                variant="outline"
                                className="mt-8 border-indigo-100 text-indigo-600 font-black tracking-widest uppercase text-xs hover:bg-white"
                                onClick={() => setIsNewChatOpen(true)}
                            >
                                <Plus className="mr-2 h-4 w-4" /> Start New Chat
                            </Button>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
