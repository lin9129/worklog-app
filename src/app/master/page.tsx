<<<<<<< HEAD
import MasterManagement from '@/components/MasterManagement'
import MasterGuard from '@/components/MasterGuard'
import { getMasterData } from '@/lib/actions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Page() {
    const masterData = await getMasterData()

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
=======
import MasterManagement from '@/components/MasterManagement'
import MasterGuard from '@/components/MasterGuard'
import { getMasterData } from '@/lib/actions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Page() {
    const masterData = await getMasterData()

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
>>>>>>> ff5b9c9 (fix: all errors and guards)
