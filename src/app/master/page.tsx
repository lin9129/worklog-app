import MasterManagement from '@/components/MasterManagement'
import MasterGuard from '@/components/MasterGuard'
import { getMasterData } from '@/lib/actions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Page() {
    let masterData = null
    let error = null

    try {
        masterData = await getMasterData()
    } catch (e: any) {
        console.error('Master page data fetching failed:', e)
        error = e.message || 'マスタデータの取得に失敗しました'
    }

    if (error || !masterData) {
        return (
            <main className="container animate-fade">
                <header className="header glass" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 className="title">マスタ管理</h1>
                            <p className="subtitle">エラーが発生しました</p>
                        </div>
                        <Link href="/" className="btn" style={{ background: 'rgba(255,255,255,0.1)' }}>
                            ← 戻る
                        </Link>
                    </div>
                </header>
                <div className="glass shadow-lg" style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>
                    <h2 style={{ marginBottom: '1rem' }}>⚠️ データの読み込みに失敗しました</h2>
                    <p style={{ marginBottom: '1.5rem' }}>{error}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>
                        データベースの接続に問題があるか、データが不整合な状態になっている可能性があります。
                        サーバーのログを確認するか、管理者に問い合わせてください。
                    </p>
                </div>
            </main>
        )
    }

    return (
        <main className="container animate-fade">
            <header className="header glass" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="title">マスタ管理</h1>
                        <p className="subtitle">商品、部材、工程、担当者の設定</p>
                    </div>
                    <Link href="/" className="btn" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        ← 戻る
                    </Link>
                </div>
            </header>

            <MasterGuard>
                <MasterManagement masterData={masterData} />
            </MasterGuard>
        </main>
    )
}
