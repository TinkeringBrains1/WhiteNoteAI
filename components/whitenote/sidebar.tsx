'use client'

import {
  LayoutDashboard,
  ListChecks,
  Upload,
  Building2,
  BarChart3,
  Bell,
  ShieldCheck,
  PanelLeft,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export type ViewKey =
  | 'dashboard'
  | 'queue'
  | 'upload'
  | 'vendors'
  | 'analytics'
  | 'alerts'

const navItems: { key: ViewKey; label: string; icon: typeof Upload }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'queue', label: 'Invoice Queue', icon: ListChecks },
  { key: 'upload', label: 'Upload Invoice', icon: Upload },
  { key: 'vendors', label: 'Vendors', icon: Building2 },
]

const reportItems: { key: ViewKey; label: string; icon: typeof Upload; badge?: number }[] = [
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'alerts', label: 'Alerts', icon: Bell, badge: 4 },
]

function NavButton({
  active,
  onClick,
  icon: Icon,
  label,
  badge,
  collapsed,
}: {
  active: boolean
  onClick: () => void
  icon: typeof Upload
  label: string
  badge?: number
  collapsed: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? label : undefined}
      className={cn(
        'group flex w-full items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors',
        collapsed ? 'justify-center px-0' : 'px-3',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
      )}
    >
      <span className="relative">
        <Icon
          className={cn(
            'size-4 shrink-0',
            active ? 'text-primary' : 'text-muted-foreground group-hover:text-sidebar-foreground',
          )}
        />
        {collapsed && badge ? (
          <span className="absolute -right-1.5 -top-1.5 size-2 rounded-full bg-destructive" aria-hidden />
        ) : null}
      </span>
      {!collapsed && (
        <>
          <span className="flex-1 text-left">{label}</span>
          {badge ? (
            <Badge
              variant="destructive"
              className="min-w-[1.4rem] justify-center rounded-full border-0 bg-destructive px-1.5 py-0.5 text-xs font-bold text-white shadow-sm shadow-destructive/50 ring-2 ring-destructive/30 dark:bg-destructive"
            >
              {badge}
            </Badge>
          ) : null}
        </>
      )}
    </button>
  )
}

export function Sidebar({
  view,
  onChange,
  collapsed,
  onToggle,
}: {
  view: ViewKey
  onChange: (v: ViewKey) => void
  collapsed: boolean
  onToggle: () => void
}) {
  return (
    <aside
      className={cn(
        'flex h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-in-out',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo + toggle */}
      <div
        className={cn(
          'flex items-center gap-2.5 py-5',
          collapsed ? 'flex-col px-0' : 'px-5',
        )}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ShieldCheck className="size-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
              Whitenote AI
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Fraud Defense
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <PanelLeft className="size-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className={cn('flex-1 overflow-y-auto overflow-x-hidden py-2', collapsed ? 'px-2' : 'px-3')}>
        {!collapsed && (
          <p className="px-3 pb-2 pt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Navigation
          </p>
        )}
        {collapsed && <div className="pt-2" />}
        <div className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavButton
              key={item.key}
              active={view === item.key}
              onClick={() => onChange(item.key)}
              icon={item.icon}
              label={item.label}
              collapsed={collapsed}
            />
          ))}
        </div>

        {!collapsed ? (
          <p className="px-3 pb-2 pt-5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Reports
          </p>
        ) : (
          <div className="my-3 border-t border-sidebar-border" />
        )}
        <div className="flex flex-col gap-1">
          {reportItems.map((item) => (
            <NavButton
              key={item.key}
              active={view === item.key}
              onClick={() => onChange(item.key)}
              icon={item.icon}
              label={item.label}
              badge={item.badge}
              collapsed={collapsed}
            />
          ))}
        </div>
      </nav>

      {/* User profile */}
      <div className={cn('border-t border-sidebar-border p-3', collapsed && 'flex justify-center')}>
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg py-2',
            collapsed ? 'px-0' : 'px-2',
          )}
        >
          <Avatar className="size-9 shrink-0">
            <AvatarFallback className="bg-secondary text-secondary-foreground">AR</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-medium text-sidebar-foreground">Aarav Rao</p>
                <p className="truncate text-xs text-muted-foreground">Risk Analyst</p>
              </div>
              <span className="size-2 rounded-full bg-secondary" aria-hidden />
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
