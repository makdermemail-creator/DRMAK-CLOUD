'use client';

import * as React from 'react';
import { 
    addDays, 
    format, 
    startOfDay, 
    endOfDay, 
    subDays, 
    startOfWeek, 
    startOfMonth, 
    startOfYear,
    isWithinInterval
} from 'date-fns';
import { Calendar as CalendarIcon, Check, ChevronRight } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerWithRangeProps extends React.HTMLAttributes<HTMLDivElement> {
    date?: DateRange | undefined;
    onDateChange?: (date: DateRange | undefined) => void;
}

export function DatePickerWithRange({
    className,
    date: externalDate,
    onDateChange,
}: DatePickerWithRangeProps) {
    const [internalDate, setInternalDate] = React.useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: new Date(),
    });

    const [isOpen, setIsOpen] = React.useState(false);
    const [tempDate, setTempDate] = React.useState<DateRange | undefined>(externalDate || internalDate);

    const date = externalDate || internalDate;
    const setDate = onDateChange || setInternalDate;

    // Initialize tempDate only when the popover opens
    const handleOpenChange = (open: boolean) => {
        if (open) {
            setTempDate(date);
        }
        setIsOpen(open);
    };

    const handleApply = () => {
        setDate(tempDate);
        setIsOpen(false);
    };

    const presets = [
        { label: 'Today', getValue: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
        { label: 'Yesterday', getValue: () => ({ from: startOfDay(subDays(new Date(), 1)), to: endOfDay(subDays(new Date(), 1)) }) },
        { label: 'This Week', getValue: () => ({ from: startOfWeek(new Date()), to: new Date() }) },
        { label: 'Last 7 Days', getValue: () => ({ from: subDays(new Date(), 7), to: endOfDay(new Date()) }) },
        { label: 'This Month', getValue: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
        { label: 'Last 30 Days', getValue: () => ({ from: subDays(new Date(), 30), to: endOfDay(new Date()) }) },
        { label: 'This Year', getValue: () => ({ from: startOfYear(new Date()), to: new Date() }) },
        { label: 'All History', getValue: () => ({ from: new Date(2020, 0, 1), to: new Date() }) },
    ];

    return (
        <div className={cn('grid gap-2', className)}>
            <Popover open={isOpen} onOpenChange={handleOpenChange}>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={'outline'}
                        className={cn(
                            'w-fit min-w-[280px] justify-start text-left font-bold rounded-2xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-all h-12 px-5',
                            !date && 'text-muted-foreground'
                        )}
                    >
                        <div className="bg-indigo-50 p-2 rounded-xl mr-3">
                            <CalendarIcon className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[11px] uppercase tracking-widest text-slate-400 font-black mb-0.5">Date Range</span>
                            <span className="text-sm text-slate-900">
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, 'LLL dd, y')} — {format(date.to, 'LLL dd, y')}
                                        </>
                                    ) : (
                                        format(date.from, 'LLL dd, y')
                                    )
                                ) : (
                                    <span>Select Filter Period</span>
                                )}
                            </span>
                        </div>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-[1.5rem] overflow-hidden bg-white/95 backdrop-blur-xl z-50" align="end">
                    <div className="flex flex-col md:flex-row h-full">
                        {/* Presets Sidebar */}
                        <div className="w-full md:w-48 bg-slate-50/50 p-4 border-r border-slate-100 flex flex-col gap-1">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 mb-2">Refine Period</h4>
                            {presets.map((preset) => (
                                <Button
                                    key={preset.label}
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "justify-between font-bold text-xs px-3 py-2 h-9 rounded-xl hover:bg-white hover:shadow-sm transition-all",
                                        "data-[active=true]:bg-indigo-600 data-[active=true]:text-white data-[active=true]:hover:bg-indigo-700"
                                    )}
                                    // Presets apply immediately and close
                                    onClick={() => {
                                        const val = preset.getValue();
                                        setTempDate(val);
                                        setDate(val);
                                        setIsOpen(false);
                                    }}
                                >
                                    {preset.label}
                                    <ChevronRight className="h-3 w-3 opacity-50" />
                                </Button>
                            ))}
                        </div>

                        {/* Calendar Area */}
                        <div className="flex flex-col">
                            <div className="p-2">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={tempDate?.from}
                                    selected={tempDate}
                                    onSelect={(range) => {
                                        // Ensure range is at least defined as from
                                        if (range) setTempDate(range);
                                    }}
                                    numberOfMonths={2}
                                    className="rounded-xl"
                                />
                            </div>
                            {/* Footer with Apply Button */}
                            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                                <div className="text-[10px] font-bold text-slate-400 px-2">
                                    {tempDate?.from && tempDate?.to ? (
                                        <span className="text-indigo-600">{format(tempDate.from, 'MMM dd')} - {format(tempDate.to, 'MMM dd, yyyy')}</span>
                                    ) : (
                                        <span>Select a valid range</span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" className="rounded-xl font-bold text-xs h-9 px-4 text-slate-500" onClick={() => setIsOpen(false)}>Cancel</Button>
                                    <Button size="sm" className="rounded-xl font-bold text-xs h-9 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100" onClick={handleApply}>
                                        Apply Range & OK
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
