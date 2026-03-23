
const BREAKS = [
    { start: '10:00', end: '10:10' },
    { start: '12:00', end: '12:55' },
    { start: '15:00', end: '15:10' },
];
const OVERTIME_START = '17:15';

function timeToMinutes(time) {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

function calculateDuration(startTime, endTime, interruptionMinutes = 0) {
    if (!endTime) return { totalMinutes: 0, overtimeMinutes: 0 };
    const start = timeToMinutes(startTime);
    let end = timeToMinutes(endTime);
    if (end < start) end += 24 * 60;
    const overtimeStartThreshold = timeToMinutes(OVERTIME_START);
    let breakMinutes = 0;
    for (const b of BREAKS) {
        const breakStart = timeToMinutes(b.start);
        const breakEnd = timeToMinutes(b.end);
        const overlapStart = Math.max(start, breakStart);
        const overlapEnd = Math.min(end, breakEnd);
        if (overlapStart < overlapEnd) breakMinutes += (overlapEnd - overlapStart);
    }
    const netTotalMinutes = Math.max(0, end - start - breakMinutes - interruptionMinutes);
    let overtimeMinutes = 0;
    if (end > overtimeStartThreshold) {
        const otRangeStart = Math.max(start, overtimeStartThreshold);
        overtimeMinutes = end - otRangeStart;
    }
    const regularMinutes = Math.max(0, netTotalMinutes - overtimeMinutes);
    return { totalMinutes: regularMinutes, overtimeMinutes: overtimeMinutes };
}

function runTest(start, end, expectedReg, expectedOT) {
    const res = calculateDuration(start, end);
    const pass = res.totalMinutes === expectedReg && res.overtimeMinutes === expectedOT;
    console.log(`${pass ? 'PASS' : 'FAIL'} [${start}-${end}] Got: Reg=${res.totalMinutes}, OT=${res.overtimeMinutes} | Expected: Reg=${expectedReg}, OT=${expectedOT}`);
}

console.log("Starting tests...");
runTest("08:30", "17:15", 450, 0);   // 525 - 75 = 450. OT=0
runTest("08:30", "18:00", 450, 45);  // 570 - 75 = 495. OT: 18:00-17:15=45. Reg=495-45=450.
runTest("10:05", "12:30", 110, 0);   // 145 - (5+30) = 110. OT=0
runTest("17:00", "19:00", 15, 105);   // 120. OT: 19:00-17:15=105. Reg=120-105=15.
runTest("13:00", "17:30", 245, 15);   // 270 - 10 = 260. OT: 15. Reg=260-15=245.
console.log("Tests completed.");
