'use client'

import { useState } from 'react'
import { deleteWorkLog } from '@/lib/actions'

// WorkLogList Component

interface Props {
    logs: any[]
    products: any[]
}

export default function WorkLogList({ logs, products }: Props) {
    const [selectedProductId, setSelectedProductId] = useState('')
    const [lotFilter, setLotFilter] = useState('')

    const filteredLogs = logs.filter(log => {
        const matchesProduct = !selectedProductId || log.productId === selectedProductId
        const matchesLot = !lotFilter || (log.lotNumber && log.lotNumber.toLowerCase().includes(lotFilter.toLowerCase()))
        return matchesProduct && matchesLot
    })

    return (
        <section className="glass list-card">
            <div className="list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 className="card-title" style={{ marginBottom: 0 }}>📋 作業記録一覧</h2>

                <div className="filter-bar glass-light" style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 1rem', borderRadius: '12px', gap: '0.8rem' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>商品名で絞り込み:</span>
                    <select
                        className="filter-select"
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontWeight: '600', cursor: 'pointer', outline: 'none' }}
                    >
                        <option value="">すべて</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                <div className="filter-bar glass-light" style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 1rem', borderRadius: '12px', gap: '0.8rem' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>製作Noで検索:</span>
                    <input
                        type="text"
                        placeholder="Noを入力..."
                        value={lotFilter}
                        onChange={(e) => setLotFilter(e.target.value)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontWeight: '600', outline: 'none', width: '100px' }}
                    />
                </div>
            </div>

            <div className="log-list">
                {filteredLogs.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>記録が見つかりません</p>
                ) : (
                    filteredLogs.map((log) => (
                        <div key={log.id} className="log-item glass-light">
                            <div className={`status-indicator ${log.status === '完了' ? 'status-completed' : 'status-ongoing'}`}></div>
                            <div className="log-details">
                                <div className="log-main-info">
                                    <span className="log-date">{new Date(log.date).toLocaleDateString('ja-JP')}</span>
                                    <h3 className="log-product-part">
                                        <span className="product-name">{log.product?.name}</span>
                                        {log.lotNumber && <span className="badge" style={{ fontSize: '0.7rem', verticalAlign: 'middle', marginLeft: '0.5rem', background: 'rgba(255,255,255,0.1)' }}>No: {log.lotNumber}</span>}
                                        <span className="part-separator"> / </span>
                                        <span className="part-name">{log.part?.name}</span>
                                    </h3>
                                </div>
                                <div className="log-meta">
                                    <div className="meta-item">
                                        <span className="meta-label">工程</span>
                                        <span className="meta-value">{log.process?.name}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">担当者</span>
                                        <span className="meta-value">{log.user?.name}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">時間</span>
                                        <span className="meta-value">{log.startTime} 〜 {log.endTime || '-'}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">所要時間</span>
                                        <span className="meta-value" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                                            {log.duration !== null ? `${log.duration}分` : '-'}
                                        </span>
                                    </div>
                                </div>
                                {log.remarks && (
                                    <div className="log-remarks">
                                        <span className="remarks-icon">💬</span> {log.remarks}
                                    </div>
                                )}
                            </div>
                            <div className="log-status-badge" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                <span className={`badge ${log.status === '完了' ? 'badge-success' : 'badge-warning'}`}>
                                    {log.status}
                                </span>
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
                                    style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '0.9rem', padding: '0.2rem' }}
                                    className="hover-bg"
                                    title="削除"
                                >
                                    🗑️ 削除
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    )
}
