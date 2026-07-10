'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Warehouse, AlertTriangle } from 'lucide-react';

interface Product {
  id: number; code: string; name: string;
  stock: number; minStock: number; location: string; price: number;
}

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'alert'>('all');

  const fetchProducts = useCallback(async () => {
    try {
      const alertParam = filter === 'alert' ? '&alert=true' : '';
      const res = await fetch(`/api/products?q=${encodeURIComponent(searchQuery)}${alertParam}`);
      setProducts(await res.json());
    } catch { console.error('Failed to fetch'); }
    finally { setLoading(false); }
  }, [searchQuery, filter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const totalStock = products.reduce((sum: number, p: Product) => sum + p.stock, 0);
  const totalValue = products.reduce((sum: number, p: Product) => sum + (p.stock * p.price), 0);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">在庫一覧</h1>
          <p className="page-subtitle">現在の在庫数をリアルタイムで確認できます</p>
        </div>
      </div>

      {/* サマリー */}
      <div className="stat-grid" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="stat-card">
          <div className="stat-icon blue"><Warehouse size={22} /></div>
          <div><div className="stat-value">{totalStock.toLocaleString()}</div><div className="stat-label">総在庫数</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Warehouse size={22} /></div>
          <div><div className="stat-value">¥{totalValue.toLocaleString()}</div><div className="stat-label">総在庫金額</div></div>
        </div>
      </div>

      {/* フィルタ＆検索 */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative', minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: 40 }} placeholder="商品名、コード、棚番で検索..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div className="btn-group">
            <button className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('all')}>すべて</button>
            <button className={`btn ${filter === 'alert' ? 'btn-danger' : 'btn-outline'}`} onClick={() => setFilter('alert')}>
              <AlertTriangle size={14} />要注意のみ
            </button>
          </div>
        </div>
      </div>

      {/* テーブル */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>コード</th><th>商品名</th><th>棚番</th><th>現在庫</th><th>安全在庫</th><th>単価</th><th>在庫金額</th><th>状態</th></tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={8}><div className="empty-state"><p>条件に一致する商品がありません</p></div></td></tr>
              ) : products.map((p: Product) => {
                const statusClass = p.stock === 0 ? 'stock-zero' : p.stock <= p.minStock ? 'stock-low' : 'stock-ok';
                const badgeClass = p.stock === 0 ? 'badge-danger' : p.stock <= p.minStock ? 'badge-warning' : 'badge-success';
                const statusLabel = p.stock === 0 ? '在庫切れ' : p.stock <= p.minStock ? '少量' : '正常';
                return (
                  <tr key={p.id}>
                    <td className="mono">{p.code}</td>
                    <td style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{p.name}</td>
                    <td className="mono">{p.location || '-'}</td>
                    <td className={statusClass} style={{ fontSize: '1rem' }}>{p.stock}</td>
                    <td>{p.minStock}</td>
                    <td>¥{p.price.toLocaleString()}</td>
                    <td>¥{(p.stock * p.price).toLocaleString()}</td>
                    <td><span className={`badge ${badgeClass}`}>{statusLabel}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
