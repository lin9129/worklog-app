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

export function calculateDuration(
    startTime: string, 
    endTime: string | null, 
    manualInterruptionMinutes: number = 0, 
    interruptionIntervals: { start: string, end: string }[] = []
): DurationResult {
    if (!endTime) return { totalMinutes: 0, overtimeMinutes: 0 };

    const startTotal = timeToMinutes(startTime);
    let endTotal = timeToMinutes(endTime);

    // Handle overnight work (up to 24h)
    if (endTotal < startTotal) endTotal += 24 * 60;

    const overtimeStartThreshold = timeToMinutes(OVERTIME_START);
    
    // Convert all exclusions (Standard Breaks + User Interruptions) to minute ranges
    const exclusions = [...BREAKS, ...interruptionIntervals].map(b => ({
        start: timeToMinutes(b.start),
        end: timeToMinutes(b.end)
    }));

    // Handle overnight for exclusions if they appear to be relative to the work day
    // (In this app, standard BREAKS are always fixed day times, but user interruptions 
    // might cross midnight if the work day does. However, for simplicity and typical 
    // usage, we'll assume interruptions are within the work day range.)
    const normalizedExclusions = exclusions.map(ex => {
        let s = ex.start;
        let e = ex.end;
        if (e < s) e += 24 * 60;
        // If the exclusion is entirely before the work start, it might be for the next day's midnight
        if (e <= startTotal) {
            s += 24 * 60;
            e += 24 * 60;
        }
        return { s, e };
    });

    let totalRegularMinutes = 0;
    let totalOvertimeMinutes = 0;

    for (let m = startTotal; m < endTotal; m++) {
        // Check if this minute 'm' is within any exclusion
        const isExcluded = normalizedExclusions.some(ex => m >= ex.s && m < ex.e);
        if (isExcluded) continue;

        if (m >= overtimeStartThreshold) {
            totalOvertimeMinutes++;
        } else {
            totalRegularMinutes++;
        }
    }

    // Subtract manual additional interruption (subtract from regular first, then overtime)
    let remainingManual = manualInterruptionMinutes;
    if (remainingManual > 0) {
        const deductRegular = Math.min(totalRegularMinutes, remainingManual);
        totalRegularMinutes -= deductRegular;
        remainingManual -= deductRegular;
        
        if (remainingManual > 0) {
            const deductOvertime = Math.min(totalOvertimeMinutes, remainingManual);
            totalOvertimeMinutes -= deductOvertime;
        }
    }

    return {
        totalMinutes: Math.max(0, totalRegularMinutes),
        overtimeMinutes: Math.max(0, totalOvertimeMinutes)
    };
}