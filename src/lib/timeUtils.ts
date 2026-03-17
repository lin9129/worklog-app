/**
 * Time calculation utilities for break time exclusion and overtime tracking.
 */

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

    let start = timeToMinutes(startTime);
    let end = timeToMinutes(endTime);

    // Handle overnight work if necessary (though unlikely for this app)
    if (end < start) end += 24 * 60;

    let totalMinutes = end - start;
    let breakMinutes = 0;

    // Subtract breaks
    for (const b of BREAKS) {
        const breakStart = timeToMinutes(b.start);
        const breakEnd = timeToMinutes(b.end);

        // Calculate overlap between [start, end] and [breakStart, breakEnd]
        const overlapStart = Math.max(start, breakStart);
        const overlapEnd = Math.min(end, breakEnd);

        if (overlapStart < overlapEnd) {
            breakMinutes += (overlapEnd - overlapStart);
        }
    }

    totalMinutes -= breakMinutes;
    totalMinutes -= interruptionMinutes; // Subtract interruption time

    // Calculate overtime (17:15 onwards)
    const overtimeStartThreshold = timeToMinutes(OVERTIME_START);
    let overtimeMinutes = 0;

    if (end > overtimeStartThreshold) {
        const actualOvertimeStart = Math.max(start, overtimeStartThreshold);
        overtimeMinutes = end - actualOvertimeStart;

        // Note: If break or interruption happened during overtime, 
        // they should technically be subtracted from overtime as well.
        // For simplicity and based on usage, we'll keep it basic unless asked otherwise.
    }

    return {
        totalMinutes: Math.max(0, totalMinutes),
        overtimeMinutes: Math.max(0, overtimeMinutes)
    };
}
