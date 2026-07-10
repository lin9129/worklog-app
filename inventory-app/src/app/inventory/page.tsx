'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  ScanBarcode, ArrowDown, ArrowUp, Send, History,
} from 'lucide-react';

interface LogEntry {
  id: number; type: string; quantity: number; reason: string; operator: string;
  createdAt: string;
  product: { code: string; name: string; location: string; stock?: number };
}

export default function InventoryPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [barcodeValue, setBarcodeValue] = useState('');
  const [type, setType] = useState<'IN' | 'OUT'>('IN');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [operator, setOperator] = useState('');
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: string) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory?limit=30');
      const data = await res.json();
      setLogs(data);
    } catch { console.error('Failed to fetch logs'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // 自動フォーカス (ページ読み込み時・処理完了後)
  useEffect(() => {
    if (barcodeRef.current) barcodeRef.current.focus();
  }, []);

  const handleSubmit = async () => {
    if (!barcodeValue.trim()) {
      showToast('バーコードをスキャンまたは入力してください', 'error');
      return;
    }

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productCode: barcodeValue.trim(),
          type,
          quantity,
          reason: reason || undefined,
          operator: operator || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error, 'error');
        return;
      }

      const label = type === 'IN' ? '入庫' : '出庫';
      setLastResult(`✅ ${data.product.name} を ${quantity}個 ${label}しました（残: ${data.product.stock}個）`);
      showToast(`${label}完了`, 'success');

      // フォームのリセットと自動フォーカス
      setBarcodeValue('');
      setQuantity('1');
      setReason('');
      fetchLogs();

      // スキャナーで連続入力するためにバーコード入力に再フォーカス
      setTimeout(() => barcodeRef.current?.focus(), 100);
    } catch {
      showToast('入出庫処理に失敗しました', 'error');
    }
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">入出庫管理</h1>
          <p className="page-subtitle">バーコードをスキャンして商品の入出庫を処理します</p>
        </div>
      </div>

      {/* 入出庫フォーム */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="card-header">
          <h2 className="card-title"><ScanBarcode size={18} style={{ marginRight: 8 }} />スキャン入力</h2>
        </div>

        {/* 種別切り替え */}
        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
          <button
            className={`btn ${type === 'IN' ? 'btn-success' : 'btn-outline'}`}
            onClick={() => setType('IN')}
            style={{ flex: 1 }}
          >
            <ArrowDown size={16} />入庫
          </button>
          <button
            className={`btn ${type === 'OUT' ? 'btn-danger' : 'btn-outline'}`}
            onClick={() => setType('OUT')}
            style={{ flex: 1 }}
          >
            <ArrowUp size={16} />出庫
          </button>
        </div>

        {/* バーコード入力 */}
        <div className="form-group">
          <label className="form-label">バーコード / 商品コード</label>
          <input
            ref={barcodeRef}
            className="form-input barcode-input"
            value={barcodeValue}
            onChange={e => setBarcodeValue(e.target.value)}
            onKeyDown={handleBarcodeKeyDown}
            placeholder="スキャンまたは手入力..."
            autoComplete="off"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">数量</label>
            <input className="form-input" type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">理由・メモ</label>
            <input className="form-input" value={reason} onChange={e => setReason(e.target.value)} placeholder="仕入れ、出荷先など..." />
          </div>
          <div className="form-group">
            <label className="form-label">担当者</label>
            <input className="form-input" value={operator} onChange={e => setOperator(e.target.value)} placeholder="名前" />
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleSubmit} style={{ width: '100%', marginTop: 'var(--space-sm)', padding: '14px' }}>
          <Send size={16} />処理実行
        </button>

        {/* 直前の処理結果表示 */}
        {lastResult && (
          <div style={{
            marginTop: 'var(--space-md)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-success-bg)',
            color: 'var(--color-success)',
            fontSize: '0.9rem',
            fontWeight: 500,
          }}>
            {lastResult}
          </div>
        )}
      </div>

      {/* 入出庫履歴 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title"><History size={18} style={{ marginRight: 8 }} />入出庫履歴</h2>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>日時</th><th>種別</th><th>コード</th><th>商品名</th><th>数量</th><th>理由</th><th>担当者</th></tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><p>入出庫履歴がありません</p></div></td></tr>
              ) : logs.map((log: LogEntry) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <span className={`badge ${log.type === 'IN' ? 'badge-success' : log.type === 'OUT' ? 'badge-danger' : 'badge-info'}`}>
                      {log.type === 'IN' ? '入庫' : log.type === 'OUT' ? '出庫' : '調整'}
                    </span>
                  </td>
                  <td className="mono">{log.product.code}</td>
                  <td>{log.product.name}</td>
                  <td style={{ fontWeight: 600 }}>{log.quantity}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.reason || '-'}</td>
                  <td>{log.operator || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* トースト */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.message}</div>
        </div>
      )}
    </>
  );
}
