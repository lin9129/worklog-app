'use client'

import React, { useState, useMemo } from 'react'
import { toggleHoliday } from '@/lib/actions'

interface Props {
    data: any[]
    initialHolidays: string[]
}

const getJSTDateString = (d: Date | string | number | null): string => {
    if (!d) return '';
    const srcDate = new Date(d);
    if (isNaN(srcDate.getTime())) return '';
    
    // 確実な YYYY-MM-DD 形式の生成（ブラウザ依存排除）
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric', month: '2-digit', day: '2-digit'
    });
    const parts = formatter.formatToParts(srcDate);
    const yr = parts.find(p => p.type === 'year')?.value;
    const mo = parts.find(p => p.type === 'month')?.value;
    const da = parts.find(p => p.type === 'day')?.value;
    return `${yr}-${mo}-${da}`;
};

const departmentColors: Record<string, string> = {
    '第一': '#3b82f6',
    '第二': '#10b981',
    '第三': '#f59e0b',
    '第四': '#8b5cf6',
    'すべて': '#9ca3af',
}

export default function WorkCalendar({ data, initialHolidays }: Props) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [holidays, setHolidays] = useState<Set<string>>(new Set(initialHolidays))
    const [modalLot, setModalLot] = useState<any | null>(null)
    const [isUpdating, setIsUpdating] = useState(false)

    const lots = useMemo(() => {
        // 全てのロット（開始日があるか、未着手でも納期があるもの）を表示
        return data.filter(item => item.startDate || item.dueDate)
    }, [data])

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const weeks = useMemo(() => {
        const firstDayOfMonth = new Date(year, month, 1)
        const lastDayOfMonth = new Date(year, month + 1, 0)
        
        const startOffset = firstDayOfMonth.getDay()
        const calendarStart = new Date(year, month, 1 - startOffset)
        
        const endOffset = 6 - lastDayOfMonth.getDay()
        const cEnd = new Date(lastDayOfMonth);
        cEnd.setDate(cEnd.getDate() + endOffset);
        
        const dayList: string[] = []
        let current = new Date(calendarStart)
        while (current <= cEnd) {
            dayList.push(getJSTDateString(current))
            current.setDate(current.getDate() + 1)
        }
        
        const weeklyChunks: string[][] = []
        for (let i = 0; i < dayList.length; i += 7) {
            weeklyChunks.push(dayList.slice(i, i + 7))
        }
        return weeklyChunks
    }, [year, month])

    const todayStr = getJSTDateString(new Date())

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

    const handleHolidayClick = async (dateStr: string) => {
        if (isUpdating) return;
        setIsUpdating(true);
        const newSet = new Set(holidays);
        if (newSet.has(dateStr)) {
            newSet.delete(dateStr);
        } else {
            newSet.add(dateStr);
        }
        setHolidays(newSet);
        
        await toggleHoliday(dateStr);
        setIsUpdating(false);
    }

    const getDeptOvertimeContext = (dept: string) => {
        const relevantLogs = data.filter(i => i.department === dept).flatMap(i => i.dailyLogs || []);
        let todayOt = 0;
        let weekOt = 0;
        const weekAgo = new Date(todayStr + 'T00:00:00Z');
        weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];

        relevantLogs.forEach(l => {
            if (l.date === todayStr) todayOt += l.overtimeMinutes;
            if (l.date >= weekAgoStr && l.date <= todayStr) weekOt += l.overtimeMinutes;
        })

        return { todayOt, weekOt };
    }

    // 曜日の定義
    const weekDays = [
        { label: '日', color: '#ef4444' },
        { label: '月', color: '#4b5563' },
        { label: '火', color: '#4b5563' },
        { label: '水', color: '#4b5563' },
        { label: '木', color: '#4b5563' },
        { label: '金', color: '#4b5563' },
        { label: '土', color: '#3b82f6' }
    ]

    return (
        <div className="animate-fade" style={{ fontFamily: 'sans-serif', color: '#1f2937' }}>
            <div className="glass" style={{ marginBottom: '1rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '250px' }}>
                    <button onClick={prevMonth} className="btn btn-sm" style={{ border: '1px solid #d1d5db', background: '#fff', color: '#374151' }}>◀ 前月</button>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>{year}年 {month + 1}月</h2>
                    <button onClick={nextMonth} className="btn btn-sm" style={{ border: '1px solid #d1d5db', background: '#fff', color: '#374151' }}>次月 ▶</button>
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    💡 日付の丸枠をクリックすると休日を登録・解除できます（日曜日除く）
                </div>
            </div>

            {/* 本体のカレンダーグリッド */}
            <div className="calendar-main-container">
                 {/* Header Row */}
                 <div className="grid-row-7" style={{ background: '#f9fafb' }}>
                     {weekDays.map((d, i) => (
                         <div key={d.label} className="day-header" style={{ color: d.color }}>
                             {d.label}
                         </div>
                     ))}
                 </div>

                 {/* Weeks Display */}
                 {weeks.map((week, weekIdx) => {
                     const weekStart = week[0]
                     const weekEnd = week[6]

                     // イベント抽出
                     const overlappingLots = lots.filter(lot => {
                         const lotStart = lot.startDate
                         const lotEnd = lot.estimatedEndDate || lotStart
                         const hasDueThisWeek = lot.dueDate && lot.dueDate >= weekStart && lot.dueDate <= weekEnd
                         
                         const hasBarThisWeek = lotStart && lotEnd && lotStart <= weekEnd && lotEnd >= weekStart
                         
                         return hasBarThisWeek || hasDueThisWeek
                     })

                     // ソート
                     overlappingLots.sort((a, b) => {
                         const aStart = a.startDate || a.dueDate || ''
                         const bStart = b.startDate || b.dueDate || ''
                         const aEnd = a.estimatedEndDate || aStart
                         const bEnd = b.estimatedEndDate || bStart
                         
                         const aLen = new Date(aEnd).getTime() - new Date(aStart).getTime()
                         const bLen = new Date(bEnd).getTime() - new Date(bStart).getTime()
                         if (aLen !== bLen) return bLen - aLen;
                         return aStart.localeCompare(bStart);
                     })

                     // スタッキング (Row Slot Allocation)
                     const rowTaken: boolean[][] = [] 
                     const slotAssignments = overlappingLots.map(lot => {
                         const lotStart = lot.startDate!
                         const lotEnd = lot.estimatedEndDate || lotStart
                         
                         let startIdx = lotStart ? week.findIndex(d => d === lotStart) : -1
                         if (startIdx === -1) startIdx = (lotStart && lotStart < weekStart) ? 0 : 6
                         
                         let endIdx = lotEnd ? week.findIndex(d => d === lotEnd) : -1
                         if (endIdx === -1) endIdx = (lotEnd && lotEnd > weekEnd) ? 6 : 0

                         // If the lot only has a dueDate this week but the bar itself doesn't overlap,
                         // we still assign it a rowIndex so the flag doesn't overlap with other flags/bars.
                         // But for drawing the bar itself, if it doesn't overlap, we shouldn't draw the bar.
                         const hasBarThisWeek = lotStart && lotEnd && lotStart <= weekEnd && lotEnd >= weekStart;

                         let r = 0;
                         while (true) {
                             if (!rowTaken[r]) rowTaken[r] = [false, false, false, false, false, false, false];
                             let conflict = false;
                             
                             if (hasBarThisWeek) {
                                 for (let i = startIdx; i <= endIdx; i++) {
                                     if (rowTaken[r][i]) { conflict = true; break; }
                                 }
                             } else if (lot.dueDate && week.includes(lot.dueDate)) {
                                 // Only taking up the due date slot
                                 const dueIdx = week.indexOf(lot.dueDate);
                                 if (rowTaken[r][dueIdx]) conflict = true;
                             }

                             if (!conflict) {
                                 if (hasBarThisWeek) {
                                     for (let i = startIdx; i <= endIdx; i++) rowTaken[r][i] = true;
                                 } else if (lot.dueDate && week.includes(lot.dueDate)) {
                                     rowTaken[r][week.indexOf(lot.dueDate)] = true;
                                 }
                                 break;
                             }
                             r++;
                         }
                         return { lot, startIdx, endIdx, rowIndex: r, hasBarThisWeek }
                     })

                     // 自動拡張
                     const maxRows = Math.max(rowTaken.length, 1)
                     const rowHeightPixels = Math.max(100, maxRows * 24 + 36) 

                     return (
                         <div key={`week-${weekIdx}`} className="grid-row-7 week-row" style={{ height: `${rowHeightPixels}px` }}>
                             
                             {/* 背景セル */}
                             {week.map((d, colIdx) => {
                                 const isSun = colIdx === 0
                                 const isSat = colIdx === 6
                                 const isHol = holidays.has(d)
                                 const isOtherMonth = parseInt(d.split('-')[1]) !== month + 1
                                 const isToday = d === todayStr

                                 let bgColor = '#ffffff';
                                 if (isToday) bgColor = '#eff6ff'; // blue-50
                                 else if (isSun || isHol) bgColor = '#fef2f2'; // red-50
                                 else if (isOtherMonth) bgColor = '#f3f4f6'; // gray-100

                                 let textColor = '#374151';
                                 if ((isSun || isHol) && !isOtherMonth) textColor = '#ef4444';
                                 else if (isSat && !isOtherMonth) textColor = '#3b82f6';
                                 else if (isOtherMonth) textColor = '#9ca3af';

                                 // この週にまたがるロットのうち、この日が納期または完成日のものを抽出
                                 const dueLotsOnThisDay = overlappingLots.filter(l => l.dueDate === d)
                                 const completedLotsOnThisDay = overlappingLots.filter(l => l.completedAt === d)

                                 return (
                                     <div key={d} className="day-cell" style={{ backgroundColor: bgColor, position: 'relative' }}>
                                        {/* 左上から順に納期・完成フラグを配置 */}
                                        {(dueLotsOnThisDay.length > 0 || completedLotsOnThisDay.length > 0) && (
                                            <div className="absolute top-[28px] left-[4px] flex flex-col gap-[2px] z-[50]">
                                                {dueLotsOnThisDay.map(lot => (
                                                    <div 
                                                        key={'due-'+lot.id} 
                                                        className="text-[14px] cursor-pointer hover:scale-110 transition-transform filter drop-shadow inline-flex items-center"
                                                        title={`🚩 納期: ${lot.dueDate} \n[${lot.lotNumber}] ${lot.productName}`}
                                                        onClick={(e) => { e.stopPropagation(); setModalLot(lot); }}
                                                    >
                                                        🚩
                                                    </div>
                                                ))}
                                                {completedLotsOnThisDay.map(lot => (
                                                    <div 
                                                        key={'comp-'+lot.id} 
                                                        className="text-[14px] cursor-pointer hover:scale-110 transition-transform filter drop-shadow inline-flex items-center"
                                                        title={`✅ 完成: ${lot.completedAt} \n[${lot.lotNumber}] ${lot.productName}`}
                                                        onClick={(e) => { e.stopPropagation(); setModalLot(lot); }}
                                                    >
                                                        ✅
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div 
                                            className={`day-number ${isToday ? 'is-today' : ''} ${!isToday && !isSun ? 'clickable-day' : ''}`}
                                            title="休日登録・解除 (クリック)"
                                            style={{ color: isToday ? '#fff' : textColor }}
                                            onClick={() => !isSun && handleHolidayClick(d)}
                                        >
                                            {parseInt(d.split('-')[2])}
                                        </div>
                                     </div>
                                 )
                             })}

                             {/* バー描画 (Absolute Layers - independent overlay) */}
                             <div className="bars-layer">
                                 {slotAssignments.map(({ lot, startIdx, endIdx, rowIndex, hasBarThisWeek }) => {
                                     // 休日をスキップするためにセグメントを分割する
                                     const segments: { startDayIdx: number, endDayIdx: number, isOverdue: boolean }[] = []
                                     if (hasBarThisWeek) {
                                         let currentStart = startIdx;
                                         while (currentStart <= endIdx) {
                                             const dayStr = week[currentStart]
                                             const isSun = new Date(dayStr).getDay() === 0
                                             if (isSun || holidays.has(dayStr)) {
                                                 currentStart++;
                                                 continue;
                                             }

                                             // 納期遅れ or 予算オーバー（工数超過）の判定
                                             const isCurrentDayOverdue = (lot.originalEstimatedEndDate && dayStr > lot.originalEstimatedEndDate) || 
                                                                        (lot.overrunDate && dayStr >= lot.overrunDate);

                                             let currentEnd = currentStart;
                                             while (currentEnd < endIdx) {
                                                 const nextDayStr = week[currentEnd + 1]
                                                 if (new Date(nextDayStr).getDay() === 0 || holidays.has(nextDayStr)) break;

                                                 // 次の日が予定終了日時を跨いでステータスが変わる場合はそこでセグメントを割る
                                                 const isNextDayOverdue = (lot.originalEstimatedEndDate && nextDayStr > lot.originalEstimatedEndDate) ||
                                                                         (lot.overrunDate && nextDayStr >= lot.overrunDate);
                                                 if (isNextDayOverdue !== isCurrentDayOverdue) break;

                                                 currentEnd++;
                                             }
                                             segments.push({ startDayIdx: currentStart, endDayIdx: currentEnd, isOverdue: isCurrentDayOverdue })
                                             currentStart = currentEnd + 1;
                                         }
                                     }

                                     const pRate = Math.min(100, Math.max(0, lot.progressRate || 0))

                                     return (
                                         <React.Fragment key={lot.id}>
                                             {/* ガントバーの各セグメント（休日をまたぐと複数になる） */}
                                             {segments.map((seg, segIdx) => {
                                                 const subSpan = seg.endDayIdx - seg.startDayIdx + 1
                                                 const leftPct = (seg.startDayIdx / 7) * 100
                                                 const widthPct = (subSpan / 7) * 100
                                                 
                                                 let segmentFillPct = 0;
                                                 const lotStart = lot.startDate!
                                                 const lotEnd = lot.estimatedEndDate || lotStart
                                                 const startMs = new Date(lotStart + 'T00:00:00Z').getTime()
                                                 const endMs = new Date(lotEnd + 'T00:00:00Z').getTime()
                                                 
                                                 const visualTotalDays = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1)
                                                 const completedDays = visualTotalDays * (pRate / 100)
                                                 
                                                 const segmentStartMs = new Date(week[seg.startDayIdx] + 'T00:00:00Z').getTime()
                                                 const offsetFromStartDays = Math.round((segmentStartMs - startMs) / (1000 * 60 * 60 * 24))
                                                 const filledLengthInSegment = Math.max(0, Math.min(subSpan, completedDays - offsetFromStartDays))
                                                 segmentFillPct = (filledLengthInSegment / subSpan) * 100

                                                 const isFirstSeg = segIdx === 0
                                                 const isFinalSegment = lot.estimatedEndDate === week[seg.endDayIdx]
                                                 const isOriginalFinalSegment = lot.originalEstimatedEndDate === week[seg.endDayIdx]
                                                 const isOverdue = seg.isOverdue
                                                 let segBgCol = isOverdue ? '#ef4444' : (departmentColors[lot.department] || '#9ca3af')
                                                 
                                                 // 完成済みなら少し薄くする
                                                 const opacity = lot.isCompleted ? 0.6 : 1

                                                 return (
                                                     <div 
                                                         key={`seg-${segIdx}`}
                                                         className="gantt-bar"
                                                         style={{
                                                             left: `calc(${leftPct}% + 4px)`,
                                                             top: `${rowIndex * 24 + 2}px`, 
                                                             width: `calc(${widthPct}% - 8px)`, 
                                                             backgroundColor: segBgCol,
                                                             opacity: opacity,
                                                         }}
                                                         title={`[${lot.lotNumber}] ${lot.productName} \n進捗: ${lot.progressRate}% \n予定: ${lot.originalEstimatedEndDate}\n期限: ${lot.dueDate || '未設定'}`}
                                                         onClick={(e) => { e.stopPropagation(); setModalLot(lot); }}
                                                     >
                                                         <div className="bar-progress" style={{ width: `${segmentFillPct}%` }} />
                                                         
                                                         <div className="bar-label">
                                                             <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block' }}>
                                                                 {(isFirstSeg && (lot.startDate >= weekStart || seg.startDayIdx === 0)) ? lot.productName : ''}
                                                             </span>
                                                             <span style={{ flexShrink: 0, paddingLeft: '4px' }}>
                                                                 {isOriginalFinalSegment && '🎯'} {isOverdue && isFinalSegment && '⚠️'} {lot.isCompleted && isFinalSegment && '✅'}
                                                             </span>
                                                         </div>
                                                     </div>
                                                 )
                                             })}

                                         </React.Fragment>
                                     )
                                 })}
                             </div>
                         </div>
                     )
                 })}
            </div>

            {/* モーダル表示 */}
            {modalLot && (
                <div className="modal-overlay" onClick={() => setModalLot(null)}>
                    <div className="custom-modal" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 0.25rem 0', color: '#111827' }}>{modalLot.productName}</h3>
                                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                    <span>ロット: <strong>{modalLot.lotNumber}</strong></span>
                                    <span>数量: <strong>{modalLot.productionCount || 1}</strong></span>
                                    <span style={{ padding: '0.125rem 0.5rem', background: '#f3f4f6', borderRadius: '4px', fontSize: '0.75rem', color: '#4b5563', border: '1px solid #e5e7eb' }}>
                                        {modalLot.department || '未設定'}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setModalLot(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#9ca3af' }}>✕</button>
                        </div>
                        
                        <div className="modal-scroll-area">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #f3f4f6' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>⏰ 総合時間（通常 / 残業）</div>
                                    <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827' }}>
                                        {(modalLot.actualMinutes/60).toFixed(1)}h / <span style={{ color: '#ef4444' }}>{(modalLot.totalOvertime/60).toFixed(1)}h</span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                                        予定: {(modalLot.plannedMinutes/60).toFixed(1)}h
                                    </div>
                                </div>
                                <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #f3f4f6' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>🏢 部署負担（{modalLot.department}）</div>
                                    <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                                        今日残業: <strong style={{ color: '#ef4444' }}>{(getDeptOvertimeContext(modalLot.department).todayOt/60).toFixed(1)}h</strong>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                                        7日残業: <strong style={{ color: '#ef4444' }}>{(getDeptOvertimeContext(modalLot.department).weekOt/60).toFixed(1)}h</strong>
                                    </div>
                                </div>
                            </div>

                            <h4 style={{ fontWeight: 'bold', marginBottom: '0.75rem', paddingLeft: '0.5rem', borderLeft: '4px solid #3b82f6', color: '#1f2937' }}>作業者別 日次ログ</h4>
                            {(!modalLot.dailyLogs || modalLot.dailyLogs.length === 0) ? (
                                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>作業ログがありません</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {modalLot.dailyLogs.sort((a:any, b:any) => b.date.localeCompare(a.date)).map((log: any, idx: number) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#f9fafb', borderRadius: '4px', fontSize: '0.875rem', border: '1px solid #f3f4f6' }}>
                                            <div>
                                                <span style={{ color: '#2563eb', fontWeight: 'bold', marginRight: '0.75rem' }}>{log.date.substring(5)}</span>
                                                <span style={{ color: '#374151' }}>👤 {log.workerName}</span>
                                            </div>
                                            <div style={{ textAlign: 'right', color: '#374151' }}>
                                                <span style={{ fontWeight: 'bold' }}>{(log.normalMinutes/60).toFixed(1)}h</span>
                                                {log.overtimeMinutes > 0 && (
                                                    <span style={{ color: '#ef4444', marginLeft: '0.5rem', fontWeight: 'bold' }}>+{(log.overtimeMinutes/60).toFixed(1)}h</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setModalLot(null)}>閉じる</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                /* Container Settings */
                .calendar-main-container {
                    background: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 0.5rem;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                
                /* Layout */
                .grid-row-7 {
                    display: grid;
                    grid-template-columns: repeat(7, minmax(0, 1fr));
                    border-bottom: 1px solid #e5e7eb;
                }
                .week-row {
                    position: relative;
                }
                .week-row:last-child {
                    border-bottom: none;
                }
                
                /* Cells */
                .day-header {
                    text-align: center;
                    padding: 0.5rem 0;
                    font-size: 0.875rem;
                    font-weight: bold;
                    border-right: 1px solid #e5e7eb;
                }
                .day-header:last-child,
                .day-cell:last-child {
                    border-right: none;
                }
                .day-cell {
                    border-right: 1px solid #e5e7eb;
                    padding: 0.25rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    transition: background-color 0.2s;
                }
                
                /* Date Numbers */
                .day-number {
                    font-size: 12px;
                    font-weight: bold;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    user-select: none;
                }
                .day-number.is-today {
                    background-color: #2563eb;
                }
                .day-number.clickable-day:hover {
                    background-color: rgba(0,0,0,0.05);
                    cursor: pointer;
                }
                
                /* Absolute Container */
                .bars-layer {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    pointer-events: none;
                    padding-top: 32px;
                }
                
                /* Gantt Bar Styles */
                .gantt-bar {
                    position: absolute;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                    pointer-events: auto;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                    border: 1px solid rgba(0,0,0,0.1);
                    overflow: hidden;
                    height: 20px;
                    min-width: 6px;
                    transition: opacity 0.2s;
                }
                .gantt-bar:hover {
                    opacity: 0.9;
                }
                .bar-progress {
                    height: 100%;
                    background-color: rgba(0,0,0,0.2);
                }
                .bar-label {
                    position: absolute;
                    inset: 0;
                    padding: 0 0.4rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-weight: bold;
                    color: white;
                    font-size: 11px;
                    pointer-events: none;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                }

                /* Modal Specifics */
                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.4); backdrop-filter: blur(2px);
                    display: flex; align-items: center; justify-content: center; z-index: 1000;
                }
                .custom-modal {
                    width: 90%; max-width: 500px;
                    background: #ffffff;
                    border-radius: 16px;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    max-height: 90vh;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                }
                .modal-scroll-area {
                    flex: 1;
                    overflow-y: auto;
                    padding-right: 0.5rem;
                }
                .modal-scroll-area::-webkit-scrollbar { width: 6px; }
                .modal-scroll-area::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
                .modal-scroll-area::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
            `}</style>
        </div>
    )
}
