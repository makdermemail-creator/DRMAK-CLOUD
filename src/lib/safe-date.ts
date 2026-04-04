import { format } from 'date-fns';

/**
 * Safely converts a value to a Date object.
 * Returns null if the value is invalid or null.
 */
export function safeDate(dateValue: any): Date | null {
    if (!dateValue) return null;
    try {
        const d = new Date(dateValue);
        return isNaN(d.getTime()) ? null : d;
    } catch (e) {
        return null;
    }
}

/**
 * Safely formats a date value.
 * If the date is invalid, returns the fallback string.
 */
export function safeFormat(dateValue: any, formatStr: string, fallback: string = 'N/A'): string {
    const d = safeDate(dateValue);
    if (!d) return fallback;
    try {
        return format(d, formatStr);
    } catch (e) {
        return fallback;
    }
}
