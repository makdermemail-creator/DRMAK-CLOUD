'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function DatePicker({
  date: externalDate,
  onDateChange,
  className,
}: {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [tempDate, setTempDate] = React.useState<Date | undefined>(externalDate);

  // Sync tempDate when popover opens
  React.useEffect(() => {
    if (isOpen) {
      setTempDate(externalDate);
    }
  }, [isOpen, externalDate]);

  const handleApply = () => {
    onDateChange(tempDate);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full min-w-[200px] justify-start text-left font-bold rounded-2xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-all h-12 px-5',
            !externalDate && 'text-muted-foreground',
            className
          )}
        >
          <div className="bg-slate-100 p-2 rounded-xl mr-3 group-hover:bg-indigo-50 transition-colors">
            <CalendarIcon className="h-4 w-4 text-slate-500 group-hover:text-indigo-600" />
          </div>
          <div className="flex flex-col flex-1">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-0.5">Selection Date</span>
              <span className="text-sm">
                {externalDate ? format(externalDate, 'PPP') : <span>Pick a date</span>}
              </span>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-300 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 border-none shadow-2xl rounded-[1.5rem] overflow-hidden bg-white/95 backdrop-blur-xl" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col">
            <Calendar
            mode="single"
            selected={tempDate}
            onSelect={setTempDate}
            initialFocus
            className="rounded-2xl"
            />
            {/* Footer with OK Button */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" className="rounded-xl font-bold text-xs h-9 px-4" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button size="sm" className="rounded-xl font-bold text-xs h-9 px-6 bg-slate-900 text-white" onClick={handleApply}>
                    Confirm & OK
                </Button>
            </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
