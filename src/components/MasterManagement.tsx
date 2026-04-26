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
    const [employmentType, setEmploymentType] = useState('')
    const [department, setDepartment] = useState('')
    const [category, setCategory] = useState('')
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [selectedPartIds, setSelectedPartIds] = useState<string[]>([])
    const [expandedProcessId, setExpandedProcessId] = useState<string | null>(null)
    const [selectedPartListProductId, setSelectedPartListProductId] = useState<string>('')

    const resetForm = () => {
        setEditingItem(null)
        setName('')
        setProductId('')
        setComponentCategory('')
        setEmploymentType('')
        setDepartment('')
        setCategory('')
        setSelectedIds([])
        setSelectedPartIds([])
    }

    const handleEdit = (item: any) => {
        setEditingItem(item)
        setName(item.name)
        setDepartment(item.department || '')
        if (activeTab === 'part') {
            setProductId(item.productId)
            setComponentCategory(item.componentCategory || '')
        }
        if (activeTab === 'user') {
            setEmploymentType(item.employmentType || '')
        }
        if (activeTab === 'product') {
            setCategory(item.category || '')
            setSelectedIds(item.processes?.map((p: any) => p.id) || [])
        }
        if (activeTab === 'process') {
            setSelectedIds(item.products?.map((p: any) => p.id) || [])
            setSelectedPartIds(item.parts?.map((p: any) => p.id) || [])
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const data: any = { name, department: department || null }
            if (activeTab === 'part') {
                data.productId = productId
                data.componentCategory = componentCategory || null
            }
            if (activeTab === 'user') {
                data.employmentType = employmentType || null
            }
            if (activeTab === 'product') {
                data.category = category || null
                data.processIds = selectedIds
            }
            if (activeTab === 'process') {
                data.productIds = selectedIds
                data.partIds = selectedPartIds
            }

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
            const result = await deleteMasterItem(activeTab, id)
            if (result && !result.success) {
                alert(result.error)
            }
        } catch (error: any) {
            alert(error.message)
        }
    }

    const toggleId = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const items = (activeTab === 'process' ? masterData.processes : masterData[`${activeTab}s` as keyof typeof masterData] || []).sort((a: any, b: any) => {
        const nameA = a?.name || ''
        const nameB = b?.name || ''
        if (activeTab === 'user') {
            const DEPT_ORDER: Record<string, number> = { '第一': 1, '第二': 2, '第三': 3, '第四': 4 };
            const orderA = DEPT_ORDER[a?.department || ''] || 99;
            const orderB = DEPT_ORDER[b?.department || ''] || 99;
            if (orderA !== orderB) return orderA - orderB;
            return nameA.localeCompare(nameB, 'ja');
        }
        return nameA.localeCompare(nameB, 'ja');
    })

    const renderItem = (item: any) => {
        const isExpanded = expandedProcessId === item.id && activeTab === 'process'
        
        return (
            <div key={item.id} className="glass-light" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div 
                        style={{ cursor: activeTab === 'process' ? 'pointer' : 'default', flex: 1 }} 
                        onClick={() => activeTab === 'process' && setExpandedProcessId(isExpanded ? null : item.id)}
                    >
                        <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {activeTab === 'process' && <span>{isExpanded ? '▼' : '▶'}</span>}
                            {item.name}
                        </div>
                        <div className="flex gap-2 mt-1">
                            {activeTab !== 'product' && item.department && <span className="badge" style={{ background: 'var(--primary)', color: 'white', fontSize: '0.65rem' }}>{item.department}</span>}
                            {activeTab === 'product' && item.category && <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', fontSize: '0.65rem' }}>{item.category}</span>}
                            {activeTab === 'process' && item.products?.length > 0 && <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.65rem' }}>商品: {item.products.length}</span>}
                            {activeTab === 'process' && item.parts?.length > 0 && <span className="badge" style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80', fontSize: '0.65rem' }}>部品: {item.parts.length}</span>}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleEdit(item)} className="btn-icon" title="編集">✏️</button>
                        <button onClick={() => handleDelete(item.id)} className="btn-icon" title="削除">🗑️</button>
                    </div>
                </div>
                {isExpanded && item.products && item.products.length > 0 && (
                    <div style={{ padding: '0 1rem 0.5rem 2rem', fontSize: '0.85rem', opacity: 0.8 }}>
                        <div style={{ color: 'var(--secondary)', marginBottom: '0.3rem', fontSize: '0.75rem' }}>関連商品:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {item.products.map((p: any) => (
                                <span key={p.id} className="badge" style={{ background: 'rgba(255,255,255,0.05)' }}>{p.name}</span>
                            ))}
                        </div>
                    </div>
                )}
                {isExpanded && item.parts && item.parts.length > 0 && (
                    <div style={{ padding: '0 1rem 1rem 2rem', fontSize: '0.85rem', opacity: 0.8 }}>
                        <div style={{ color: 'var(--secondary)', marginBottom: '0.3rem', fontSize: '0.75rem' }}>関連部品:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {item.parts.map((p: any) => (
                                <span key={p.id} className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--primary)' }}>{p.product?.name}: {p.name}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    const renderPartList = () => {
        const filteredParts = selectedPartListProductId
            ? masterData.parts.filter(p => p.productId === selectedPartListProductId)
            : masterData.parts

        if (selectedPartListProductId && filteredParts.length === 0) {
            return (
                <div style={{ textAlign: 'center', opacity: 0.5, padding: '2rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                    この商品に登録されている部品はありません。
                </div>
            )
        }

        const groupedByProduct = filteredParts.reduce((acc: any, part: any) => {
            const prodName = part.product?.name || '不明な商品'
            if (!acc[prodName]) acc[prodName] = {}
            
            const catName = part.componentCategory || '未設定'
            if (!acc[prodName][catName]) acc[prodName][catName] = []
            
            acc[prodName][catName].push(part)
            return acc
        }, {})

        return Object.entries(groupedByProduct).map(([prodName, categories]: [string, any]) => (
            <div key={prodName} style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.8rem', borderLeft: '4px solid var(--primary)', paddingLeft: '0.7rem', color: 'var(--primary)' }}>{prodName}</h4>
                {Object.entries(categories).map(([catName, parts]: [string, any]) => (
                    <div key={catName} style={{ marginBottom: '1.2rem', marginLeft: '1rem' }}>
                        <h5 style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.3rem 0.6rem', borderRadius: '6px' }}>
                            <span style={{ fontSize: '0.9rem' }}>📁</span> {catName}
                        </h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '0.5rem' }}>
                            {parts.map((item: any) => renderItem(item))}
                        </div>
                    </div>
                ))}
            </div>
        ))
    }

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
                <div className="list-section">
                    <h3 className="card-title" style={{ marginTop: 0 }}>
                        {activeTab === 'product' ? '商品一覧' : activeTab === 'part' ? '部品一覧' : activeTab === 'process' ? '工程一覧' : '担当者一覧'}
                    </h3>

                    {activeTab === 'part' && (
                        <div className="input-group" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <label style={{ fontSize: '0.85rem', opacity: 0.7, whiteSpace: 'nowrap' }}>表示商品で絞り込む:</label>
                            <select 
                                value={selectedPartListProductId} 
                                onChange={(e) => setSelectedPartListProductId(e.target.value)}
                                style={{ flex: 1, padding: '0.4rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.9rem' }}
                            >
                                <option value="">すべて表示</option>
                                {masterData.products.sort((a,b) => (a?.name || '').localeCompare(b?.name || '', 'ja')).map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="item-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {activeTab === 'part' ? renderPartList() : items.map((item: any) => renderItem(item))}
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="card-title" style={{ marginTop: 0 }}>{editingItem ? '編集' : '新規追加'}</h3>
                    <form onSubmit={handleSubmit} className="work-log-form glass-light" style={{ padding: '1.5rem', borderRadius: '15px' }}>
                        {activeTab === 'part' && (
                            <>
                                <div className="input-group" style={{ marginBottom: '1rem' }}>
                                    <label>所属商品</label>
                                    <select value={productId} onChange={(e) => setProductId(e.target.value)} required>
                                        <option value="">選択してください</option>
                                        {masterData.products.map((p: any) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-group" style={{ marginBottom: '1rem' }}>
                                    <label>所属部材（カテゴリ）</label>
                                    <select 
                                        value={componentCategory} 
                                        onChange={(e) => {
                                            setComponentCategory(e.target.value);
                                            setName(''); // カテゴリが変わったら名称をクリア
                                        }}
                                    >
                                        <option value="">選択してください</option>
                                        <option value="屋根">屋根</option>
                                        <option value="胴">胴</option>
                                        <option value="扉">扉</option>
                                        <option value="土台">土台</option>
                                        <option value="高欄">高欄</option>
                                        <option value="その他">その他</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <div className="input-group" style={{ marginBottom: '1rem' }}>
                            <label>名称</label>
                            <input
                                type="text"
                                list={activeTab === 'part' ? "part-names-list" : undefined}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                placeholder="名称を入力"
                            />
                            {activeTab === 'part' && (
                                <datalist id="part-names-list">
                                    {Array.from(new Set(
                                        masterData.parts
                                            .filter(p => !componentCategory || p.componentCategory === componentCategory)
                                            .map(p => p.name)
                                    )).sort().map(n => (
                                        <option key={n} value={n} />
                                    ))}
                                </datalist>
                            )}
                        </div>

                        {(activeTab === 'user' || activeTab === 'part') && (
                            <div className="input-group" style={{ marginBottom: '1rem' }}>
                                <label>部署</label>
                                <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                                    <option value="">未設定</option>
                                    <option value="第一">第一</option>
                                    <option value="第二">第二</option>
                                    <option value="第三">第三</option>
                                    <option value="第四">第四</option>
                                </select>
                            </div>
                        )}

                        {activeTab === 'product' && (
                            <>
                                <div className="input-group" style={{ marginBottom: '1rem' }}>
                                    <label>種別</label>
                                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                                        <option value="">未設定</option>
                                        <option value="神棚">神棚</option>
                                        <option value="神具">神具</option>
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

                        {/* 工程：関連商品チェックボックス */}
                        {activeTab === 'process' && (
                            <div className="input-group" style={{ marginBottom: '1rem' }}>
                                <label>関連商品</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', padding: '0.5rem' }}>
                                    {masterData.products.map((p: any) => (
                                        <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleId(p.id)} />
                                            {p.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 工程：関連部品チェックボックス */}
                        {activeTab === 'process' && selectedIds.length > 0 && (
                            <div className="input-group" style={{ marginBottom: '1rem' }}>
                                <label>関連部品 (選択中の商品に紐付く部品)</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    {masterData.parts
                                        .filter(p => selectedIds.includes(p.productId))
                                        .map((p: any) => (
                                            <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', padding: '0.2rem' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedPartIds.includes(p.id)} 
                                                    onChange={() => setSelectedPartIds(prev => prev.includes(p.id) ? prev.filter(i => i !== p.id) : [...prev, p.id])} 
                                                />
                                                <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>[{p.product?.name}]</span> {p.name}
                                            </label>
                                        ))}
                                    {masterData.parts.filter(p => selectedIds.includes(p.productId)).length === 0 && (
                                        <div style={{ fontSize: '0.8rem', opacity: 0.5, padding: '1rem', textAlign: 'center' }}>
                                            選択された商品に部品が登録されていません。
                                        </div>
                                    )}
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
