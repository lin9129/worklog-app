'use client'

import { useState } from 'react'
import { createMasterItem, updateMasterItem, deleteMasterItem } from '@/lib/actions'

interface Props {
    masterData: {
        users: any[]
        products: any[]
        processes: any[]
        parts: any[]
    }
}

type Tab = 'product' | 'part' | 'process' | 'user'

export default function MasterManagement({ masterData }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('product')
    const [editingItem, setEditingItem] = useState<any>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form State
    const [name, setName] = useState('')
    const [productId, setProductId] = useState('')
    const [componentCategory, setComponentCategory] = useState('')
    const [employmentType, setEmploymentType] = useState('') // added
    const [selectedIds, setSelectedIds] = useState<string[]>([]) // For processes in product, or products in process

    const resetForm = () => {
        setEditingItem(null)
        setName('')
        setProductId('')
        setComponentCategory('')
        setEmploymentType('') // added
        setSelectedIds([])
    }

    const handleEdit = (item: any) => {
        setEditingItem(item)
        setName(item.name)
        if (activeTab === 'part') {
            setProductId(item.productId)
            setComponentCategory(item.componentCategory || '')
        }
        if (activeTab === 'user') {
            setEmploymentType(item.employmentType || '')
        }
        if (activeTab === 'product') setSelectedIds(item.processes?.map((p: any) => p.id) || [])
        if (activeTab === 'process') setSelectedIds(item.products?.map((p: any) => p.id) || [])
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const data: any = { name }
            if (activeTab === 'part') {
                data.productId = productId
                data.componentCategory = componentCategory || null
            }
            if (activeTab === 'user') {
                data.employmentType = employmentType || null
            }
            if (activeTab === 'product') data.processIds = selectedIds
            if (activeTab === 'process') data.productIds = selectedIds

            if (editingItem) {
                await updateMasterItem(activeTab, editingItem.id, data)
            } else {
                await createMasterItem(activeTab, data)
            }
            resetForm()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('本当に削除しますか？')) return
        try {
            await deleteMasterItem(activeTab, id)
        } catch (error: any) {
            alert(error.message)
        }
    }

    const toggleId = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const items = activeTab === 'process' ? masterData.processes : masterData[`${activeTab}s` as keyof typeof masterData] || []

    const renderItem = (item: any) => (
        <div key={item.id} className="glass-light" style={{ padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <div style={{ fontWeight: '600' }}>{item.name}</div>
                {activeTab === 'product' && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>工程数: {item.processes?.length || 0}</div>}
                {activeTab === 'part' && item.componentCategory && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>部位: {item.componentCategory}</div>}
                {activeTab === 'user' && item.employmentType && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>雇用形態: {item.employmentType}</div>}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => handleEdit(item)} className="btn-icon" title="編集">✏️</button>
                <button onClick={() => handleDelete(item.id)} className="btn-icon" title="削除">🗑️</button>
            </div>
        </div>
    )

    return (
        <div className="master-mgmt-container glass animate-fade" style={{ padding: '2rem', marginTop: '2rem' }}>
            <div className="tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                {(['product', 'part', 'process', 'user'] as Tab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); resetForm(); }}
                        className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                        style={{
                            padding: '0.5rem 1.5rem',
                            borderRadius: '20px',
                            border: 'none',
                            background: activeTab === tab ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                            color: activeTab === tab ? 'white' : 'var(--text-primary)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab === 'product' ? '商品' : tab === 'part' ? '部品' : tab === 'process' ? '工程' : '担当者'}
                    </button>
                ))}
            </div>

            <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* List Section */}
                <div className="list-section">
                    <h3 className="card-title" style={{ marginTop: 0 }}>
                        {activeTab === 'product' ? '商品一覧' : activeTab === 'part' ? '部品一覧' : activeTab === 'process' ? '工程一覧' : '担当者一覧'}
                    </h3>
                    <div className="item-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {(() => {
                            if (activeTab === 'part') {
                                const grouped = items.reduce((acc: any, item: any) => {
                                    const key = item.product?.name || '共通 (商品設定なし)'
                                    if (!acc[key]) acc[key] = []
                                    acc[key].push(item)
                                    return acc
                                }, {})

                                return Object.keys(grouped).sort().map(groupName => (
                                    <div key={groupName} style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.3rem' }}>
                                            {groupName}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                            {grouped[groupName].map((item: any) => renderItem(item))}
                                        </div>
                                    </div>
                                ))
                            }

                            if (activeTab === 'process') {
                                const grouped: Record<string, any[]> = {}
                                items.forEach((item: any) => {
                                    if (!item.products || item.products.length === 0) {
                                        if (!grouped['共通 (商品設定なし)']) grouped['共通 (商品設定なし)'] = []
                                        grouped['共通 (商品設定なし)'].push(item)
                                    } else {
                                        item.products.forEach((p: any) => {
                                            const key = p.name
                                            if (!grouped[key]) grouped[key] = []
                                            grouped[key].push(item)
                                        })
                                    }
                                })

                                return Object.keys(grouped).sort().map(groupName => (
                                    <div key={groupName} style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.3rem' }}>
                                            {groupName}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                            {grouped[groupName].map((item: any) => renderItem(item))}
                                        </div>
                                    </div>
                                ))
                            }

                            return <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>{items.map((item: any) => renderItem(item))}</div>
                        })()}
                    </div>
                </div>

                {/* Form Section */}
                <div className="form-section">
                    <h3 className="card-title" style={{ marginTop: 0 }}>{editingItem ? '編集' : '新規追加'}</h3>
                    <form onSubmit={handleSubmit} className="work-log-form glass-light" style={{ padding: '1.5rem', borderRadius: '15px' }}>
                        <div className="input-group" style={{ marginBottom: '1rem' }}>
                            <label>名称</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                placeholder="名称を入力"
                            />
                        </div>

                        {activeTab === 'part' && (
                            <>
                                <div className="input-group" style={{ marginBottom: '1rem' }}>
                                    <label>所属商品</label>
                                    <select value={productId} onChange={(e) => setProductId(e.target.value)} required>
                                        <option value="">選択してください</option>
                                        {masterData.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="input-group" style={{ marginBottom: '1rem' }}>
                                    <label>所属部材</label>
                                    <select value={componentCategory} onChange={(e) => setComponentCategory(e.target.value)} required>
                                        <option value="">選択してください</option>
                                        <option value="屋根">屋根</option>
                                        <option value="胴">胴</option>
                                        <option value="扉">扉</option>
                                        <option value="高欄">高欄</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {activeTab === 'user' && (
                            <div className="input-group" style={{ marginBottom: '1rem' }}>
                                <label>雇用形態</label>
                                <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
                                    <option value="">未規定</option>
                                    <option value="正社員">正社員</option>
                                    <option value="パート">パート</option>
                                </select>
                            </div>
                        )}

                        {activeTab === 'product' && (
                            <div className="input-group" style={{ marginBottom: '1rem' }}>
                                <label>関連工程</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', padding: '0.5rem' }}>
                                    {masterData.processes.map(p => (
                                        <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(p.id)}
                                                onChange={() => toggleId(p.id)}
                                            />
                                            {p.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'process' && (
                            <div className="input-group" style={{ marginBottom: '1rem' }}>
                                <label>関連商品</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', padding: '0.5rem' }}>
                                    {masterData.products.map(p => (
                                        <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(p.id)}
                                                onChange={() => toggleId(p.id)}
                                            />
                                            {p.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                                {isSubmitting ? '処理中...' : editingItem ? '更新する' : '追加する'}
                            </button>
                            {editingItem && (
                                <button type="button" onClick={resetForm} className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }}>
                                    キャンセル
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
