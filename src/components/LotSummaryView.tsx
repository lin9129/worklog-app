'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { completeLot, deleteLotSummary } from '@/lib/actions'

interface Props {
    data: any[]
    mode?: 'ongoing' | 'completed'
}

export default function LotSummaryView({ data, mode = 'ongoing' }: Props) {
    const router = useRouter()
    const [expandedLot, setExpandedLot] = useState<string | null>(null)
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, action: 'complete' | 'delete' | 'error' | 'success', id: string, lotNum: string, message: string }>({ isOpen: false, action: 'complete', id: '', lotNum: '', message: '' })
    const [selectedDept, setSelectedDept] = useState<string>('すべて')
    const [selectedStatus, setSelectedStatus] = useState<string>('すべて')

    const departments = ['すべて', '第一', '第二', '第三', '第四']
    const statuses = ['すべて', '製作中', '未着手']

    // Filter by mode, department and status
    const filteredData = data.filter(item => {
        const modeMatch = mode === 'completed' ? item.isCompleted : !item.isCompleted
        const deptMatch = selectedDept === 'すべて' || item.department === selectedDept
        const statusMatch = selectedStatus === 'すべて' || item.status === selectedStatus
        return modeMatch && deptMatch && statusMatch
    })

    const toggleExpand = (lotId: string) => {
        setExpandedLot(expandedLot === lotId ? null : lotId)
    }

    const handleCompleteClick = (id: string, lotNum: string) => {
        setConfirmModal({ isOpen: true, action: 'complete', id, lotNum, message: `ロット ${lotNum} を「完成」として登録しますか？` })
    }

    const handleDeleteClick = (id: string, lotNum: string) => {
        setConfirmModal({ isOpen: true, action: 'delete', id, lotNum, message: `ロット ${lotNum} の実績記録（集計行）を削除しますか？\n（個別の作業ログは削除されません）` })
    }

    const executeAction = async () => {
        const { action, id, lotNum } = confirmModal
        setConfirmModal({ ...confirmModal, isOpen: false })
        
        if (action === 'complete') {
            try {
                const res = await completeLot(id)
                if (res && res.success === false) {
                    setConfirmModal({ isOpen: true, action: 'error', id: '', lotNum: '', message: `エラー: ${res.error}` })
                    return
                }
                router.refresh()
                setConfirmModal({ isOpen: true, action: 'success', id: '', lotNum: '', message: 'データを更新しました。完成品表で確認できます。' })
            } catch (e: any) {
                setConfirmModal({ isOpen: true, action: 'error', id: '', lotNum: '', message: `エラーが発生しました: ${e.message}` })
            }
        } else if (action === 'delete') {
            try {
                await deleteLotSummary(id)
                router.refresh()
                setConfirmModal({ isOpen: true, action: 'success', id: '', lotNum: '', message: '削除しました' })
            } catch (e: any) {
                setConfirmModal({ isOpen: true, action: 'error', id: '', lotNum: '', message: `削除エラー: ${e.message}` })
            }
        }
    }

    return (
        <div className="flex flex-col animate-fade">
            {/* Integrated Header/Table Container */}
            <div className="glass overflow-hidden" style={{ borderRadius: '24px' }}>
                {/* Filter Header */}
                <div className="p-3 flex flex-wrap justify-between items-center gap-3 px-6" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex flex-wrap items-center gap-4">
                        <h2 className="card-title mb-0" style={{ fontSize: '1rem', whiteSpace: 'nowrap' }}>
                             {mode === 'ongoing' ? '📋 稼働中ロット (v1.3)' : '✅ 完成品実績 (v1.3)'}
                        </h2>
                        
                        <Link href="/calendar" className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.75rem' }}>
                            📅 カレンダーを表示
                        </Link>
                        
                        {/* Status Filter (Only for ongoing) */}
                        {mode === 'ongoing' && (
                            <div className="flex gap-1 items-center">
                                <span className="text-xs text-secondary mr-1">状態:</span>
                                <div className="flex gap-1">
                                    {statuses.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setSelectedStatus(s)}
                                            className={`btn btn-sm ${selectedStatus === s ? 'btn-primary' : ''}`}
                                            style={{ 
                                                fontSize: '0.75rem', 
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '6px',
                                                minWidth: '3.5rem'
                                            }}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-secondary mr-1">部署:</span>
                        <div className="flex gap-1">
                            {departments.map(dept => (
                                <button
                                    key={dept}
                                    onClick={() => setSelectedDept(dept)}
                                    className={`btn btn-sm ${selectedDept === dept ? 'btn-primary' : ''}`}
                                    style={{ 
                                        fontSize: '0.75rem', 
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '6px',
                                        minWidth: '3rem'
                                    }}
                                >
                                    {dept}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
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
                                    <th className="p-4">ステータス</th>
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
                                            <div className="font-bold">
                                                {(((item.totalRegular || 0) + (item.totalOvertime || 0)) / 60).toFixed(1)}h 
                                                <span style={{ fontWeight: 'normal', fontSize: '0.8rem', opacity: 0.7 }}>
                                                    ({(item.totalRegular || 0) + (item.totalOvertime || 0)}分)
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.65rem', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                                                <span style={{ opacity: 0.8 }}>通常計: {(item.totalRegular / 60).toFixed(1)}h ({item.totalRegular}分)</span>
                                                <span className="text-danger font-medium">残業計: {(item.totalOvertime / 60).toFixed(1)}h ({item.totalOvertime}分)</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {item.productionTime ? (
                                                <>
                                                    <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>予定: {(item.productionTime / 60).toFixed(1)}h</div>
                                                    <div className="font-bold" style={{ color: (item.productionTime - ((item.totalRegular || 0) + (item.totalOvertime || 0))) < 0 ? '#ff4d4d' : '#4ade80' }}>
                                                        残り: {((item.productionTime - ((item.totalRegular || 0) + (item.totalOvertime || 0))) / 60).toFixed(1)}h
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="text-secondary">-</span>
                                            )}
                                        </td>
                                        {mode === 'ongoing' ? (
                                            <>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                        item.status === '製作中' ? 'bg-warning/20 text-warning border border-warning/30' : 'bg-white/10 text-secondary border border-white/10'
                                                    }`}>
                                                        {item.status || '未設定'}
                                                    </span>
                                                </td>
                                                <td className="p-4" style={{ fontSize: '0.9rem' }} suppressHydrationWarning>
                                                    {item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                console.log('Complete btn clicked for', item.id);
                                                                handleCompleteClick(item.id, item.lotNumber); 
                                                            }}
                                                            className="btn btn-sm"
                                                            style={{ 
                                                                background: 'var(--success)', 
                                                                color: 'white', 
                                                                fontSize: '0.7rem', 
                                                                padding: '0.1rem 0.4rem',
                                                                borderRadius: '6px'
                                                            }}
                                                        >
                                                            ✅ 完了
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(item.id, item.lotNumber); }}
                                                            className="btn-icon-sm"
                                                            title="削除"
                                                            style={{ 
                                                                background: 'rgba(239,68,68,0.1)', 
                                                                color: '#ef4444', 
                                                                padding: '2px', 
                                                                borderRadius: '4px',
                                                                fontSize: '0.8rem'
                                                            }}
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="p-4" style={{ fontSize: '0.9rem' }} suppressHydrationWarning>
                                                    {item.completedAt ? new Date(item.completedAt).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold">
                                                        {(((item.totalRegular || 0) + (item.totalOvertime || 0)) / 60).toFixed(1)}h 
                                                        <span style={{ fontWeight: 'normal', fontSize: '0.8rem', opacity: 0.7 }}>
                                                            ({(item.totalRegular || 0) + (item.totalOvertime || 0)}分)
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '0.65rem', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                                                        <span style={{ opacity: 0.8 }}>通常計: {(item.totalRegular / 60).toFixed(1)}h ({item.totalRegular}分)</span>
                                                        <span className="text-danger font-medium">残業計: {(item.totalOvertime / 60).toFixed(1)}h ({item.totalOvertime}分)</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {item.productionTime ? (
                                                        <div className="font-bold" style={{ color: (item.productionTime - ((item.totalRegular || 0) + (item.totalOvertime || 0))) < 0 ? '#ff4d4d' : '#4ade80' }}>
                                                            {((item.productionTime - ((item.totalRegular || 0) + (item.totalOvertime || 0))) / 60).toFixed(1)}h
                                                        </div>
                                                    ) : (
                                                        <span className="text-secondary">-</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(item.id, item.lotNumber); }}
                                                    className="btn-icon-sm"
                                                    title="削除"
                                                    style={{ 
                                                        background: 'rgba(239,68,68,0.1)', 
                                                        color: '#ef4444', 
                                                        padding: '2px', 
                                                        borderRadius: '4px',
                                                        fontSize: '0.8rem'
                                                    }}
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
                                                                <div className="font-bold">{(u.duration / 60).toFixed(1)}h <span style={{ fontWeight: 'normal', fontSize: '0.7rem' }}>({u.duration}分)</span></div>
                                                                <div className="text-xs text-danger">残業: {(u.overtime / 60).toFixed(1)}h ({u.overtime}分)</div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <h4 className="text-sm font-bold mb-3 border-b border-white/10 pb-1">📅 日別ログ明細</h4>
                                                    <div className="flex flex-col gap-2">
                                                        {item.dates.map((d: any) => (
                                                            <div key={d.date} className="text-xs">
                                                                <div className="font-bold text-primary mb-1" suppressHydrationWarning>
                                                                    {new Date(d.date).toLocaleDateString()} (通常計: {(d.dailyDuration / 60).toFixed(1)}h / 残業計: {(d.dailyOvertime / 60).toFixed(1)}h)
                                                                </div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {d.logs.map((l: any, idx: number) => (
                                                                        <div key={idx} className="bg-white/5 p-2 rounded">
                                                                             {l.user?.name || '不明'}: {l.startTime}-{l.endTime || '??'} ({l.duration}分)
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
            
            {/* Custom Modal for Confirmation / Messages */}
            {confirmModal.isOpen && (
                <div className="modal-overlay" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>
                    <div className="modal-content glass p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
                        <h3 className="card-title border-b pb-2 mb-4">
                            {confirmModal.action === 'error' ? '⚠️ エラー' : 
                             confirmModal.action === 'success' ? '✅ 完了' : '確認'}
                        </h3>
                        <p className="mb-6 whitespace-pre-wrap">{confirmModal.message}</p>
                        
                        <div className="flex gap-4 justify-end">
                            {(confirmModal.action === 'complete' || confirmModal.action === 'delete') ? (
                                <>
                                    <button className="btn btn-secondary flex-1" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>キャンセル</button>
                                    <button className="btn btn-primary flex-1" onClick={executeAction}>OK</button>
                                </>
                            ) : (
                                <button className="btn btn-primary w-full" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>閉じる</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(4px);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 1000;
                }
                .modal-content { width: 90%; max-width: 400px; border-radius: 24px; }
            `}</style>
        </div>
    </div>
    )
}
