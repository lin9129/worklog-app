'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Package, AlertTriangle, TrendingDown, Activity,
  ArrowRightLeft, ArrowDown, ArrowUp,
} from 'lucide-react';

interface Product {
  id: number; code: string; name: string; stock: number; minStock: number; location: string;
}
interface LogEntry {
  id: number; type: string; quantity: number; reason: string; operator: string;
  createdAt: string;
  product: { code: string; name: string };
}

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [prodRes, logRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/inventory?limit=8'),
      ]);
      const prods = await prodRes.json();
      const logsData = await logRes.json();
      setProducts(prods);
      setLogs(logsData);
    } catch (e) {
      console.error('Dashboard data fetch failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  const totalProducts = products.length;
  const totalStock = products.reduce((sum: number, p: Product) => sum + p.stock, 0);
  const lowStockItems = products.filter((p: Product) => p.stock > 0 && p.stock <= p.minStock);
  const zeroStockItems = products.filter((p: Product) => p.stock === 0);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">ダッシュボード</h1>
          <p className="page-subtitle">在庫状況の概要をリアルタイムで確認できます</p>
        </div>
      </div>

      {/* 統計カード */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Package size={22} /></div>
          <div>
            <div className="stat-value">{totalProducts}</div>
            <div className="stat-label">登録商品数</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Activity size={22} /></div>
          <div>
            <div className="stat-value">{totalStock.toLocaleString()}</div>
            <div className="stat-label">総在庫数</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><TrendingDown size={22} /></div>
          <div>
            <div className="stat-value">{lowStockItems.length}</div>
            <div className="stat-label">在庫少量</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><AlertTriangle size={22} /></div>
          <div>
            <div className="stat-value">{zeroStockItems.length}</div>
            <div className="stat-label">在庫切れ</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
        {/* アラート商品 */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">⚠️ 要注意商品</h2>
            <Link href="/stock" className="btn btn-ghost btn-sm">すべて見る →</Link>
          </div>
          {[...zeroStockItems, ...lowStockItems].length === 0 ? (
            <div className="empty-state"><p>在庫に問題のある商品はありません 🎉</p></div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr><th>コード</th><th>商品名</th><th>在庫</th><th>状態</th></tr>
                </thead>
                <tbody>
                  {[...zeroStockItems, ...lowStockItems].slice(0, 5).map((p: Product) => (
                    <tr key={p.id}>
                      <td className="mono">{p.code}</td>
                      <td>{p.name}</td>
                      <td className={p.stock === 0 ? 'stock-zero' : 'stock-low'}>{p.stock}</td>
                      <td>
                        <span className={`badge ${p.stock === 0 ? 'badge-danger' : 'badge-warning'}`}>
                          {p.stock === 0 ? '在庫切れ' : '少量'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 最近の入出庫 */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📋 最近の入出庫</h2>
            <Link href="/inventory" className="btn btn-ghost btn-sm">すべて見る →</Link>
          </div>
          {logs.length === 0 ? (
            <div className="empty-state"><p>入出庫履歴がありません</p></div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr><th>種別</th><th>商品</th><th>数量</th><th>日時</th></tr>
                </thead>
                <tbody>
                  {logs.slice(0, 5).map((log: LogEntry) => (
                    <tr key={log.id}>
                      <td>
                        <span className={`badge ${log.type === 'IN' ? 'badge-success' : log.type === 'OUT' ? 'badge-danger' : 'badge-info'}`}>
                          {log.type === 'IN' ? <><ArrowDown size={12} /> 入庫</> : log.type === 'OUT' ? <><ArrowUp size={12} /> 出庫</> : <><ArrowRightLeft size={12} /> 調整</>}
                        </span>
                      </td>
                      <td>{log.product.name}</td>
                      <td style={{ fontWeight: 600 }}>{log.quantity}</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        {new Date(log.createdAt).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
