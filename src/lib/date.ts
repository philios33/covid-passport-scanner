
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

export function isValidDate(dateString: string, format: string) : boolean {
    const dayjsDate = dayjs(dateString, format, true);
    return dayjsDate.isValid();
}

export function calculateAge(dateString: string, format: string) : number {
    const dayjsDate = dayjs(dateString, format);
    return dayjs().diff(dayjsDate, 'years');
}

export function calculateDaysUntil(date: Date): number {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return diff / (1000 * 60 * 60 * 24);
}

export function calculateDaysSince(date: Date): number {
    return calculateDaysUntil(date) * -1;
}