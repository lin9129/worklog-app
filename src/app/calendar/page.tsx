import React from 'react'
import { getLotSummaryData, getHolidays } from '@/lib/actions'
import WorkCalendar from '@/components/WorkCalendar'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
    let data: any[] = []
    let holidays: string[] = []
    try {
        data = await getLotSummaryData()
        holidays = await getHolidays()
    } catch (e) {
        console.error('CalendarPage error:', e)
    }

    return (
        <main style={{ minHeight: '100vh', padding: '1.5rem 2rem', paddingBottom: '5rem' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Page Header */}
                <header style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Link
                                href="/"
                                className="btn-sm btn-secondary"
                                style={{ textDecoration: 'none' }}
                            >
                                ◀ ホーム
                            </Link>
                            <h1>📅 製作スケジュールカレンダー</h1>
                        </div>

                        {/* Legend */}
                        <div className="glass" style={{
                            display: 'flex',
                            gap: '1.25rem',
                            padding: '0.6rem 1.2rem',
                            borderRadius: '12px',
                            fontSize: '0.78rem',
                            fontWeight: 600
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#3b82f6', display: 'inline-block' }}></span>第一
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#10b981', display: 'inline-block' }}></span>第二
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#f59e0b', display: 'inline-block' }}></span>第三
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#8b5cf6', display: 'inline-block' }}></span>第四
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.5rem', paddingLeft: '0.5rem', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
                                <span style={{ fontSize: '1rem' }}>🚩</span> 納期
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#ef4444', display: 'inline-block' }}></span> 超過
                            </div>
                        </div>
                    </div>
                </header>

                <WorkCalendar data={data} initialHolidays={holidays} />
            </div>
        </main>
    )
}
