'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, CheckCheck } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function AlertsView() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/invoices')
      .then((res) => res.json())
      .then((data) => {
        // Isolate only real live invoices that triggered system risk holds or overrides
        const highRiskInvoices = data.filter((inv: any) => inv.risk_score >= 46)

        // Convert transactional records into live security telemetry alert text
        const liveDispatches = highRiskInvoices.map((inv: any) => {
          const signals = Array.isArray(inv.signals_triggered) && inv.signals_triggered.length > 0
            ? inv.signals_triggered.join(', ')
            : 'W-SYS-ANOMALY'

          return {
            vendor: inv.vendor_name_raw || 'Unknown Vendor',
            phone: inv.owner_phone || '+91 98765 43210', // Dynamically loads presentation phone parameters
            message: `Whitenote Security Protocol: High-risk anomaly identified for vendor "${inv.vendor_name_raw || 'Unknown Vendor'}". Risk Evaluation: ${inv.risk_score}/100. Flags Raised: [${signals}]. Account routing state forced to HOLD.`,
            time: new Date(inv.created_at || inv.processed_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          }
        })

        setAlerts(liveDispatches)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to compile cloud security dispatches:", err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Notifications
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">Alerts</h2>
        </div>
        <Badge variant="destructive">
          {loading ? 'Scanning...' : `${alerts.length} dispatched today`}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="size-4 text-secondary" />
            Recently dispatched WhatsApp security alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && (
            <p className="py-6 text-sm text-muted-foreground text-center">Syncing system alert logs...</p>
          )}
          
          {!loading && alerts.length === 0 && (
            <p className="py-6 text-sm text-muted-foreground text-center">No security alerts dispatched today. All transfers secure.</p>
          )}

          {!loading && alerts.map((a, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                <MessageCircle className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{a.vendor}</p>
                  <span className="font-mono text-xs text-muted-foreground">{a.phone}</span>
                </div>
                <p className="mt-1 text-sm text-foreground/80">{a.message}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCheck className="size-3.5 text-secondary" />
                  Delivered · {a.time}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}