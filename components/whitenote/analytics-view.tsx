'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Dictionary to map raw AI signal codes to human-readable UI labels and colors
// Dictionary to map raw AI signal codes to human-readable UI labels and colors
const SIGNAL_META: Record<string, { label: string; color: string }> = {
  // Existing ones
  'W-CTX-03': { label: 'Context/Contract Mismatch', color: '#ef4444' }, // Red
  'W-AMT-01': { label: 'Unusual Amount Surge', color: '#f59e0b' },      // Amber
  'W-GST-02': { label: 'Invalid/Suspicious GSTIN', color: '#3b82f6' },  // Blue
  'W-BCH-04': { label: 'Bank Detail Change Request', color: '#8b5cf6' },// Purple
  'W-VEL-05': { label: 'High Velocity Submissions', color: '#ec4899' }, // Pink

  // New ones from your live database!
  'W-VND-02': { label: 'Suspicious Vendor Profile', color: '#10b981' }, // Emerald
  'W-VND-05': { label: 'Vendor Bank Mismatch', color: '#14b8a6' },      // Teal
  'W-GST-01': { label: 'GST Inactive/Suspended', color: '#06b6d4' },    // Cyan
  'W-VND-04': { label: 'Zero Prior Transactions', color: '#f97316' },   // Orange
  'W-DOC-01': { label: 'Amateur Formatting (Canva/Word)', color: '#d946ef' }, // Fuchsia
  'W-CTX-02': { label: 'Missing Comms Context', color: '#84cc16' },     // Lime
  'W-DOC-03': { label: 'Missing Mandatory Fields (IRN)', color: '#eab308' }, // Yellow
  'W-ANO-01': { label: 'Threshold Gaming', color: '#dc2626' },          // Dark Red
  'W-VND-01': { label: 'Unknown Vendor Identity', color: '#6366f1' },   // Indigo
  'W-VND-07': { label: 'High-Risk Vendor Category', color: '#f43f5e' }, // Rose
}

const DEFAULT_COLOR = '#64748b' // Slate grey for any brand new codes AI generates

export function AnalyticsView() {
  const [signalDistribution, setSignalDistribution] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // FETCH LIVE DATA AND AGGREGATE SIGNALS
  useEffect(() => {
    fetch('/api/invoices')
      .then((res) => res.json())
      .then((data) => {
        const counts: Record<string, number> = {}

        // Loop through all invoices and tally up every signal triggered
        data.forEach((inv: any) => {
          if (Array.isArray(inv.signals_triggered)) {
            inv.signals_triggered.forEach((sig: string) => {
              counts[sig] = (counts[sig] || 0) + 1
            })
          }
        })

        // Transform the tally into the array format the charts expect
        const formattedSignals = Object.entries(counts)
          .map(([code, count]) => ({
            code,
            count,
            label: SIGNAL_META[code]?.label || 'Uncategorized Anomaly',
            color: SIGNAL_META[code]?.color || DEFAULT_COLOR,
          }))
          .sort((a, b) => b.count - a.count) // Sort highest count first

        setSignalDistribution(formattedSignals)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to fetch analytics data:", err)
        setLoading(false)
      })
  }, [])

  const total = signalDistribution.reduce((s, d) => s + d.count, 0)

  // Build conic-gradient stops for the live donut chart.
  let acc = 0
  const stops = signalDistribution
    .map((d) => {
      const start = (acc / total) * 360
      acc += d.count
      const end = (acc / total) * 360
      return `${d.color} ${start}deg ${end}deg`
    })
    .join(', ')

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Insights
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">Analytics</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most-triggered fraud signals</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
            {loading ? (
              <div className="flex h-44 w-full items-center justify-center text-sm text-muted-foreground">
                Analyzing database signals...
              </div>
            ) : total === 0 ? (
              <div className="flex h-44 w-full items-center justify-center text-sm text-muted-foreground">
                No anomaly signals detected yet.
              </div>
            ) : (
              <>
                <div className="relative size-44 shrink-0">
                  <div
                    className="size-44 rounded-full transition-all duration-1000 ease-out"
                    style={{ background: `conic-gradient(${stops})` }}
                    role="img"
                    aria-label="Pie chart of most commonly triggered fraud signals"
                  />
                  <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full bg-card">
                    <span className="text-2xl font-bold tabular-nums">{total}</span>
                    <span className="text-xs text-muted-foreground">signals</span>
                  </div>
                </div>
                <ul className="flex-1 space-y-2.5">
                  {signalDistribution.map((d) => (
                    <li key={d.code} className="flex items-center gap-3 text-sm">
                      <span
                        className="size-3 shrink-0 rounded-sm"
                        style={{ background: d.color }}
                        aria-hidden
                      />
                      <span className="flex-1 font-mono text-xs font-medium">{d.code}</span>
                      <span className="font-semibold tabular-nums">{d.count}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Signal frequency</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading && <p className="text-sm text-muted-foreground">Loading frequency data...</p>}
            {!loading && total === 0 && <p className="text-sm text-muted-foreground">No data available.</p>}
            
            {!loading && signalDistribution.map((d) => {
              const max = signalDistribution[0].count // Highest count is first due to sorting
              return (
                <div key={d.code} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex min-w-0 items-baseline gap-2">
                      <span className="shrink-0 font-mono text-xs font-semibold">{d.code}</span>
                      <span className="truncate text-xs text-muted-foreground">{d.label}</span>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{d.count} hits</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${(d.count / max) * 100}%`, background: d.color }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}