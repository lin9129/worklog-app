<<<<<<< HEAD
import Link from "next/link";
import { getLotSummaryData } from '@/lib/actions'
import LotSummaryView from '@/components/LotSummaryView'

export const dynamic = 'force-dynamic'

export default async function LotSummaryPage() {
    let data: any[] = []
    let errorMsg = ''
    try {
        data = await getLotSummaryData()
    } catch (e: any) {
        console.error('LotSummaryPage error:', e)
        errorMsg = e?.message || '不明なエラー'
    }

    return (
        <div style={{ paddingBottom: '5rem' }}>
            <header style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                        <h1>ロット別集計</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>日付およびロット番号ごとの作業時間集計</p>
                    </div>
                    <Link href="/" className="btn" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        ⬅️ ホームに戻る
                    </Link>
                </div>
            </header>

            {errorMsg ? (
                <div className="glass p-6" style={{ borderRadius: '16px', color: 'var(--danger)' }}>
                    <h3>⚠️ データ読み込みエラー</h3>
                    <pre style={{ fontSize: '0.8rem', marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{errorMsg}</pre>
                </div>
            ) : (
                <section>
                    <LotSummaryView data={data} mode="ongoing" />
                </section>
            )}
        </div>
    )
}
=======
import Link from "next/link";
import { getLotSummaryData } from '@/lib/actions'
import LotSummaryView from '@/components/LotSummaryView'

export const dynamic = 'force-dynamic'

export default async function LotSummaryPage() {
    let data: any[] = []
    let errorMsg = ''
    try {
        data = await getLotSummaryData()
    } catch (e: any) {
        console.error('LotSummaryPage error:', e)
        errorMsg = e?.message || '不明なエラー'
    }

    return (
        <div style={{ paddingBottom: '5rem' }}>
            <header style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                        <h1>ロット別集計</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>日付およびロット番号ごとの作業時間集計</p>
                    </div>
                    <Link href="/" className="btn" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        ⬅️ ホームに戻る
                    </Link>
                </div>
            </header>

            {errorMsg ? (
                <div className="glass p-6" style={{ borderRadius: '16px', color: 'var(--danger)' }}>
                    <h3>⚠️ データ読み込みエラー</h3>
                    <pre style={{ fontSize: '0.8rem', marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{errorMsg}</pre>
                </div>
            ) : (
                <section>
                    <LotSummaryView data={data} mode="ongoing" />
                </section>
            )}
        </div>
    )
}
>>>>>>> ff5b9c9 (fix: all errors and guards)
