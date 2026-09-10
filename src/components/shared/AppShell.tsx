'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/lib/actions/auth'
import { cn } from '@/lib/utils'
import { NAV_ICONS } from '@/lib/icons'
import type { Profile } from '@/types'

interface NavItem {
  href: string
  label: string
  icon: keyof typeof NAV_ICONS
  badge?: number | string
}

interface AppShellProps {
  profile: Profile
  children: React.ReactNode
  navItems: NavItem[]
  role: 'buyer' | 'seller' | 'admin'
}

export function AppShell({ profile, children, navItems, role }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const roleColors: Record<string, string> = {
    buyer: 'text-orange-light',
    seller: 'text-orange-light',
    admin: 'text-danger',
  }

  const roleLabels: Record<string, string> = {
    buyer: 'Buyer',
    seller: 'Seller',
    admin: 'Super Admin',
    dual: 'Buyer & Seller',
  }

  const initials = profile.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[99] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile toggle */}
      <button
        className={cn('mobile-nav-toggle md:hidden')}
        onClick={() => setSidebarOpen(o => !o)}
        aria-label="Toggle navigation"
      >
        ☰
      </button>

      {/* Sidebar */}
      <nav className={cn('sidebar', sidebarOpen && 'open')}>
        {/* Logo */}
        <div className="px-6 py-7 border-b border-grey-border">
          <div className="font-display text-[28px] text-white leading-none">
            V<span className="text-orange-light">+</span>V
          </div>
          <div className="text-[9px] text-grey-dark uppercase tracking-[0.14em] mt-1">
            Business Marketplace
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 py-4 overflow-y-auto">
          <div className="text-[9px] uppercase tracking-[0.14em] text-grey-mid px-6 py-3 pt-4">
            {roleLabels[role] ?? role}
          </div>
          {navItems.map(item => {
            const Icon = NAV_ICONS[item.icon]
            return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn('nav-item', pathname.startsWith(item.href) && 'active')}
            >
              <Icon className="w-5 flex-shrink-0" size={17} strokeWidth={1.75} aria-hidden />
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className="ml-auto bg-orange text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
            )
          })}
        </div>

        {/* User */}
        <div className="px-6 py-4 border-t border-grey-border flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-orange flex items-center justify-center font-display text-sm text-white flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">{profile.full_name}</div>
            <div className={cn('text-[9px] uppercase tracking-[0.1em]', roleColors[role])}>
              {roleLabels[profile.role]}
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-grey-mid hover:text-white transition-colors text-xs"
              title="Sign out"
            >
              ↗
            </button>
          </form>
        </div>
      </nav>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-[220px]">
        {children}
      </div>
    </div>
  )
}
