'use client'

import { useState, useEffect } from 'react'
import { createWorkLog } from '@/lib/actions'

interface Props {
    masterData: {
        users: any[]
        products: any[]
        processes: any[]
        parts: any[]
    }
}

export default function WorkLogForm({ masterData }: Props) {
    const [selectedProductId, setSelectedProductId] = useState('')
    const [availableParts, setAvailableParts] = useState<any[]>([])
    const [availableProcesses, setAvailableProcesses] = useState<any[]>([])
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [duration, setDuration] = useState<number | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [lotNumber, setLotNumber] = useState('')

    // Filter parts and processes when product changes
    useEffect(() => {
        if (selectedProductId) {
            setAvailableParts(masterData.parts.filter(p => p.productId === selectedProductId))
            const product = masterData.products.find(p => p.id === selectedProductId)
            setAvailableProcesses(product?.processes || [])
        } else {
            setAvailableParts([])
            setAvailableProcesses([])
        }
    }, [selectedProductId, masterData.parts, masterData.products])

    // Calculate duration automatically
    useEffect(() => {
        if (startTime && endTime) {
            const [startH, startM] = startTime.split(':').map(Number)
            const [endH, endM] = endTime.split(':').map(Number)
            let diff = (endH * 60 + endM) - (startH * 60 + startM)
            if (diff < 0) diff += 24 * 60
            setDuration(diff)
        } else {
            setDuration(null)
        }
    }, [startTime, endTime])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        const form = e.currentTarget
        const formData = new FormData(form)
        // Inject lotNumber from state since it's outside the form element
        formData.set('lotNumber', lotNumber)
        try {
            await createWorkLog(formData)
            // Reset form
            form.reset()
            setSelectedProductId('')
            setStartTime('')
            setEndTime('')
            setDuration(null)
            setLotNumber('')
            alert('作業ログを登録しました')
        } catch (error: any) {
            alert(`登録に失敗しました: ${error?.message || error}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section className="glass form-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.8rem' }}>
                <h2 className="card-title" style={{ marginBottom: 0 }}>🚀 新規作業入力</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontWeight: '600' }}>製作No</label>
                    <input
                        type="text"
                        value={lotNumber}
                        onChange={(e) => setLotNumber(e.target.value)}
                        placeholder="ロット番号"
                        style={{ width: '130px', padding: '0.4rem 0.7rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                    />
                </div>
            </div>
            <form id="work-log-form" onSubmit={handleSubmit} className="form-grid">
                <div className="input-group">
                    <label>日付</label>
                    <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                </div>

                <div className="input-group">
                    <label>担当者</label>
                    <select name="userId" required>
                        <option value="">選択してください</option>
                        {masterData.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>

                <div className="input-group">
                    <label>商品名</label>
                    <select
                        name="productId"
                        required
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                    >
                        <option value="">選択してください</option>
                        {masterData.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                <div className="input-group">
                    <label>部品名</label>
                    <select name="partId" required disabled={!selectedProductId}>
                        <option value="">{selectedProductId ? '選択してください' : '商品を選択してください'}</option>
                        {availableParts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                <div className="input-group">
                    <label>工程</label>
                    <select name="processId" required disabled={!selectedProductId}>
                        <option value="">{selectedProductId ? '選択してください' : '商品を選択してください'}</option>
                        {availableProcesses.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                <div className="input-group">
                    <label>開始時間</label>
                    <input
                        type="time"
                        name="startTime"
                        required
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                    />
                </div>

                <div className="input-group">
                    <label>終了時間</label>
                    <input
                        type="time"
                        name="endTime"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                    />
                </div>

                <div className="input-group">
                    <label>ステータス</label>
                    <select name="status" required>
                        <option value="作業中">作業中</option>
                        <option value="完了">完了</option>
                    </select>
                </div>

                <div className="input-group">
                    <label>所要時間</label>
                    <input
                        type="text"
                        value={duration !== null ? `${duration} 分` : '-'}
                        readOnly
                        style={{ backgroundColor: 'rgba(0,0,0,0.05)', cursor: 'not-allowed' }}
                    />
                </div>

                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label>備考</label>
                    <textarea name="remarks" rows={2} placeholder="特記事項があれば入力"></textarea>
                </div>

                <div style={{ gridColumn: '1 / -1', textAlign: 'right', marginTop: '1rem' }}>
                    <button type="submit" className="btn btn-primary btn-large" disabled={isSubmitting}>
                        {isSubmitting ? '登録中...' : '作業内容を保存する'}
                    </button>
                </div>
            </form>
        </section>
    )
}
