'use client';

import * as React from 'react';
import { format, addDays, addMonths, addWeeks, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown, ChevronRight } from 'lucide-react';

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

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setTempDate(externalDate);
    }
    setIsOpen(open);
  };

  const handleApply = () => {
    onDateChange(tempDate);
    setIsOpen(false);
  };

  const presets = [
    { label: 'Today', getValue: () => startOfDay(new Date()) },
    { label: 'Tomorrow', getValue: () => addDays(startOfDay(new Date()), 1) },
    { label: 'Next Week', getValue: () => addWeeks(startOfDay(new Date()), 1) },
    { label: 'Next Month', getValue: () => addMonths(startOfDay(new Date()), 1) },
  ];

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full min-w-[200px] justify-start text-left font-bold rounded-2xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-all h-12 px-5',
            !externalDate && 'text-muted-foreground',
            className
          )}
        >
          <div className="bg-indigo-50 p-2 rounded-xl mr-3 group-hover:bg-indigo-100 transition-colors">
            <CalendarIcon className="h-4 w-4 text-indigo-600 group-hover:text-indigo-700" />
          </div>
          <div className="flex flex-col flex-1">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-0.5">Selection Date</span>
              <span className="text-sm text-slate-900">
                {externalDate ? format(externalDate, 'dd/MM/yyyy') : <span>Pick a date</span>}
              </span>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-300 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 border-none shadow-2xl rounded-[1.5rem] bg-white/95 backdrop-blur-xl z-[100] max-h-[90vh] overflow-y-auto" 
        align="start"
      >
        <div className="flex flex-col md:flex-row h-full">
            {/* Presets Sidebar */}
            <div className="w-full md:w-48 bg-slate-50/50 p-4 border-r border-slate-100 flex flex-col gap-1">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 mb-2">Fast Select</h4>
                {presets.map((preset) => (
                    <Button
                        key={preset.label}
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "justify-between font-bold text-xs px-3 py-2 h-9 rounded-xl hover:bg-white hover:shadow-sm transition-all text-slate-600 hover:text-indigo-600"
                        )}
                        onClick={() => {
                            const val = preset.getValue();
                            setTempDate(val);
                            onDateChange(val);
                            setIsOpen(false);
                        }}
                    >
                        {preset.label}
                        <ChevronRight className="h-3 w-3 opacity-50" />
                    </Button>
                ))}
            </div>

            <div className="flex flex-col flex-1">
                <div className="p-2">
                    <Calendar
                        mode="single"
                        captionLayout="dropdown" // Re-enabling dropdown selection for Month/Year
                        selected={tempDate}
                        onSelect={(date) => {
                            if (date) setTempDate(date);
                        }}
                        initialFocus
                        numberOfMonths={1}
                        className="rounded-xl mx-auto"
                    />
                </div>
                {/* Footer */}
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-4 sticky bottom-0 bg-white/80">
                    <div className="text-[10px] font-bold text-slate-400 px-2 shrink-0">
                        {tempDate ? (
                            <span className="text-indigo-600 font-black">{format(tempDate, 'dd/MM/yyyy')}</span>
                        ) : (
                            <span>No date selected</span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="rounded-xl font-bold text-xs h-9 px-4 text-slate-500 hover:bg-slate-100" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button size="sm" className="rounded-xl font-bold text-xs h-9 px-6 bg-slate-900 hover:bg-slate-800 text-white shadow-lg" onClick={handleApply}>
                            Confirm & OK
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
