<<<<<<< HEAD
'use client'

import { useState, useEffect } from 'react'
import { getMasterData, upsertProductionSlip, getActiveProductionSlips } from '@/lib/actions'
import Link from 'next/link'

export default function ProductionSlipsPage() {
    const [masterData, setMasterData] = useState<any>(null)
    const [slips, setSlips] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDept, setSelectedDept] = useState('ALL')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

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

                        <div className="flex flex-col gap-4">
                            {filteredSlips.length === 0 ? (
                                <p className="text-center p-8 text-secondary">該当する伝票はありません</p>
                            ) : (
                                filteredSlips.map(slip => (
                                    <div key={slip.id} className="glass-light p-4 flex justify-between items-center" style={{ borderRadius: '12px' }}>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="badge" style={{ background: 'var(--primary)', color: 'white', fontSize: '0.7rem' }}>{slip.department || '共通'}</span>
                                                <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{slip.lotNumber}</span>
                                            </div>
                                            <div style={{ fontSize: '1rem', fontWeight: '500' }}>
                                                {slip.product?.name || slip.manualProductName}
                                                {slip.customerName && <span style={{ marginLeft: '0.5rem', color: 'var(--primary)', fontSize: '0.9rem' }}>[{slip.customerName}様]</span>}
                                            </div>
                                            
                                            {/* Details in white frame */}
                                            <div style={{ 
                                                background: 'white', 
                                                color: '#333', 
                                                padding: '0.8rem', 
                                                borderRadius: '8px', 
                                                marginTop: '0.8rem',
                                                fontSize: '0.9rem',
                                                border: '1px solid #ddd'
                                            }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                    <div><strong>製作数:</strong> {slip.productionCount || 0}</div>
                                                    <div><strong>納期:</strong> {slip.deliveryDate ? new Date(slip.deliveryDate).toLocaleDateString() : '未定'}</div>
                                                </div>
                                                <div style={{ marginTop: '0.5rem', borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
                                                    <strong>概要:</strong> {slip.remarks || '特記事項なし'}
                                                </div>
                                                {slip.productionTime && (
                                                    <div style={{ marginTop: '0.3rem', fontSize: '0.8rem', color: '#666' }}>
                                                        予定製作時間: {slip.productionTime}分
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => handleEdit(slip)}
                                                className="btn btn-sm"
                                                style={{ background: 'rgba(255,193,7,0.2)', color: '#ffc107', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                            >
                                                編集 ✏️
                                            </button>
                                            <Link
                                                href={`/?lot=${slip.lotNumber}&pid=${slip.productId || ''}&manual=${encodeURIComponent(slip.manualProductName || '')}&customer=${encodeURIComponent(slip.customerName || '')}&dept=${encodeURIComponent(slip.department || '')}`}
                                                className="btn btn-secondary btn-sm"
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                            >
                                                記入 ✍️
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </main>
    )
}
=======
'use client'

import { useState, useEffect } from 'react'
import { getMasterData, upsertProductionSlip, getActiveProductionSlips } from '@/lib/actions'
import Link from 'next/link'

export default function ProductionSlipsPage() {
    const [masterData, setMasterData] = useState<any>(null)
    const [slips, setSlips] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDept, setSelectedDept] = useState('ALL')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

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

                        <div className="flex flex-col gap-4">
                            {filteredSlips.length === 0 ? (
                                <p className="text-center p-8 text-secondary">該当する伝票はありません</p>
                            ) : (
                                filteredSlips.map(slip => (
                                    <div key={slip.id} className="glass-light p-4 flex justify-between items-center" style={{ borderRadius: '12px' }}>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="badge" style={{ background: 'var(--primary)', color: 'white', fontSize: '0.7rem' }}>{slip.department || '共通'}</span>
                                                <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{slip.lotNumber}</span>
                                            </div>
                                            <div style={{ fontSize: '1rem', fontWeight: '500' }}>
                                                {slip.product?.name || slip.manualProductName}
                                                {slip.customerName && <span style={{ marginLeft: '0.5rem', color: 'var(--primary)', fontSize: '0.9rem' }}>[{slip.customerName}様]</span>}
                                            </div>
                                            
                                            {/* Details in white frame */}
                                            <div style={{ 
                                                background: 'white', 
                                                color: '#333', 
                                                padding: '0.8rem', 
                                                borderRadius: '8px', 
                                                marginTop: '0.8rem',
                                                fontSize: '0.9rem',
                                                border: '1px solid #ddd'
                                            }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                    <div><strong>製作数:</strong> {slip.productionCount || 0}</div>
                                                    <div><strong>納期:</strong> {slip.deliveryDate ? new Date(slip.deliveryDate).toLocaleDateString() : '未定'}</div>
                                                </div>
                                                <div style={{ marginTop: '0.5rem', borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
                                                    <strong>概要:</strong> {slip.remarks || '特記事項なし'}
                                                </div>
                                                {slip.productionTime && (
                                                    <div style={{ marginTop: '0.3rem', fontSize: '0.8rem', color: '#666' }}>
                                                        予定製作時間: {slip.productionTime}分
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => handleEdit(slip)}
                                                className="btn btn-sm"
                                                style={{ background: 'rgba(255,193,7,0.2)', color: '#ffc107', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                            >
                                                編集 ✏️
                                            </button>
                                            <Link
                                                href={`/?lot=${slip.lotNumber}&pid=${slip.productId || ''}&manual=${encodeURIComponent(slip.manualProductName || '')}&customer=${encodeURIComponent(slip.customerName || '')}&dept=${encodeURIComponent(slip.department || '')}`}
                                                className="btn btn-secondary btn-sm"
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                            >
                                                記入 ✍️
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </main>
    )
}
>>>>>>> ff5b9c9 (fix: all errors and guards)
