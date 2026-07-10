'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  ClipboardList, Plus, ScanBarcode, CheckCircle2, XCircle,
  FileSpreadsheet, Trash2,
} from 'lucide-react';

interface StocktakeSession {
  id: number; title: string; type: string; status: string;
  createdAt: string; completedAt: string | null;
  _count?: { records: number };
  records?: StocktakeRecord[];
}

interface StocktakeRecord {
  id: number; systemStock: number; actualStock: number; difference: number;
  scannedAt: string; operator: string | null;
  product: { code: string; name: string; location: string };
}

export default function StocktakePage() {
  const [sessions, setSessions] = useState<StocktakeSession[]>([]);
  const [activeSession, setActiveSession] = useState<StocktakeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'SIMPLE' | 'FULL'>('SIMPLE');
  const [barcodeValue, setBarcodeValue] = useState('');
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: string) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/stocktake/session');
      setSessions(await res.json());
    } catch { console.error('Failed to fetch sessions'); }
    finally { setLoading(false); }
  }, []);

  const fetchActiveSession = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/stocktake/session/${id}`);
      const data = await res.json();
      setActiveSession(data);
    } catch { console.error('Failed to fetch session details'); }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // アクティブセッションの自動検出
  useEffect(() => {
    const active = sessions.find(s => s.status === 'ACTIVE');
    if (active) fetchActiveSession(active.id);
  }, [sessions, fetchActiveSession]);

  const handleStartSession = async () => {
    if (!newTitle.trim()) { showToast('タイトルを入力してください', 'error'); return; }
    try {
      const res = await fetch('/api/stocktake/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, type: newType }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error, 'error'); return; }
      showToast('棚卸しセッションを開始しました', 'success');
      setShowNewModal(false);
      setNewTitle(''); setNewType('SIMPLE');
      fetchSessions();
    } catch { showToast('セッションの開始に失敗しました', 'error'); }
  };

  const handleScan = async () => {
    if (!activeSession || !barcodeValue.trim()) return;
    try {
      const res = await fetch('/api/stocktake/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSession.id,
          productCode: barcodeValue.trim(),
          increment: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error, 'error'); return; }
      showToast(`${data.product.name}: 実数 ${data.actualStock}個`, 'success');
      setBarcodeValue('');
      fetchActiveSession(activeSession.id);
      setTimeout(() => barcodeRef.current?.focus(), 100);
    } catch { showToast('スキャンの処理に失敗しました', 'error'); }
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleScan(); }
  };

  const handleComplete = async () => {
    if (!activeSession) return;
    if (!confirm('棚卸しを確定し、差異がある商品の在庫数を実在庫に自動調整しますか？\nこの操作は取り消せません。')) return;
    try {
      const res = await fetch(`/api/stocktake/session/${activeSession.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      if (!res.ok) { const data = await res.json(); showToast(data.error, 'error'); return; }
      showToast('棚卸しが完了しました', 'success');
      setActiveSession(null);
      fetchSessions();
    } catch { showToast('完了処理に失敗しました', 'error'); }
  };

  const handleCancelSession = async (id: number) => {
    if (!confirm('この棚卸しセッションを破棄しますか？')) return;
    try {
      const res = await fetch(`/api/stocktake/session/${id}`, { method: 'DELETE' });
      if (!res.ok) { const data = await res.json(); showToast(data.error, 'error'); return; }
      showToast('セッションを破棄しました', 'success');
      if (activeSession?.id === id) setActiveSession(null);
      fetchSessions();
    } catch { showToast('破棄に失敗しました', 'error'); }
  };

  const handleExportExcel = (sessionId: number) => {
    window.open(`/api/stocktake/export?sessionId=${sessionId}`, '_blank');
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">棚卸し</h1>
          <p className="page-subtitle">バーコードスキャンで実在庫を数え、システム在庫との差異を確認します</p>
        </div>
        {!activeSession && (
          <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
            <Plus size={16} />新規棚卸し開始
          </button>
        )}
      </div>

      {/* アクティブセッション */}
      {activeSession && activeSession.status === 'ACTIVE' && (
        <div className="card" style={{ marginBottom: 'var(--space-lg)', borderColor: 'var(--color-accent)' }}>
          <div className="card-header">
            <h2 className="card-title"><ClipboardList size={18} style={{ marginRight: 8 }} />進行中: {activeSession.title}</h2>
            <div className="btn-group">
              <button className="btn btn-outline btn-sm" onClick={() => handleExportExcel(activeSession.id)}>
                <FileSpreadsheet size={14} />Excel出力
              </button>
              <button className="btn btn-success btn-sm" onClick={handleComplete}>
                <CheckCircle2 size={14} />棚卸し確定
              </button>
            </div>
          </div>

          {/* スキャン入力 */}
          <div className="form-group">
            <label className="form-label">バーコードスキャン（連続入力: スキャンするたびに+1）</label>
            <input
              ref={barcodeRef}
              className="form-input barcode-input"
              value={barcodeValue}
              onChange={e => setBarcodeValue(e.target.value)}
              onKeyDown={handleBarcodeKeyDown}
              placeholder="バーコードをスキャン..."
              autoComplete="off"
              autoFocus
            />
          </div>

          {/* 棚卸しレコード一覧 */}
          {activeSession.records && activeSession.records.length > 0 && (
            <div className="table-container" style={{ marginTop: 'var(--space-md)' }}>
              <table className="data-table">
                <thead>
                  <tr><th>コード</th><th>商品名</th><th>棚番</th><th>システム在庫</th><th>実在庫</th><th>差異</th></tr>
                </thead>
                <tbody>
                  {activeSession.records.map((rec: StocktakeRecord) => (
                    <tr key={rec.id}>
                      <td className="mono">{rec.product.code}</td>
                      <td>{rec.product.name}</td>
                      <td className="mono">{rec.product.location || '-'}</td>
                      <td>{rec.systemStock}</td>
                      <td style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{rec.actualStock}</td>
                      <td>
                        <span className={`badge ${rec.difference === 0 ? 'badge-success' : rec.difference > 0 ? 'badge-info' : 'badge-danger'}`}>
                          {rec.difference > 0 ? `+${rec.difference}` : rec.difference}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* セッション履歴 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">棚卸し履歴</h2>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>タイトル</th><th>種別</th><th>品目数</th><th>状態</th><th>開始日</th><th>操作</th></tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><p>棚卸し履歴がありません</p></div></td></tr>
              ) : sessions.map((s: StocktakeSession) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{s.title}</td>
                  <td><span className={`badge ${s.type === 'FULL' ? 'badge-info' : 'badge-warning'}`}>{s.type === 'FULL' ? '大規模' : '簡易'}</span></td>
                  <td>{s._count?.records ?? '-'}</td>
                  <td>
                    <span className={`badge ${s.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                      {s.status === 'COMPLETED' ? '完了' : '進行中'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    {new Date(s.createdAt).toLocaleDateString('ja-JP')}
                  </td>
                  <td>
                    <div className="btn-group">
                      <button className="btn btn-ghost btn-sm" onClick={() => handleExportExcel(s.id)}>
                        <FileSpreadsheet size={14} />
                      </button>
                      {s.status === 'ACTIVE' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => handleCancelSession(s.id)} style={{ color: 'var(--color-danger)' }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新規セッション作成モーダル */}
      {showNewModal && (
        <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">新規棚卸しセッション</h3>
            <div className="form-group">
              <label className="form-label">タイトル *</label>
              <input className="form-input" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                placeholder="例: 2026年6月定期棚卸し" />
            </div>
            <div className="form-group">
              <label className="form-label">種別</label>
              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-xs)' }}>
                <button className={`btn ${newType === 'SIMPLE' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setNewType('SIMPLE')} style={{ flex: 1 }}>
                  簡易棚卸し
                </button>
                <button className={`btn ${newType === 'FULL' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setNewType('FULL')} style={{ flex: 1 }}>
                  大規模棚卸し
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-xs)' }}>
                {newType === 'SIMPLE'
                  ? '簡易: スキャンした商品のみを対象とします。'
                  : '大規模: 全商品を対象とし、未スキャン商品は在庫0として扱います。'}
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowNewModal(false)}>キャンセル</button>
              <button className="btn btn-primary" onClick={handleStartSession}>開始</button>
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
