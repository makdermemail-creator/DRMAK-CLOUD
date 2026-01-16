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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, PlusCircle, Trash2, ListTodo } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from '@/firebase';
import type { DailyTask } from '@/lib/types';
import { collection, query, where, doc, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function DailyTasksPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user } = useUser();

    const [newTask, setNewTask] = React.useState('');

    const tasksQuery = useMemoFirebase(() => {
        if (!firestore || !user?.id) return null;
        return query(collection(firestore, 'dailyTasks'), where('userId', '==', user.id), orderBy('dueDate', 'desc'));
    }, [firestore, user]);
    
    const { data: tasks, isLoading, forceRerender } = useCollection<DailyTask>(tasksQuery);
    
    const sortedTasks = React.useMemo(() => {
        if (!tasks) return [];
        return [...tasks].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
    }, [tasks]);

    const handleAddTask = async () => {
        if (!firestore || !user) {
            toast({ variant: "destructive", title: "Error", description: "Authentication error." });
            return;
        }
        if (!newTask.trim()) {
            toast({ variant: "destructive", title: "Missing Task", description: "Please enter a task description." });
            return;
        }

        const task: Omit<DailyTask, 'id'> = {
            userId: user.id,
            task: newTask,
            status: 'Pending',
            dueDate: new Date().toISOString(),
        };

        try {
            await addDocumentNonBlocking(collection(firestore, 'dailyTasks'), task);
            toast({ title: "Task Added", description: "Your new task has been saved." });
            setNewTask('');
            forceRerender();
        } catch (error) {
            console.error("Failed to add task:", error);
            toast({ variant: "destructive", title: "Submission Failed", description: "Could not save your task." });
        }
    };
    
    const handleTaskStatusChange = (task: DailyTask, isCompleted: boolean) => {
        if (!firestore) return;
        const taskRef = doc(firestore, 'dailyTasks', task.id);
        updateDocumentNonBlocking(taskRef, { status: isCompleted ? 'Completed' : 'Pending' });
    };

    const handleDeleteTask = (taskId: string) => {
        if (!firestore) return;
        const taskRef = doc(firestore, 'dailyTasks', taskId);
        deleteDocumentNonBlocking(taskRef);
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ListTodo className="h-6 w-6"/>
                        Daily Tasks
                    </CardTitle>
                    <CardDescription>Manage your daily to-do list.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Add a new task..." 
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                        />
                        <Button onClick={handleAddTask}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Task
                        </Button>
                    </div>

                    <div className="border rounded-md">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-48">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : sortedTasks && sortedTasks.length > 0 ? (
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">Status</TableHead>
                                        <TableHead>Task</TableHead>
                                        <TableHead className="w-32">Date</TableHead>
                                        <TableHead className="w-12 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedTasks.map(task => (
                                        <TableRow key={task.id} className={task.status === 'Completed' ? 'bg-muted/50' : ''}>
                                            <TableCell>
                                                <Checkbox 
                                                    checked={task.status === 'Completed'} 
                                                    onCheckedChange={(checked) => handleTaskStatusChange(task, !!checked)}
                                                    aria-label={`Mark task ${task.status === 'Completed' ? 'incomplete' : 'complete'}`}
                                                />
                                            </TableCell>
                                            <TableCell className={`font-medium ${task.status === 'Completed' ? 'text-muted-foreground line-through' : ''}`}>
                                                {task.task}
                                            </TableCell>
                                            <TableCell>{format(new Date(task.dueDate), 'MMM dd, yyyy')}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                             <div className="p-8 text-center text-muted-foreground">
                                You have no tasks yet. Add one above to get started!
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
