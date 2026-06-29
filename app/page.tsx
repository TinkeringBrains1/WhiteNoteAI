'use client'

import { useState } from 'react'

import { Sidebar, type ViewKey } from '@/components/whitenote/sidebar'
import { UploadView } from '@/components/whitenote/upload-view'
import { DashboardView } from '@/components/whitenote/dashboard-view'
import { QueueView } from '@/components/whitenote/queue-view'
import { VendorsView } from '@/components/whitenote/vendors-view'
import { AnalyticsView } from '@/components/whitenote/analytics-view'
import { AlertsView } from '@/components/whitenote/alerts-view'

const titles: Record<ViewKey, string> = {
  dashboard: 'Dashboard',
  queue: 'Invoice Queue',
  upload: 'Upload Invoice',
  vendors: 'Vendors',
  analytics: 'Analytics',
  alerts: 'Alerts',
}

export default function Page() {
  const [view, setView] = useState<ViewKey>('upload')
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <Sidebar
        view={view}
        onChange={setView}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Whitenote
            </span>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">{titles[view]}</span>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {view === 'upload' && <UploadView />}
          {view === 'dashboard' && <DashboardView onViewAlerts={() => setView('alerts')} />}
          {view === 'queue' && <QueueView />}
          {view === 'vendors' && <VendorsView />}
          {view === 'analytics' && <AnalyticsView />}
          {view === 'alerts' && <AlertsView />}
        </main>
      </div>
    </div>
  )
}
