'use client';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, FileText, Pencil, Eye } from 'lucide-react';

export default function ItemDataUpdatePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-lg font-semibold text-blue-600 bg-blue-100 py-2 px-4 w-fit rounded-md">Item Data Update</h1>
      </div>
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by Item Name..." className="pl-8" />
      </div>
      
      {/* Empty content area */}
      <div className="h-96"></div>

      <div className="fixed bottom-8 right-8 flex flex-col gap-2">
        <Button size="icon" className="rounded-full h-12 w-12"><FileText className="h-6 w-6" /></Button>
        <Button size="icon" className="rounded-full h-12 w-12"><Pencil className="h-6 w-6" /></Button>
        <Button size="icon" className="rounded-full h-12 w-12"><Eye className="h-6 w-6" /></Button>
      </div>
    </div>
  );
}
