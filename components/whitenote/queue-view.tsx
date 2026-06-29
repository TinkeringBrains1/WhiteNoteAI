'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatINR } from '@/lib/mock-data' // Keeping this just for the currency formatter

function verdictBadge(level: string) {
  const normalized = (level || '').toLowerCase()
  if (normalized === 'blocked' || normalized === 'block')
    return <Badge variant="destructive">Block</Badge>
  if (normalized === 'hold' || normalized === 'review')
    return (
      <Badge variant="outline" className="border-accent/40 text-accent">
        Review
      </Badge>
    )
  return <Badge variant="secondary">Approve</Badge>
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-destructive'
  if (score >= 46) return 'text-accent'
  return 'text-secondary'
}

function statusBadge(status: string) {
  const normalized = (status || '').toLowerCase()
  if (normalized === 'blocked') return <Badge variant="outline" className="border-destructive/40 text-destructive">Blocked</Badge>
  if (normalized === 'hold' || normalized === 'review' || normalized === 'pending') return <Badge variant="outline" className="border-accent/40 text-accent">{status}</Badge>
  return <Badge variant="outline" className="border-secondary/40 text-secondary">Cleared</Badge>
}

export function QueueView() {
  const [query, setQuery] = useState('')
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // FETCH LIVE DATA FROM YOUR AWS DATABASE
  useEffect(() => {
    fetch('/api/invoices')
      .then((res) => res.json())
      .then((data) => {
        setInvoices(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to fetch live invoices:", err)
        setLoading(false)
      })
  }, [])

  const q = query.trim().toLowerCase()
  const rows = q
    ? invoices.filter(
        (row) =>
          row.vendor_name?.toLowerCase().includes(q) ||
          row.invoice_number?.toLowerCase().includes(q) ||
          row.status?.toLowerCase().includes(q) ||
          row.risk_level?.toLowerCase().includes(q),
      )
    : invoices

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Processing
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">Invoice Queue</h2>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search invoices…"
            className="pl-9"
            aria-label="Search invoices"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Invoice / Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Risk Score</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    Loading live database records...
                  </TableCell>
                </TableRow>
              )}
              {!loading && rows.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No invoices match &ldquo;{query}&rdquo;.
                  </TableCell>
                </TableRow>
              )}
              {!loading && rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <span className="font-mono text-sm font-medium">{row.invoice_number || 'UNKNOWN'}</span>
                    <span className="block text-xs text-muted-foreground">
                      {new Date(row.created_at || row.processed_at).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{row.vendor_name || 'Unknown Vendor'}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatINR(row.amount_total || 0)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`font-bold tabular-nums ${scoreColor(row.risk_score)}`}>
                        {row.risk_score}
                      </span>
                      {verdictBadge(row.risk_level)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{statusBadge(row.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}