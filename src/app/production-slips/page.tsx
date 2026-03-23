'use client'

import { useState, useEffect } from 'react'
import { getMasterData, upsertProductionSlip, getActiveProductionSlips, deleteLotSummary } from '@/lib/actions'
import Link from 'next/link'

export default function ProductionSlipsPage() {
    const [masterData, setMasterData] = useState<any>(null)
    const [slips, setSlips] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDept, setSelectedDept] = useState('ALL')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 10

    // Form State
    const [lotNumber, setLotNumber] = useState('')
    const [productId, setProductId] = useState('')
    const [manualName, setManualName] = useState('')
    const [customerName, setCustomerName] = useState('')
    const [count, setCount] = useState('')
    const [targetTime, setTargetTime] = useState('')
    const [remarks, setRemarks] = useState('')
    const [deliveryDate, setDeliveryDate] = useState('')
    const [department, setDepartment] = useState('')

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const [m, s] = await Promise.all([getMasterData(), getActiveProductionSlips()])
            setMasterData(m)
            setSlips(s)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!lotNumber) return alert('ロット番号は必須です')

        const payload = {
            id: editingId,
            lotNumber,
            productId: productId || null,
            manualProductName: manualName || null,
            customerName,
            productionCount: count,
            productionTime: targetTime,
            remarks,
            deliveryDate,
            department: department || null
        }
        console.log('Client-side payload:', payload)

        setIsSubmitting(true)
        try {
            const result = await upsertProductionSlip(payload)
            if (!result.success) {
                alert(`エラー:\n${result.error || '不明なエラー'}`)
                return
            }
            alert(editingId ? '伝票を更新しました' : '伝票を登録しました')
            resetForm()
            loadData()
        } catch (err: any) {
            console.error('Unexpected error:', err)
            const msg = err?.message || JSON.stringify(err) || '不明なエラーです'
            alert(`予期しないエラー:\n${msg}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetForm = () => {
        setLotNumber('')
        setProductId('')
        setManualName('')
        setCustomerName('')
        setCount('')
        setTargetTime('')
        setRemarks('')
        setDeliveryDate('')
        setDepartment('')
        setEditingId(null)
    }

    const handleEdit = (slip: any) => {
        setEditingId(slip.id)
        setLotNumber(slip.lotNumber)
        setProductId(slip.productId || '')
        setManualName(slip.manualProductName || '')
        setCustomerName(slip.customerName || '')
        setCount(slip.productionCount?.toString() || '')
        setTargetTime(slip.productionTime?.toString() || '')
        setRemarks(slip.remarks || '')
        setDeliveryDate(slip.deliveryDate ? new Date(slip.deliveryDate).toISOString().split('T')[0] : '')
        setDepartment(slip.department || '')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleDelete = async (id: string, lotNum: string) => {
        if (!confirm(`製作伝票「${lotNum}」を削除しますか？\n※この操作は取り消せません。`)) return
        
        try {
            await deleteLotSummary(id)
            alert('削除しました')
            loadData()
        } catch (err: any) {
            alert(`削除に失敗しました: ${err?.message || '不明なエラー'}`)
        }
    }

    if (loading) return <div className="container p-8">読み込み中...</div>

    const filteredSlips = selectedDept === 'ALL' ? slips : slips.filter(s => s.department === selectedDept)
    const departments = Array.from(new Set(slips.map(s => s.department).filter(Boolean)))

    return (
        <main className="container animate-fade">
            <header className="header glass" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="title">製作伝票一覧表</h1>
                        <p className="subtitle">職長用：伝票の登録と管理</p>
                    </div>
                    <Link href="/" className="btn" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        ← 戻る
                    </Link>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Registration Form */}
                <div className="lg:col-span-1">
                    <section className="glass p-6" style={{ borderRadius: '20px' }}>
                        <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {editingId ? '✏️ 伝票を修正' : '📝 伝票新規登録'}
                        </h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div className="grid-2">
                                <div className="input-group">
                                    <label>ロット番号 / 製作No</label>
                                    <input type="text" value={lotNumber} onChange={e => setLotNumber(e.target.value)} placeholder="例: LOT-001" required />
                                </div>
                                <div className="input-group">
                                    <label>部署</label>
                                    <select value={department} onChange={e => setDepartment(e.target.value)}>
                                        <option value="">未設定</option>
                                        <option value="第一">第一</option>
                                        <option value="第二">第二</option>
                                        <option value="第三">第三</option>
                                        <option value="第四">第四</option>
                                    </select>
                                </div>
                            </div>

                             <div className="grid-2">
                                 <div className="input-group">
                                     <label>商品名 (マスタから選択)</label>
                                     <select value={productId} onChange={e => { setProductId(e.target.value); if (e.target.value) setManualName(''); }}>
                                         <option value="">-- 手入力する場合は空欄 --</option>
                                         {masterData?.products.map((p: any) => (
                                             <option key={p.id} value={p.id}>{p.name}</option>
                                         ))}
                                     </select>
                                 </div>
                                 {!productId && (
                                     <div className="input-group animate-fade-in">
                                         <label>商品名を手入力</label>
                                         <input 
                                             type="text" 
                                             value={manualName} 
                                             onChange={e => setManualName(e.target.value)} 
                                             placeholder="別注品名など" 
                                             required={!productId}
                                         />
                                     </div>
                                 )}
                                 <div className="input-group">
                                     <label>（手入力）お客様名</label>
                                     <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="〇〇様" />
                                 </div>
                             </div>

                            <div className="grid-3">
                                <div className="input-group">
                                    <label>製作数</label>
                                    <input type="number" value={count} onChange={e => setCount(e.target.value)} placeholder="1" />
                                </div>
                                <div className="input-group">
                                    <label>出荷・納期日</label>
                                    <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label>製作時間 (分)</label>
                                    <input type="number" value={targetTime} onChange={e => setTargetTime(e.target.value)} placeholder="60" />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>概要 (サイズ・特記事項)</label>
                                <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} placeholder="W1200 D600 など"></textarea>
                            </div>

                            <div className="flex gap-4">
                                <button type="submit" className="btn btn-primary flex-1 py-3" disabled={isSubmitting}>
                                    {isSubmitting ? '処理中...' : (editingId ? '内容を更新する' : '伝票を登録する')}
                                </button>
                                {editingId && (
                                    <button type="button" onClick={resetForm} className="btn py-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                        キャンセル
                                    </button>
                                )}
                            </div>
                        </form>
                    </section>
                </div>

                {/* Slip List */}
                <div className="lg:col-span-2">
                    <section className="glass p-6" style={{ borderRadius: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 className="card-title" style={{ marginBottom: 0 }}>📋 稼働中伝票一覧</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSelectedDept('ALL')}
                                    className={`btn btn-sm ${selectedDept === 'ALL' ? 'btn-primary' : ''}`}
                                    style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}
                                >
                                    全て
                                </button>
                                {['第一', '第二', '第三', '第四'].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setSelectedDept(d)}
                                        className={`btn btn-sm ${selectedDept === d ? 'btn-primary' : ''}`}
                                        style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Pagination Logic */}
                        {(() => {
                            const filtered = selectedDept === 'ALL' ? slips : slips.filter(s => s.department === selectedDept)
                            const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
                            const paginatedSlips = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

                            return (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ minWidth: '0' }}>
                                        {paginatedSlips.length === 0 ? (
                                            <p className="col-span-full text-center p-8 text-secondary">該当する伝票はありません</p>
                                        ) : (
                                            paginatedSlips.map(slip => (
                                                <div key={slip.id} className="glass-light p-4 flex flex-col justify-between" style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="badge" style={{ background: 'var(--primary)', color: 'white', fontSize: '0.7rem' }}>{slip.department || '共通'}</span>
                                                                <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{slip.lotNumber}</span>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => handleEdit(slip)}
                                                                    className="btn-icon-sm"
                                                                    title="編集"
                                                                    style={{ background: 'rgba(255,193,7,0.1)', color: '#ffc107', padding: '4px', borderRadius: '6px' }}
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(slip.id, slip.lotNumber)}
                                                                    className="btn-icon-sm"
                                                                    title="削除"
                                                                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '4px', borderRadius: '6px' }}
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.8rem' }}>
                                                            {slip.product?.name || slip.manualProductName}
                                                            {slip.customerName && <span style={{ marginLeft: '0.5rem', color: 'var(--primary)', fontSize: '0.85rem' }}>[{slip.customerName}様]</span>}
                                                        </div>
                                                        
                                                        {/* Details in white frame */}
                                                        <div style={{ 
                                                            background: 'white', 
                                                            color: '#333', 
                                                            padding: '0.8rem', 
                                                            borderRadius: '10px', 
                                                            fontSize: '0.85rem',
                                                            border: '1px solid #e2e8f0',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                                        }}>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                                <div><strong style={{ opacity: 0.7 }}>製作数:</strong> {slip.productionCount || 0}</div>
                                                                <div><strong style={{ opacity: 0.7 }}>納期:</strong> {slip.deliveryDate ? new Date(slip.deliveryDate).toLocaleDateString() : '未定'}</div>
                                                            </div>
                                                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', marginBottom: '0.5rem' }}>
                                                                <strong style={{ opacity: 0.7 }}>概要:</strong>
                                                                <div style={{ marginTop: '2px', wordBreak: 'break-all' }}>{slip.remarks || '特記事項なし'}</div>
                                                            </div>
                                                            {slip.productionTime && (
                                                                <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'right' }}>
                                                                    予定: {slip.productionTime}分
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div style={{ marginTop: '1rem' }}>
                                                        <Link
                                                            href={`/?lot=${slip.lotNumber}&pid=${slip.productId || ''}&manual=${encodeURIComponent(slip.manualProductName || '')}&customer=${encodeURIComponent(slip.customerName || '')}&dept=${encodeURIComponent(slip.department || '')}`}
                                                            className="btn btn-secondary w-full"
                                                            style={{ padding: '0.6rem', fontSize: '0.9rem', borderRadius: '10px' }}
                                                        >
                                                            記入画面へ ✍️
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="flex justify-center items-center gap-4 mt-8">
                                            <button 
                                                disabled={currentPage === 1}
                                                onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                className="btn btn-sm"
                                                style={{ background: 'rgba(255,255,255,0.05)', opacity: currentPage === 1 ? 0.3 : 1 }}
                                            >
                                                ◀ 前のページ
                                            </button>
                                            <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                                                {currentPage} / {totalPages}
                                            </span>
                                            <button 
                                                disabled={currentPage === totalPages}
                                                onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                className="btn btn-sm"
                                                style={{ background: 'rgba(255,255,255,0.05)', opacity: currentPage === totalPages ? 0.3 : 1 }}
                                            >
                                                次のページ ▶
                                            </button>
                                        </div>
                                    )}
                                </>
                            )
                        })()}
                    </section>
                </div>
            </div>
        </main>
    )
}
