
import { calculateDuration } from './src/lib/timeUtils';

function test(start: string, end: string, interruption: number = 0) {
    const result = calculateDuration(start, end, interruption);
    console.log(`Test [${start} - ${end}, int: ${interruption}]: Regular: ${result.totalMinutes}m (${(result.totalMinutes/60).toFixed(1)}h), Overtime: ${result.overtimeMinutes}m (${(result.overtimeMinutes/60).toFixed(1)}h)`);
}

console.log("--- Testing Time Calculation ---");

// Standard 8:30 - 17:15 (Breaks: 10+55+10 = 75)
// Total elapsed: 525 min. Breaks: 75 min. Result: 450 min regular (7.5h)
test("08:30", "17:15"); 

// Standard 8:30 - 18:00
// Total elapsed: 570 min. Breaks: 75 min. 
// Overtime (after 17:15): 45 min.
// Net total: 570 - 75 = 495.
// Regular: 495 - 45 = 450 (7.5h). Overtime: 45.
test("08:30", "18:00");

// Overlap with breaks
// 10:05 - 12:30. 
// Break 1 (10:00-10:10) -> 5 min overlap.
// Break 2 (12:00-12:55) -> 30 min overlap.
// Total breaks: 35 min.
// Total elapsed: 145 min.
// Net total: 145 - 35 = 110.
// Regular: 110. Overtime: 0.
test("10:05", "12:30");

// Late start/Overtime
// 17:00 - 19:00.
// Overtime threshold 17:15.
// Overtime: 19:00 - 17:15 = 105 min.
// Total elapsed: 120 min. Breaks: 0.
// Net total: 120.
// Regular: 120 - 105 = 15 min. Overtime: 105 min.
test("17:00", "19:00");

// Afternoon only
// 13:00 - 17:30
// Total elapsed: 270 min.
// Break 3 (15:00-15:10) -> 10 min overlap.
// Overtime: 17:30 - 17:15 = 15 min.
// Net total: 270 - 10 = 260.
// Regular: 260 - 15 = 245 min. Overtime: 15 min.
test("13:00", "17:30");
