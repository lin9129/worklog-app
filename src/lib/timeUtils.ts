/**
 * Time calculation utilities for break time exclusion and overtime tracking.
 */

export function formatJST(date: Date) {
    return new Intl.DateTimeFormat('ja-JP', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(date);
}

interface DurationResult {
    totalMinutes: number;
    overtimeMinutes: number;
}

const BREAKS = [
    { start: '10:00', end: '10:10' },
    { start: '12:00', end: '12:55' },
    { start: '15:00', end: '15:10' },
];

const OVERTIME_START = '17:15';

function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

export function calculateDuration(startTime: string, endTime: string | null, interruptionMinutes: number = 0): DurationResult {
    if (!endTime) return { totalMinutes: 0, overtimeMinutes: 0 };

    const start = timeToMinutes(startTime);
    let end = timeToMinutes(endTime);

    // Handle overnight work if necessary
    if (end < start) end += 24 * 60;

    const overtimeStartThreshold = timeToMinutes(OVERTIME_START);
    
    // 1. Total elapsed time (excluding breaks and manual interruption)
    let breakMinutes = 0;
    for (const b of BREAKS) {
        const breakStart = timeToMinutes(b.start);
        const breakEnd = timeToMinutes(b.end);
        const overlapStart = Math.max(start, breakStart);
        const overlapEnd = Math.min(end, breakEnd);
        if (overlapStart < overlapEnd) {
            breakMinutes += (overlapEnd - overlapStart);
        }
    }

    const netTotalMinutes = Math.max(0, end - start - breakMinutes - interruptionMinutes);

    // 2. Overtime calculation (17:15 onwards)
    // Overtime occurs only if end > 17:15.
    // If work started after 17:15, all work (minus breaks/interruption if any) is overtime.
    // However, specified breaks are all before 17:15.
    let overtimeMinutes = 0;
    if (end > overtimeStartThreshold) {
        const otRangeStart = Math.max(start, overtimeStartThreshold);
        overtimeMinutes = end - otRangeStart;
        // Since breaks are all before 17:15, we don't need to subtract breaks from overtimeMinutes.
        // But manual interruption might have happened during overtime.
        // For simplicity, we assume interruption is subtracted from regular time first.
    }

    // 3. Regular time is Total - Overtime
    const regularMinutes = Math.max(0, netTotalMinutes - overtimeMinutes);

    return {
        totalMinutes: regularMinutes, // In this app, 'duration' field is used for regular time
        overtimeMinutes: overtimeMinutes
    };
}