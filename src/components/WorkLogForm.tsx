'use client'

import { useState, useEffect, Suspense } from 'react'
import { createWorkLog, getActiveProductionSlips } from '@/lib/actions'
import { useSearchParams } from 'next/navigation'

interface Props {
    masterData: {
        users: any[]
        products: any[]
        processes: any[]
        parts: any[]
    }
}

function WorkLogFormInner({ masterData }: Props) {
    const searchParams = useSearchParams()

    // UI State
    const [selectedDept, setSelectedDept] = useState('')
    const [selectedSlipId, setSelectedSlipId] = useState('')
    const [isBespoke, setIsBespoke] = useState(false)
    const [activeSlips, setActiveSlips] = useState<any[]>([])

    // Form State
    const [userId, setUserId] = useState('')
    const [lotNumber, setLotNumber] = useState('')
    const [productId, setProductId] = useState('')
    const [manualProductName, setManualProductName] = useState('')
    const [customerName, setCustomerName] = useState('')
    const [partId, setPartId] = useState('')
    const [processName, setProcessName] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [status, setStatus] = useState('作業中')
    const [remarks, setRemarks] = useState('')
    const [date, setDate] = useState(() => {
        const d = new Date()
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        return `${yyyy}-${mm}-${dd}`
    })
    const [interruptionTime, setInterruptionTime] = useState('0')

    const [isSubmitting, setIsSubmitting] = useState(false)

    // Load URL params or Slips
    useEffect(() => {
        const lot = searchParams.get('lot')
        const pid = searchParams.get('pid')
        const manual = searchParams.get('manual')
        const customer = searchParams.get('customer')
        const dept = searchParams.get('dept')

        if (lot) setLotNumber(lot)
        if (pid) setProductId(pid)
        if (manual) {
            setManualProductName(manual)
            setIsBespoke(true)
        }
        if (customer) setCustomerName(customer)
        if (dept) setSelectedDept(dept)

        loadSlips(dept || '')
    }, [searchParams])

    async function loadSlips(dept: string) {
        try {
            const slips = await getActiveProductionSlips(dept || undefined)
            setActiveSlips(slips)
        } catch (e) {
            console.error(e)
        }
    }

    // Filter master data by dept
    const filteredUsers = selectedDept ? masterData.users.filter(u => u.department === selectedDept) : masterData.users
    const filteredProducts = selectedDept ? masterData.products.filter(p => p.department === selectedDept) : masterData.products

    const availableParts = productId ? masterData.parts.filter(p => p.productId === productId) : []
    const availableProcesses = (() => {
        if (partId) {
            const selectedPart = masterData.parts.find(p => p.id === partId)
            if (selectedPart && selectedPart.processes && selectedPart.processes.length > 0) {
                return selectedPart.processes
            }
        }
        if (productId) {
            return masterData.processes.filter(p => 
                p.products && p.products.some((prod: any) => prod.id === productId)
            )
        }
        return []
    })()

    const handleSlipSelect = (slipId: string) => {
        setSelectedSlipId(slipId)
        const slip = activeSlips.find(s => s.id === slipId)
        if (!slip) {
            setLotNumber('')
            setProductId('')
            setManualProductName('')
            setCustomerName('')
            setProcessName('')
            return
        }
        setLotNumber(slip.lotNumber)
        setProductId(slip.productId || '')
        setManualProductName(slip.manualProductName || '')
        setCustomerName(slip.customerName || '')
        setProcessName(slip.process?.name || '')
        setIsBespoke(!slip.productId)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        const formData = new FormData()
        formData.append('userId', userId)
        formData.append('productId', productId)
        formData.append('manualProductName', manualProductName)
        formData.append('customerName', customerName)
        formData.append('partId', partId)
        formData.append('processName', processName)
        formData.append('lotNumber', lotNumber)
        formData.append('date', date)
        formData.append('startTime', startTime)
        formData.append('endTime', endTime)
        formData.append('interruptionTime', interruptionTime)
        formData.append('status', status)
        formData.append('remarks', remarks)
        formData.append('department', selectedDept)

        try {
            await createWorkLog(formData)
            alert('登録しました')
            // Reset
            setLotNumber('')
            setProductId('')
            setManualProductName('')
            setCustomerName('')
            setPartId('')
            setProcessName('')
            setStartTime('')
            setEndTime('')
            setInterruptionTime('0')
            setRemarks('')
            setSelectedSlipId('')
        } catch (error: any) {
            alert(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const calculateDuration = () => {
        if (!startTime || !endTime) return null;
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        let diff = (end.getTime() - start.getTime()) / (1000 * 60);
        if (diff < 0) diff += 24 * 60;
        const result = diff - (parseInt(interruptionTime) || 0);
        return result > 0 ? result : 0;
    }

    const duration = calculateDuration();

    return (
        <section className="glass p-6" style={{ borderRadius: '24px' }}>
            <div className="flex flex-col gap-6">
                {/* Top: Dept and Slip Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-white/10">
                    <div className="input-group">
                        <label>🏁 部署を選択</label>
                        <select value={selectedDept} onChange={e => { setSelectedDept(e.target.value); loadSlips(e.target.value); }}>
                            <option value="">全ての部署</option>
                            <option value="第一">第一</option>
                            <option value="第二">第二</option>
                            <option value="第三">第三</option>
                            <option value="第四">第四</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label>📋 製作伝票(ロット)から選択</label>
                        <select value={selectedSlipId} onChange={e => handleSlipSelect(e.target.value)}>
                            <option value="">-- 伝票を選んで自動入力 --</option>
                            {activeSlips.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.lotNumber} : {s.product?.name || s.manualProductName} {s.customerName ? `(${s.customerName}様)` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="grid-4">
                        <div className="input-group">
                            <label>日付</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label>担当者</label>
                            <select value={userId} onChange={e => setUserId(e.target.value)} required>
                                <option value="">選択してください</option>
                                {filteredUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>商品名</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <select
                                    value={productId}
                                    onChange={e => {
                                        setProductId(e.target.value);
                                        if (e.target.value) setManualProductName('');
                                    }}
                                    style={{ width: '100%' }}
                                >
                                    <option value="">選択してください</option>
                                    {filteredProducts.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="input-group">
                            <label>部品名</label>
                            <select value={partId} onChange={e => setPartId(e.target.value)} disabled={!productId}>
                                {productId ? (
                                    <>
                                        <option value="">未選択</option>
                                        {availableParts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </>
                                ) : (
                                    <option value="">商品を選択してください</option>
                                )}
                            </select>
                        </div>
                    </div>

                    <div className="grid-4">
                        <div className="input-group">
                            <label>工程</label>
                            <select
                                value={availableProcesses.some((p: any) => p.name === processName) ? processName : ''}
                                onChange={e => setProcessName(e.target.value)}
                            >
                                <option value="">{productId ? (availableProcesses.length > 0 ? '工程を選択してください' : '該当する工程がありません') : '商品を選択してください'}</option>
                                {availableProcesses.map((p: any) => (
                                    <option key={p.id} value={p.name}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>開始時間</label>
                            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label>終了時間</label>
                            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label>中抜け(分)</label>
                            <input type="number" value={interruptionTime} onChange={e => setInterruptionTime(e.target.value)} min="0" step="5" />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                        <div className="input-group" style={{ minWidth: '150px' }}>
                            <label>所要時間</label>
                            <div className="duration-box">
                                {duration !== null ? `${duration}分` : '-'}
                            </div>
                        </div>
                        <div className="input-group" style={{ width: '150px' }}>
                            <label>ステータス</label>
                            <select value={status} onChange={e => setStatus(e.target.value)}>
                                <option value="作業中">作業中</option>
                                <option value="完了">完了</option>
                            </select>
                        </div>
                        <div className="input-group" style={{ flexGrow: 1 }}>
                            <label>ロット番号 / 製作No</label>
                            <input type="text" value={lotNumber} onChange={e => setLotNumber(e.target.value)} placeholder="ロット番号" />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>備考</label>
                        <textarea 
                            value={remarks} 
                            onChange={e => setRemarks(e.target.value)} 
                            placeholder="特記事項があれば入力"
                            rows={3}
                        />
                    </div>

                    {!productId && (
                         <div className="input-group">
                            <label>商品名を手入力 (マスタにない場合)</label>
                            <input
                                type="text"
                                value={manualProductName}
                                onChange={e => setManualProductName(e.target.value)}
                                placeholder="別注品名など"
                            />
                        </div>
                    )}

                    <div style={{ marginTop: '1rem' }}>
                        <button type="submit" className="btn btn-primary btn-large w-full py-4 text-lg" disabled={isSubmitting}>
                            {isSubmitting ? '登録中...' : '🚀 作業内容を保存する'}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    )
}

export default function WorkLogForm({ masterData }: Props) {
    return (
        <Suspense fallback={<div>Loading form...</div>}>
            <WorkLogFormInner masterData={masterData} />
        </Suspense>
    )
}
