'use client';
import * as React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle, Trash2, ListTodo } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from '@/firebase';
import { collection, query, orderBy, doc, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface TaskTemplate {
    id: string;
    content: string;
    category: string;
    createdAt: string;
}

export default function AdminTasksPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user } = useUser();

    // Restricted Access Check (Optional but good)
    const isAdmin = user?.role === 'Admin' || user?.email === 'admin1@skinsmith.com';

    const [newTask, setNewTask] = React.useState('');
    const [category, setCategory] = React.useState('Sales');

    const templatesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'adminTaskTemplates'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: templates, isLoading, forceRerender } = useCollection<TaskTemplate>(templatesQuery);

    const handleAddTemplate = async () => {
        if (!newTask.trim()) return;
        if (!firestore) return;

        try {
            await addDocumentNonBlocking(collection(firestore, 'adminTaskTemplates'), {
                content: newTask,
                category,
                createdAt: new Date().toISOString()
            });
            setNewTask('');
            toast({ title: 'Template Added', description: 'Task template created successfully.' });
            forceRerender();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to add template.' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!firestore) return;
        try {
            await deleteDocumentNonBlocking(doc(firestore, 'adminTaskTemplates', id));
            toast({ title: 'Deleted', description: 'Template removed.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete template.' });
        }
    };

    if (!isAdmin && user) {
        return <div className="p-8 text-center">You do not have permission to view this page.</div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ListTodo className="h-6 w-6" />
                        Manage Daily Task Templates
                    </CardTitle>
                    <CardDescription>Assign recurring daily tasks to specific departments.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <Input
                            placeholder="Enter task description..."
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            className="flex-1"
                        />
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Sales">Sales</SelectItem>
                                <SelectItem value="Operations">Operations</SelectItem>
                                <SelectItem value="General">General</SelectItem>
                                <SelectItem value="Medical">Medical</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleAddTemplate}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Task
                        </Button>
                    </div>

                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Task</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="animate-spin inline" /></TableCell></TableRow>
                                ) : templates?.map(t => (
                                    <TableRow key={t.id}>
                                        <TableCell>{t.content}</TableCell>
                                        <TableCell>{t.category}</TableCell>
                                        <TableCell>{format(new Date(t.createdAt), 'MMM dd, yyyy')}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {templates?.length === 0 && !isLoading && (
                                    <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No templates found.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
