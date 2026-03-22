import Link from "next/link";
import { getLotSummaryData } from '@/lib/actions'
import LotSummaryView from '@/components/LotSummaryView'

export const dynamic = 'force-dynamic'

export default async function CompletedProductsPage() {
    let data: any[] = []
    let errorMsg = ''
    try {
        data = await getLotSummaryData()
    } catch (e: any) {
        console.error('CompletedProductsPage error:', e)
        errorMsg = e?.message || '不明なエラー'
    }

    return (
        <div style={{ paddingBottom: '5rem' }}>
            <header style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                        <h1>✅ 商品完成表</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>完了済みのロット一覧と製作実績</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Link href="/lot-summary" className="btn" style={{ background: 'rgba(255,255,255,0.1)' }}>
                            📊 ロット集計に戻る
                        </Link>
                        <Link href="/" className="btn" style={{ background: 'rgba(255,255,255,0.1)' }}>
                            ⬅️ ホーム
                        </Link>
                    </div>
                </div>
            </header>

            {errorMsg ? (
                <div className="glass p-6" style={{ borderRadius: '16px', color: 'var(--danger)' }}>
                    <h3>⚠️ データ読み込みエラー</h3>
                    <pre style={{ fontSize: '0.8rem', marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{errorMsg}</pre>
                </div>
            ) : (
                <section>
                    <LotSummaryView data={data} mode="completed" />
                </section>
            )}
        </div>
    )
}
