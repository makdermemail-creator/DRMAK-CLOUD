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
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle, Trash2, Pencil } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import type { AdminTaskTemplate, User } from '@/lib/types';
import { collection, orderBy, query, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase/auth/use-user';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const TaskFormDialog = ({
    open,
    onOpenChange,
    task,
    users
}: {
    open: boolean,
    onOpenChange: (open: boolean) => void,
    task?: AdminTaskTemplate,
    users: User[]
}) => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user } = useUser();

    const [content, setContent] = React.useState('');
    const [category, setCategory] = React.useState('');
    const [assignedTo, setAssignedTo] = React.useState('all');

    React.useEffect(() => {
        if (task) {
            setContent(task.content);
            setCategory(task.category);
            setAssignedTo(task.assignedTo);
        } else {
            setContent('');
            setCategory('');
            setAssignedTo('all');
        }
    }, [task, open]);

    const handleSubmit = async () => {
        if (!firestore || !user) return;

        if (!content.trim()) {
            toast({ variant: 'destructive', title: 'Missing Content', description: 'Please enter task content.' });
            return;
        }
        if (!category.trim()) {
            toast({ variant: 'destructive', title: 'Missing Category', description: 'Please enter a category.' });
            return;
        }

        const taskData: Omit<AdminTaskTemplate, 'id'> = {
            content: content.trim(),
            category: category.trim(),
            assignedTo,
            createdAt: task?.createdAt || new Date().toISOString(),
            createdBy: user.id,
        };

        try {
            if (task) {
                // Update existing
                const taskRef = doc(firestore, 'adminTaskTemplates', task.id);
                await updateDocumentNonBlocking(taskRef, taskData);
                toast({ title: 'Task Updated', description: 'Task template has been updated.' });
            } else {
                // Create new
                await addDocumentNonBlocking(collection(firestore, 'adminTaskTemplates'), taskData);
                toast({ title: 'Task Created', description: 'New task template has been created.' });
            }
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to save task:', error);
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save task template.' });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{task ? 'Edit Task Template' : 'Create Task Template'}</DialogTitle>
                    <DialogDescription>
                        {task ? 'Update the task template details.' : 'Create a new recurring task template for users.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="content">Task Content *</Label>
                        <Input
                            id="content"
                            placeholder="e.g., Post daily story on Instagram"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Input
                            id="category"
                            placeholder="e.g., Social Media, Sales, General"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="assignedTo">Assign To *</Label>
                        <Select value={assignedTo} onValueChange={setAssignedTo}>
                            <SelectTrigger id="assignedTo">
                                <SelectValue placeholder="Select user" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Users</SelectItem>
                                {users.map((u) => (
                                    <SelectItem key={u.id} value={u.id}>
                                        {u.name} ({u.role})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit}>{task ? 'Update' : 'Create'} Task</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default function ManageTasksPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();

    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [selectedTask, setSelectedTask] = React.useState<AdminTaskTemplate | undefined>(undefined);

    const tasksQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'adminTaskTemplates'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'users');
    }, [firestore]);

    const { data: tasks, isLoading: tasksLoading } = useCollection<AdminTaskTemplate>(tasksQuery);
    const { data: users, isLoading: usersLoading } = useCollection<User>(usersQuery);

    const isLoading = tasksLoading || usersLoading;

    const usersMap = React.useMemo(() => {
        if (!users) return new Map();
        return new Map(users.map(u => [u.id, u.name]));
    }, [users]);

    if (isUserLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    const handleAdd = () => {
        setSelectedTask(undefined);
        setIsFormOpen(true);
    };

    const handleEdit = (task: AdminTaskTemplate) => {
        setSelectedTask(task);
        setIsFormOpen(true);
    };

    const handleDelete = (taskId: string) => {
        if (!firestore) return;
        const taskRef = doc(firestore, 'adminTaskTemplates', taskId);
        deleteDocumentNonBlocking(taskRef);
        toast({
            title: 'Task Deleted',
            description: 'Task template has been removed.'
        });
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Manage Task Templates</CardTitle>
                            <CardDescription>
                                Create and assign recurring daily tasks to users.
                            </CardDescription>
                        </div>
                        <Button onClick={handleAdd} className="gap-1">
                            <PlusCircle className="h-4 w-4" />
                            Add Task Template
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : tasks && tasks.length > 0 ? (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Task Content</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Assigned To</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tasks.map((task) => (
                                        <TableRow key={task.id}>
                                            <TableCell className="font-medium">{task.content}</TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                    {task.category}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {task.assignedTo === 'all' ? (
                                                    <span className="font-semibold text-green-600">All Users</span>
                                                ) : (
                                                    usersMap.get(task.assignedTo) || 'Unknown User'
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(task)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Task Template?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This will permanently delete this task template. Users will no longer see this task.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(task.id)}>Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">
                            No task templates found. Create one to get started!
                        </div>
                    )}
                </CardContent>
            </Card>
            <TaskFormDialog
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                task={selectedTask}
                users={users || []}
            />
        </>
    );
}
