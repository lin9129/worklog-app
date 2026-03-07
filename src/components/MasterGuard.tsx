'use client'

import { useState, useEffect } from 'react'

interface Props {
    children: React.ReactNode
}

export default function MasterGuard({ children }: Props) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    // シンプルな認証チェック（セッションストレージに保存）
    useEffect(() => {
        const auth = sessionStorage.getItem('master_auth')
        if (auth === 'true') {
            setIsAuthenticated(true)
        }
    }, [])

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        // デフォルトパスワードは 'admin9129' とします（ユーザーが後で変更可能）
        if (password === 'admin9129') {
            setIsAuthenticated(true)
            sessionStorage.setItem('master_auth', 'true')
            setError('')
        } else {
            setError('パスワードが正しくありません。')
        }
    }

    if (isAuthenticated) {
        return <>{children}</>
    }

    return (
        <div className="glass shadow-lg" style={{ maxWidth: '400px', margin: '100px auto', padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>🔐 ロックされています</h2>
            <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--secondary)' }}>
                マスタ管理画面にアクセスするにはパスワードが必要です。
            </p>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                    type="password"
                    placeholder="パスワードを入力"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--glass-border)' }}
                    autoFocus
                />
                {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{error}</p>}
                <button type="submit" className="btn btn-primary w-full">
                    解除
                </button>
            </form>
        </div>
    )
}
