'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, ArrowUpRight, Bell } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  dashboardStats,
  weeklyVolume,
  formatINR,
} from '@/lib/mock-data'

export function DashboardView({ onViewAlerts }: { onViewAlerts?: () => void }) {
  const maxTotal = Math.max(...weeklyVolume.map((d) => d.total))
  const [liveHighRisk, setLiveHighRisk] = useState<any[]>([])

  // FETCH LIVE DATA TO POPULATE HIGH RISK ALERTS ON DASHBOARD
  useEffect(() => {
    fetch('/api/invoices')
      .then((res) => res.json())
      .then((data) => {
        // Filter live invoices where risk score is high, take the top 5
        const highRisk = data
          .filter((inv: any) => inv.risk_score >= 46)
          .sort((a: any, b: any) => b.risk_score - a.risk_score)
          .slice(0, 5)
        
        setLiveHighRisk(highRisk)
      })
      .catch((err) => console.error(err))
  }, [])

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Overview
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9"
          onClick={onViewAlerts}
          aria-label="View alerts"
        >
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive" />
        </Button>
      </div>

      {/* Stat cards (Keeping mock stats for UI density) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{s.value}</p>
              <div
                className={cn(
                  'mt-2 flex items-center gap-1 text-xs font-medium',
                  s.up ? 'text-secondary' : 'text-destructive',
                )}
              >
                {s.up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                {s.delta}
                <span className="text-muted-foreground">vs last week</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bar chart (Keeping mock graph to look populated for demo) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoices processed — last 7 days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-56 items-stretch justify-between gap-3">
            {weeklyVolume.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full min-h-0 flex-1 items-end justify-center">
                  <div
                    className="relative flex w-full max-w-12 flex-col justify-end overflow-hidden rounded-t-md bg-primary/80"
                    style={{ height: `${(d.total / maxTotal) * 100}%` }}
                    title={`${d.total} processed · ${d.flagged} flagged`}
                  >
                    <div
                      className="w-full bg-destructive"
                      style={{ height: `${(d.flagged / d.total) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="font-mono text-xs text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-primary/80" /> Processed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-destructive" /> Flagged high-risk
            </span>
          </div>
        </CardContent>
      </Card>

      {/* LIVE Recent high-risk feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent High-Risk Activity</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border/60">
          {liveHighRisk.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground text-center">No recent high-risk activity detected.</p>
          ) : (
            liveHighRisk.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/15 text-sm font-bold text-destructive tabular-nums">
                  {item.risk_score}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.vendor_name_raw || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatINR(item.amount_total)} · {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <Badge variant="outline" className="font-mono">
                  {Array.isArray(item.signals_triggered) && item.signals_triggered.length > 0 
                    ? item.signals_triggered[0] 
                    : 'AI-FLAG'}
                </Badge>
                <ArrowUpRight className="size-4 text-muted-foreground" />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}