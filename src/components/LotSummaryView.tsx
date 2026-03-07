'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveLotSummary, deleteWorkLog } from '@/lib/actions'

interface Props {
    initialData: any[]
}

export default function LotSummaryView({ initialData }: Props) {
    const router = useRouter()
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
    const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
    const [expandedTimeRows, setExpandedTimeRows] = useState<Set<string>>(new Set())
    const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set())

    // Local state for inputs to allow smooth typing before blur
    const [inputValues, setInputValues] = useState<Record<string, { count: string, time: string }>>({})

    const toggleRow = (key: string) => {
        const newSet = new Set(expandedRows)
        if (newSet.has(key)) newSet.delete(key)
        else newSet.add(key)
        setExpandedRows(newSet)
    }

    const toggleDate = (key: string) => {
        const newSet = new Set(expandedDates)
        if (newSet.has(key)) newSet.delete(key)
        else newSet.add(key)
        setExpandedDates(newSet)
    }

    const toggleTimeRow = (key: string) => {
        const newSet = new Set(expandedTimeRows)
        if (newSet.has(key)) newSet.delete(key)
        else newSet.add(key)
        setExpandedTimeRows(newSet)
    }

    const handleInputChange = (key: string, field: 'count' | 'time', value: string) => {
        setInputValues(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value
            }
        }))
    }

    const handleBlur = async (key: string, lotNumber: string, productId: string) => {
        const currentVals = inputValues[key]
        if (!currentVals) return // No changes

        setSavingKeys(prev => new Set(prev).add(key))
        try {
            const count = currentVals.count ? parseInt(currentVals.count, 10) : null
            const time = currentVals.time ? parseInt(currentVals.time, 10) : null
            await saveLotSummary(lotNumber, productId, count, time)
            router.refresh()
        } catch (error) {
            console.error('Failed to save summary:', error)
            alert('保存に失敗しました')
        } finally {
            setSavingKeys(prev => {
                const next = new Set(prev)
                next.delete(key)
                return next
            })
        }
    }

    const formatTime = (mins: number) => {
        if (!mins) return '0時間00分'
        const h = Math.floor(Math.abs(mins) / 60)
        const m = Math.abs(mins) % 60
        const sign = mins < 0 ? '-' : ''
        return `${sign}${h}時間${m.toString().padStart(2, '0')}分`
    }

    return (
        <div className="lot-summary-container glass animate-fade" style={{ padding: '2rem', marginTop: '2rem', overflowX: 'auto' }}>
            <h2 className="card-title">ロット別 集計</h2>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid var(--glass-border)', color: 'var(--primary)' }}>
                        <th style={{ padding: '1rem 0.5rem', width: '40px' }}></th>
                        <th style={{ padding: '1rem 0.5rem' }}>製作No</th>
                        <th style={{ padding: '1rem 0.5rem' }}>商品名</th>
                        <th style={{ padding: '1rem 0.5rem', width: '120px' }}>制作台数</th>
                        <th style={{ padding: '1rem 0.5rem', width: '120px' }}>制作時間(分)</th>
                        <th style={{ padding: '1rem 0.5rem' }}>実作業時間</th>
                        <th style={{ padding: '1rem 0.5rem' }}>残り時間</th>
                    </tr>
                </thead>
                <tbody>
                    {initialData.map((group) => {
                        const lotKey = `${group.lotNumber}|${group.productId}`
                        const isExpanded = expandedRows.has(lotKey)
                        const isTimeExpanded = expandedTimeRows.has(lotKey)
                        const isSaving = savingKeys.has(lotKey)

                        // Use local state if user is typing, else use server data
                        const vals = inputValues[lotKey] || {
                            count: group.productionCount !== null ? String(group.productionCount) : '',
                            time: group.productionTime !== null ? String(group.productionTime) : ''
                        }

                        // Calculate remaining time
                        const targetTime = vals.time ? parseInt(vals.time, 10) : 0
                        const actualTime = group.totalDuration || 0
                        const remainingTime = targetTime - actualTime

                        return (
                            <React.Fragment key={lotKey}>
                                {/* Main Row (Lot + Product) */}
                                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: '0.8rem 0.5rem' }}>
                                        <button
                                            onClick={() => toggleRow(lotKey)}
                                            style={{
                                                background: 'transparent', border: 'none', color: 'var(--primary)',
                                                cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                width: '30px', height: '30px', borderRadius: '50%'
                                            }}
                                            className="hover-bg"
                                        >
                                            {isExpanded ? '−' : '＋'}
                                        </button>
                                    </td>
                                    <td style={{ padding: '0.8rem 0.5rem' }}>
                                        <span className="badge" style={{ background: 'var(--glass-bg)', color: 'var(--text-primary)' }}>
                                            {group.lotNumber || '未設定'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.8rem 0.5rem', fontWeight: 'bold' }}>{group.productName}</td>
                                    <td style={{ padding: '0.8rem 0.5rem' }}>
                                        <input
                                            type="number"
                                            value={vals.count}
                                            onChange={(e) => handleInputChange(lotKey, 'count', e.target.value)}
                                            onBlur={() => handleBlur(lotKey, group.lotNumber, group.productId)}
                                            placeholder="0"
                                            className="inline-input"
                                            style={{ width: '80px', padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                                            disabled={isSaving}
                                        />
                                    </td>
                                    <td style={{ padding: '0.8rem 0.5rem' }}>
                                        <input
                                            type="number"
                                            value={vals.time}
                                            onChange={(e) => handleInputChange(lotKey, 'time', e.target.value)}
                                            onBlur={() => handleBlur(lotKey, group.lotNumber, group.productId)}
                                            placeholder="0"
                                            className="inline-input"
                                            style={{ width: '80px', padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                                            disabled={isSaving}
                                        />
                                    </td>
                                    <td style={{ padding: '0.8rem 0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span>{formatTime(actualTime)}</span>
                                            <button
                                                onClick={() => toggleTimeRow(lotKey)}
                                                style={{
                                                    background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                                                    cursor: 'pointer', fontSize: '0.9rem', padding: '0.2rem', borderRadius: '4px'
                                                }}
                                                className="hover-bg"
                                                title="内訳を表示"
                                            >
                                                {isTimeExpanded ? '▲' : '▼'}
                                            </button>
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.8rem 0.5rem', fontWeight: 'bold', color: remainingTime < 0 ? '#ff6b6b' : (remainingTime > 0 ? '#51cf66' : 'var(--text-primary)') }}>
                                        {formatTime(remainingTime)}
                                    </td>
                                </tr>

                                {/* Drill-down Time Breakdown */}
                                {isTimeExpanded && (
                                    <tr style={{ background: 'var(--glass-bg)' }}>
                                        <td colSpan={7} style={{ padding: 0 }}>
                                            <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>

                                                <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px', minWidth: '200px' }}>
                                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>雇用形態別</h4>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.95rem' }}>
                                                        <span>正社員:</span>
                                                        <strong>{formatTime(group.fullTimeDuration || 0)}</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                                                        <span>パート:</span>
                                                        <strong>{formatTime(group.partTimeDuration || 0)}</strong>
                                                    </div>
                                                </div>

                                                <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px', minWidth: '300px', flex: 1 }}>
                                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>担当者別</h4>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                                                        {group.users?.map((u: any, idx: number) => (
                                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.2rem' }}>
                                                                <span>{u.name}</span>
                                                                <strong>{formatTime(u.duration)}</strong>
                                                            </div>
                                                        ))}
                                                        {!group.users?.length && (
                                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>担当者データなし</div>
                                                        )}
                                                    </div>
                                                </div>

                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {/* Drill-down Dates */}
                                {isExpanded && group.dates.map((dateGroup: any) => {
                                    const dateKey = `${lotKey}|${dateGroup.date}`
                                    const isDateExpanded = expandedDates.has(dateKey)

                                    return (
                                        <React.Fragment key={dateKey}>
                                            <tr style={{ background: 'var(--glass-bg)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                                <td style={{ padding: '0.5rem' }}>
                                                    <button
                                                        onClick={() => toggleDate(dateKey)}
                                                        style={{
                                                            background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                                                            cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            width: '30px', height: '30px', marginLeft: '0.5rem'
                                                        }}
                                                    >
                                                        {isDateExpanded ? '▼' : '▶'}
                                                    </button>
                                                </td>
                                                <td colSpan={4} style={{ padding: '0.8rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                                    {dateGroup.date}
                                                </td>
                                                <td style={{ padding: '0.8rem 0.5rem', color: 'var(--text-secondary)' }}>
                                                    {formatTime(dateGroup.dailyDuration)}
                                                </td>
                                                <td></td>
                                            </tr>

                                            {/* Drill-down Logs */}
                                            {isDateExpanded && (
                                                <tr>
                                                    <td colSpan={7} style={{ padding: 0 }}>
                                                        <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1rem 1rem 1rem 4rem', borderBottom: '1px solid var(--glass-border)' }}>
                                                            <table style={{ width: '100%', fontSize: '0.9rem' }}>
                                                                <thead>
                                                                    <tr style={{ color: 'var(--text-secondary)' }}>
                                                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>担当者</th>
                                                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>工程</th>
                                                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>部品・部位</th>
                                                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>開始時間</th>
                                                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>終了時間</th>
                                                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>作業時間</th>
                                                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>操作</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {dateGroup.logs.map((log: any) => (
                                                                        <tr key={log.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                                                            <td style={{ padding: '0.5rem' }}>{log.user?.name || '-'}</td>
                                                                            <td style={{ padding: '0.5rem' }}>{log.process?.name || '-'}</td>
                                                                            <td style={{ padding: '0.5rem' }}>
                                                                                {log.part?.name || '-'}
                                                                                {log.part?.componentCategory ? ` (${log.part.componentCategory})` : ''}
                                                                            </td>
                                                                            <td style={{ padding: '0.5rem' }}>{log.startTime}</td>
                                                                            <td style={{ padding: '0.5rem' }}>{log.endTime || '-'}</td>
                                                                            <td style={{ padding: '0.5rem' }}>{formatTime(log.duration || 0)}</td>
                                                                            <td style={{ padding: '0.5rem' }}>
                                                                                <button
                                                                                    onClick={async () => {
                                                                                        if (confirm('この作業記録を削除しますか？')) {
                                                                                            try {
                                                                                                await deleteWorkLog(log.id)
                                                                                            } catch (e: any) {
                                                                                                alert(e.message)
                                                                                            }
                                                                                        }
                                                                                    }}
                                                                                    style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '0.8rem', padding: '0.2rem' }}
                                                                                    className="hover-bg"
                                                                                    title="記録を削除"
                                                                                >
                                                                                    🗑️ 削除
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    )
                                })}
                            </React.Fragment>
                        )
                    })}
                    {initialData.length === 0 && (
                        <tr>
                            <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                集計データがありません
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}
