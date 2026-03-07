import Link from "next/link";
import { getLotSummaryData } from '@/lib/actions'
import LotSummaryView from '@/components/LotSummaryView'

export const dynamic = 'force-dynamic'

export default async function LotSummaryPage() {
    const data = await getLotSummaryData()

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

            <section>
                <LotSummaryView initialData={data} />
            </section>
        </div>
    )
}
