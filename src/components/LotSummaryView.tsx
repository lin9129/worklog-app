'use client'

import React, { useState } from 'react'
import { completeLot, deleteLotSummary } from '@/lib/actions'

interface Props {
    data: any[]
    mode?: 'ongoing' | 'completed'
}

export default function LotSummaryView({ data, mode = 'ongoing' }: Props) {
    const [expandedLot, setExpandedLot] = useState<string | null>(null)

    // Filter by mode
    const filteredData = data.filter(item => mode === 'completed' ? item.isCompleted : !item.isCompleted)

    const toggleExpand = (lotId: string) => {
        setExpandedLot(expandedLot === lotId ? null : lotId)
    }

    const handleComplete = async (id: string, lotNum: string) => {
        if (confirm(`ロット ${lotNum} を「完成」として登録しますか？`)) {
            await completeLot(id)
            alert('完成品表に移動しました')
        }
    }

    const handleDelete = async (id: string, lotNum: string) => {
        if (confirm(`ロット ${lotNum} の実績記録（集計行）を削除しますか？\n（個別の作業ログは削除されません）`)) {
            await deleteLotSummary(id)
            alert('削除しました')
        }
    }

    return (
        <div className="flex flex-col gap-6 animate-fade">
            <div className="glass overflow-hidden" style={{ borderRadius: '24px' }}>
                <table className="w-full text-left border-collapse">
                    <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <tr>
                            <th className="p-4">ロット番号</th>
                            <th className="p-4">商品名</th>
                            <th className="p-4">お客様名</th>
                            <th className="p-4">数量</th>
                            <th className="p-4">合計時間</th>
                            <th className="p-4">予定 / 残り</th>
                            {mode === 'ongoing' ? (
                                <>
                                    <th className="p-4">納期</th>
                                    <th className="p-4">アクション</th>
                                </>
                            ) : (
                                <>
                                    <th className="p-4">完成日</th>
                                    <th className="p-4">製作実績</th>
                                    <th className="p-4">アクション</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-secondary">表示するデータがありません</td>
                            </tr>
                        ) : (
                            filteredData.map((item) => (
                                <React.Fragment key={item.id}>
                                    <tr
                                        onClick={() => toggleExpand(item.id)}
                                        className="hover:bg-white/5 cursor-pointer border-t border-white/5 transition-colors"
                                    >
                                        <td className="p-4 font-bold">{item.lotNumber}</td>
                                        <td className="p-4">
                                            {item.productName}
                                            {item.remarks && <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>{item.remarks}</div>}
                                        </td>
                                        <td className="p-4 text-primary font-medium">{item.customerName || '-'}</td>
                                        <td className="p-4">{item.productionCount || 1}</td>
                                        <td className="p-4">
                                            <div className="font-bold">{(item.totalDuration / 60).toFixed(1)}h</div>
                                            <div style={{ fontSize: '0.65rem', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                                                <span style={{ opacity: 0.8 }}>正: {(item.fullTimeDuration / 60).toFixed(1)}h</span>
                                                <span style={{ opacity: 0.8 }}>パ: {(item.partTimeDuration / 60).toFixed(1)}h</span>
                                                <span className="text-danger">残業: {(item.totalOvertime / 60).toFixed(1)}h</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {item.productionTime ? (
                                                <>
                                                    <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>予定: {(item.productionTime / 60).toFixed(1)}h</div>
                                                    <div className="font-bold" style={{ color: (item.productionTime - item.totalDuration) < 0 ? '#ff4d4d' : '#4ade80' }}>
                                                        残り: {((item.productionTime - item.totalDuration) / 60).toFixed(1)}h
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="text-secondary">-</span>
                                            )}
                                        </td>
                                        {mode === 'ongoing' ? (
                                            <>
                                                <td className="p-4" style={{ fontSize: '0.9rem' }}>
                                                    {item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="p-4">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleComplete(item.id, item.lotNumber); }}
                                                        className="btn btn-sm"
                                                        style={{ background: 'var(--success)', color: 'white' }}
                                                    >
                                                        ✅ 完了
                                                    </button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="p-4" style={{ fontSize: '0.9rem' }}>
                                                    {item.completedAt ? new Date(item.completedAt).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold">{(item.totalDuration / 60).toFixed(1)}h</div>
                                                    <div style={{ fontSize: '0.65rem', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                                                        <span style={{ opacity: 0.8 }}>正: {(item.fullTimeDuration / 60).toFixed(1)}h</span>
                                                        <span style={{ opacity: 0.8 }}>パ: {(item.partTimeDuration / 60).toFixed(1)}h</span>
                                                        <span className="text-danger">残業: {(item.totalOvertime / 60).toFixed(1)}h</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {item.productionTime ? (
                                                        <div className="font-bold" style={{ color: (item.productionTime - item.totalDuration) < 0 ? '#ff4d4d' : '#4ade80' }}>
                                                            {((item.productionTime - item.totalDuration) / 60).toFixed(1)}h
                                                        </div>
                                                    ) : (
                                                        <span className="text-secondary">-</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id, item.lotNumber); }}
                                                        className="btn-icon"
                                                        title="削除"
                                                        style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}
                                                    >
                                                        🗑️
                                                    </button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                    {expandedLot === item.id && (
                                        <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                                            <td colSpan={8} className="p-4">
                                                <div className="animate-fade">
                                                    <h4 className="text-sm font-bold mb-3 border-b border-white/10 pb-1">👤 従事者別内訳</h4>
                                                    <div className="flex flex-wrap gap-4 mb-6">
                                                        {item.users.map((u: any) => (
                                                            <div key={u.name} className="glass-light p-3" style={{ borderRadius: '12px', minWidth: '120px', borderTop: u.employmentType === '正社員' ? '2px solid var(--primary)' : '2px solid var(--success)' }}>
                                                                <div className="text-xs text-secondary">{u.name} <span style={{fontSize: '0.6rem', opacity: 0.6}}>({u.employmentType || '未設定'})</span></div>
                                                                <div className="font-bold">{(u.duration / 60).toFixed(1)}h</div>
                                                                <div className="text-xs text-danger">残業: {(u.overtime / 60).toFixed(1)}h</div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <h4 className="text-sm font-bold mb-3 border-b border-white/10 pb-1">📅 日別ログ明細</h4>
                                                    <div className="flex flex-col gap-2">
                                                        {item.dates.map((d: any) => (
                                                            <div key={d.date} className="text-xs">
                                                                <div className="font-bold text-primary mb-1">{new Date(d.date).toLocaleDateString()} (計: {(d.dailyDuration / 60).toFixed(1)}h)</div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {d.logs.map((l: any, idx: number) => (
                                                                        <div key={idx} className="bg-white/5 p-2 rounded">
                                                                            {l.user.name}: {l.startTime}-{l.endTime || '??'} ({l.duration}分)
                                                                            {l.remarks && <span className="ml-2 text-secondary">/ {l.remarks}</span>}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}


