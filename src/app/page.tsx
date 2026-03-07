import Image from "next/image";
import Link from "next/link";
import { getMasterData, getWorkLogs, getDashboardData } from '@/lib/actions'
import WorkLogForm from '@/components/WorkLogForm'
import WorkLogList from '@/components/WorkLogList'
import Dashboard from '@/components/Dashboard'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const masterData = await getMasterData()
  const logs = await getWorkLogs()
  const dashboardData = await getDashboardData()

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>工数・時間記入表</h1>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <span className="badge badge-success">稼働中</span>
              <div className="glass" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 500 }}>
                {new Date().toLocaleDateString('ja-JP', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/lot-summary" className="btn" style={{ background: 'rgba(255,255,255,0.1)' }}>
              📊 ロット集計
            </Link>
            <Link href="/master" className="btn" style={{ background: 'rgba(255,255,255,0.1)' }}>
              ⚙️ マスタ管理
            </Link>
          </div>
        </div>
      </header>

      <section id="input">
        <WorkLogForm masterData={masterData} />
      </section>

      <section id="dashboard" style={{ marginTop: '2rem' }}>
        <h2 className="card-title">📊 リアルタイム集計</h2>
        <Dashboard data={dashboardData} />
      </section>

      <section id="list" style={{ marginTop: '3rem' }}>
        <WorkLogList logs={logs} products={masterData.products} />
      </section>

      {/* Quick Nav for Mobile */}
      <nav className="glass" style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '0.75rem 2rem',
        display: 'flex',
        gap: '2rem',
        zIndex: 100,
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        <a href="#input" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 600 }}>入力</a>
        <a href="#dashboard" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 600 }}>集計</a>
        <a href="#list" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 600 }}>履歴</a>
      </nav>
    </div>
  )
}
