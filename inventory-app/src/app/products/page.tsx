'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Edit3, Trash2, Search, FileDown, X,
} from 'lucide-react';

interface Product {
  id: number; code: string; name: string; description: string;
  price: number; stock: number; minStock: number; location: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', minStock: '5', location: '' });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  const showToast = (message: string, type: string) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`/api/products?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setProducts(data);
    } catch { showToast('データの取得に失敗しました', 'error'); }
    finally { setLoading(false); }
  }, [searchQuery]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSave = async () => {
    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = editingProduct ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) { const err = await res.json(); showToast(err.error, 'error'); return; }
      showToast(editingProduct ? '商品を更新しました' : '商品を登録しました', 'success');
      setShowModal(false); setEditingProduct(null);
      setFormData({ name: '', description: '', price: '', minStock: '5', location: '' });
      fetchProducts();
    } catch { showToast('保存に失敗しました', 'error'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この商品を削除しますか？関連する入出庫履歴もすべて削除されます。')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json(); showToast(err.error, 'error'); return; }
      showToast('商品を削除しました', 'success');
      fetchProducts();
    } catch { showToast('削除に失敗しました', 'error'); }
  };

  const handleEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name, description: p.description || '',
      price: String(p.price), minStock: String(p.minStock), location: p.location || '',
    });
    setShowModal(true);
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', minStock: '5', location: '' });
    setShowModal(true);
  };

  const handleBarcodePdf = () => {
    const ids = selectedIds.size > 0 ? Array.from(selectedIds).join(',') : products.map(p => p.id).join(',');
    window.open(`/api/products/barcode?ids=${ids}`, '_blank');
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => p.id)));
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">商品管理</h1>
          <p className="page-subtitle">商品の登録・編集・バーコード印刷を行います</p>
        </div>
        <div className="btn-group">
          <button className="btn btn-outline" onClick={handleBarcodePdf}>
            <FileDown size={16} />バーコードPDF{selectedIds.size > 0 ? ` (${selectedIds.size}件)` : ' (全件)'}
          </button>
          <button className="btn btn-primary" onClick={handleNewProduct}>
            <Plus size={16} />新規登録
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 40 }}
            placeholder="商品名、コード、棚番で検索..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={selectedIds.size === products.length && products.length > 0} onChange={toggleAll} /></th>
                <th>コード</th><th>商品名</th><th>単価</th><th>在庫</th><th>安全在庫</th><th>棚番</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={8}><div className="empty-state"><p>商品が登録されていません</p></div></td></tr>
              ) : products.map((p: Product) => (
                <tr key={p.id}>
                  <td><input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                  <td className="mono">{p.code}</td>
                  <td style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{p.name}</td>
                  <td>¥{p.price.toLocaleString()}</td>
                  <td className={p.stock === 0 ? 'stock-zero' : p.stock <= p.minStock ? 'stock-low' : 'stock-ok'}>
                    {p.stock}
                  </td>
                  <td>{p.minStock}</td>
                  <td className="mono">{p.location || '-'}</td>
                  <td>
                    <div className="btn-group">
                      <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(p)}><Edit3 size={14} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(p.id)} style={{ color: 'var(--color-danger)' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 商品登録/編集モーダル */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="modal-title">{editingProduct ? '商品を編集' : '新規商品登録'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">商品名 *</label>
              <input className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="例: 安全ヘルメット 白" />
            </div>
            <div className="form-group">
              <label className="form-label">説明</label>
              <input className="form-input" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="メモ・仕様" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">単価 (円)</label>
                <input className="form-input" type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="0" />
              </div>
              <div className="form-group">
                <label className="form-label">安全在庫数</label>
                <input className="form-input" type="number" value={formData.minStock} onChange={e => setFormData({ ...formData, minStock: e.target.value })} placeholder="5" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">保管棚番</label>
              <input className="form-input" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="例: A-1-3" />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>キャンセル</button>
              <button className="btn btn-primary" onClick={handleSave}>{editingProduct ? '更新' : '登録'}</button>
            </div>
          </div>
        </div>
      )}

      {/* トースト */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.message}</div>
        </div>
      )}
    </>
  );
}
