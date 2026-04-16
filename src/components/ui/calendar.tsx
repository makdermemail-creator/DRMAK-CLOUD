"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

import "react-day-picker/style.css"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 bg-white", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 relative",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center h-9 mb-2",
        caption_label: "text-sm font-bold text-slate-900 mx-10",
        nav: "flex items-center absolute w-full left-0 top-1 px-1 justify-between z-30",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-white p-0 opacity-100 shadow-sm border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
        ),
        nav_button_previous: "absolute left-0",
        nav_button_next: "absolute right-0",
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "text-slate-400 rounded-md w-9 font-black text-[10px] uppercase tracking-tighter",
        week: "flex w-full mt-2",
        day: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-medium aria-selected:opacity-100 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-xl cursor-pointer"
        ),
        range_end: "day-range-end",
        selected:
          "bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white focus:bg-indigo-600 focus:text-white rounded-xl shadow-lg shadow-indigo-100",
        today: "bg-slate-100 text-slate-900 border border-slate-200",
        outside:
          "day-outside text-slate-300 opacity-50 aria-selected:bg-indigo-50 aria-selected:text-indigo-600",
        disabled: "text-slate-200 opacity-20 cursor-not-allowed",
        range_middle: "aria-selected:bg-indigo-50 aria-selected:text-indigo-600",
        hidden: "invisible",
        // Enable dropdown styles for v9
        dropdowns: "flex gap-1 bg-white",
        dropdown: "bg-transparent border-none text-sm font-bold cursor-pointer focus:ring-0 px-2 h-8 hover:bg-slate-50 rounded-md transition-colors",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") return <ChevronLeft className="h-4 w-4" />;
          return <ChevronRight className="h-4 w-4" />;
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
