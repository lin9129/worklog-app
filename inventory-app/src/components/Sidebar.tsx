'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  ClipboardList,
  Warehouse,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/products', label: '商品管理', icon: Package },
  { href: '/inventory', label: '入出庫管理', icon: ArrowLeftRight },
  { href: '/stock', label: '在庫一覧', icon: Warehouse },
  { href: '/stocktake', label: '棚卸し', icon: ClipboardList },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link href="/" className="sidebar-logo">
          <div className="sidebar-logo-icon">倉</div>
          <div>
            <span className="sidebar-logo-text">在庫管理</span>
            <span className="sidebar-logo-sub">INVENTORY SYSTEM</span>
          </div>
        </Link>
      </div>
      <nav className="sidebar-nav">
        <span className="nav-label">メニュー</span>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
