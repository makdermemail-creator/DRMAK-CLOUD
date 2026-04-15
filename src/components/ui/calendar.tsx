"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  // Determine the initial displayed month
  const getInitialMonth = (): Date => {
    if (props.month instanceof Date) return props.month;
    if (props.defaultMonth instanceof Date) return props.defaultMonth;
    if (props.selected instanceof Date) return props.selected;
    return new Date();
  };

  const [displayMonth, setDisplayMonth] = React.useState<Date>(getInitialMonth);

  // Keep in sync when parent controls the month
  React.useEffect(() => {
    if (props.month instanceof Date) {
      setDisplayMonth(props.month);
    }
  }, [props.month]);

  const handleMonthChange = (month: Date) => {
    setDisplayMonth(month);
    props.onMonthChange?.(month);
  };

  const currentYear = displayMonth.getFullYear();
  const currentMonth = displayMonth.getMonth();

  // Build year range: 15 years back, 10 years forward
  const yearRange = Array.from({ length: 26 }, (_, i) => currentYear - 15 + i);

  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(displayMonth);
    newDate.setFullYear(parseInt(e.target.value, 10));
    handleMonthChange(newDate);
  };

  const handleMonthSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(displayMonth);
    newDate.setMonth(parseInt(e.target.value, 10));
    handleMonthChange(newDate);
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      month={displayMonth}
      onMonthChange={handleMonthChange}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center",
        caption_label: "hidden",
        nav: "space-x-1 flex items-center",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        range_end: "day-range-end",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "bg-accent text-accent-foreground",
        outside:
          "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
        range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") return <ChevronLeft className="h-4 w-4" />;
          return <ChevronRight className="h-4 w-4" />;
        },
        MonthCaption: () => (
          <div className="flex items-center gap-1 mx-8 text-sm font-medium">
            <select
              value={currentMonth}
              onChange={handleMonthSelectChange}
              className="bg-transparent border-none outline-none cursor-pointer hover:text-primary transition-colors py-0 pr-1 text-sm font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <select
              value={currentYear}
              onChange={handleYearChange}
              className="bg-transparent border-none outline-none cursor-pointer hover:text-primary transition-colors py-0 text-sm font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              {yearRange.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        ),
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar"

export { Calendar }
