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
import { Search, Send, MessageCircle, User, Star, Filter } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const messages = [
    { id: 1, user: 'Sarah J.', text: 'Hi, do you have any appointments available for Friday afternoon?', time: '10:15 AM', platform: 'Instagram', unread: true },
    { id: 2, user: 'Michael Chen', text: 'I saw your post about the new laser treatment. Is it safe for sensitive skin?', time: '9:30 AM', platform: 'Facebook', unread: false },
    { id: 3, user: 'Amara K.', text: 'What is the pricing for the brightening facial?', time: 'Yesterday', platform: 'Instagram', unread: false },
    { id: 4, user: 'Lisa Wong', text: 'Thank you for the amazing service today! My skin feels great.', time: 'Yesterday', platform: 'Google Business', unread: false },
];

export default function SocialInboxPage() {
    const [selectedId, setSelectedId] = React.useState(1);
    const selectedMessage = messages.find(m => m.id === selectedId);

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Social Inbox</h1>
                    <p className="text-muted-foreground">Manage all social media messages and comments in one place.</p>
                </div>
            </div>

            <div className="flex-1 flex gap-4 overflow-hidden">
                {/* Sidebar: Conversation List */}
                <Card className="w-80 flex flex-col overflow-hidden">
                    <CardHeader className="p-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search messages..." className="pl-9 h-9" />
                        </div>
                        <div className="flex gap-2 mt-4">
                            <Button variant="outline" size="sm" className="h-8 gap-1">
                                <Filter className="h-3.5 w-3.5" /> Filter
                            </Button>
                            <Badge variant="secondary" className="ml-auto font-normal">4 New</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="divide-y">
                                {messages.map(m => (
                                    <div
                                        key={m.id}
                                        onClick={() => setSelectedId(m.id)}
                                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${selectedId === m.id ? 'bg-muted' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-semibold text-sm truncate">{m.user}</span>
                                            <span className="text-[10px] text-muted-foreground">{m.time}</span>
                                        </div>
                                        <p className={`text-xs line-clamp-2 ${m.unread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                                            {m.text}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge variant="outline" className="text-[10px] py-0 h-4">{m.platform}</Badge>
                                            {m.unread && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Chat Window */}
                <Card className="flex-1 flex flex-col overflow-hidden">
                    {selectedMessage ? (
                        <>
                            <CardHeader className="p-4 border-b flex flex-row items-center gap-4">
                                <Avatar>
                                    <AvatarImage src={`https://i.pravatar.cc/150?u=${selectedMessage.id}`} />
                                    <AvatarFallback>{selectedMessage.user.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <CardTitle className="text-lg">{selectedMessage.user}</CardTitle>
                                    <CardDescription>via {selectedMessage.platform}</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon"><Star className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon"><User className="h-4 w-4" /></Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 flex-1 overflow-hidden flex flex-col">
                                <ScrollArea className="flex-1 pr-4">
                                    <div className="space-y-4 py-4">
                                        <div className="flex gap-3 max-w-[80%]">
                                            <Avatar className="h-8 w-8 mt-1">
                                                <AvatarImage src={`https://i.pravatar.cc/150?u=${selectedMessage.id}`} />
                                                <AvatarFallback>{selectedMessage.user.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="p-3 bg-muted rounded-2xl rounded-tl-none">
                                                <p className="text-sm">{selectedMessage.text}</p>
                                                <span className="text-[10px] text-muted-foreground mt-1 block">{selectedMessage.time}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-row-reverse gap-3 ml-auto max-w-[80%]">
                                            <div className="p-3 bg-primary text-primary-foreground rounded-2xl rounded-tr-none">
                                                <p className="text-sm">Hi {selectedMessage.user.split(' ')[0]}! Yes, we have a slot at 3:00 PM on Friday. Would you like me to book it for you?</p>
                                                <span className="text-[10px] opacity-70 mt-1 block">10:20 AM</span>
                                            </div>
                                        </div>
                                    </div>
                                </ScrollArea>

                                <div className="mt-4 pt-4 border-t flex gap-2">
                                    <div className="relative flex-1">
                                        <MessageCircle className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                        <Input placeholder="Type a reply..." className="pl-10 h-10 ring-offset-background focus-visible:ring-1" />
                                    </div>
                                    <Button className="h-10 px-6 gap-2">
                                        <Send className="h-4 w-4" />
                                        Send
                                    </Button>
                                </div>
                            </CardContent>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                            <MessageCircle className="h-12 w-12 mb-2 opacity-20" />
                            <p>Select a message to start responding</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
