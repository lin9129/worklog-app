'use client'

import { Bar } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js'

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
)

interface Props {
    data: {
        products: { name: string; total: number }[]
        users: { name: string; total: number }[]
        lots: { name: string; total: number }[]
    }
}

export default function Dashboard({ data }: Props) {
    const productsChartData = {
        labels: data.products.map(p => p.name),
        datasets: [
            {
                label: '合計工数 (分)',
                data: data.products.map(p => p.total),
                backgroundColor: 'rgba(79, 70, 229, 0.6)',
                borderRadius: 8,
            },
        ],
    }

    const usersChartData = {
        labels: data.users.map(u => u.name),
        datasets: [
            {
                label: '合計工数 (分)',
                data: data.users.map(u => u.total),
                backgroundColor: 'rgba(16, 185, 129, 0.6)',
                borderRadius: 8,
            },
        ],
    }

    const lotsChartData = {
        labels: data.lots.map(l => l.name),
        datasets: [
            {
                label: '合計工数 (分)',
                data: data.lots.map(l => l.total),
                backgroundColor: 'rgba(245, 158, 11, 0.6)',
                borderRadius: 8,
            },
        ],
    }

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            }
        }
    }

    return (
        <section className="stats-grid animate-fade">
            <div className="glass" style={{ padding: '2rem' }}>
                <h3 className="card-title">📦 商品別合計工数</h3>
                <Bar options={options} data={productsChartData} />
            </div>
            <div className="glass" style={{ padding: '2rem' }}>
                <h3 className="card-title">👤 担当者別合計工数</h3>
                <Bar options={options} data={usersChartData} />
            </div>
            <div className="glass" style={{ padding: '2rem', gridColumn: '1 / -1' }}>
                <h3 className="card-title">🏭 製作No別合計工数 (商品・ロット別)</h3>
                <Bar options={options} data={lotsChartData} />
            </div>
        </section>
    )
}
