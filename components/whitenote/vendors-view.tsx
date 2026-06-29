'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatINR } from '@/lib/mock-data' // Keeping for currency formatting

function trustColor(score: number) {
  if (score >= 80) return 'text-secondary' // Green/Safe
  if (score >= 50) return 'text-accent'    // Yellow/Warning
  return 'text-destructive'                // Red/Danger
}

export function VendorsView() {
  const [vendorsList, setVendorsList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/invoices')
      .then((res) => res.json())
      .then((data) => {
        const vendorMap: Record<string, any> = {}

        data.forEach((inv: any) => {
          // Catch both snake_case (database) and camelCase (API serializers)
          const name = inv.vendor_name_raw || inv.vendorNameRaw || inv.vendor_name || inv.vendorName || 'Unknown Vendor'
          const gstin = inv.vendor_gstin_raw || inv.vendorGstinRaw || 'PENDING-GSTIN'
          const key = gstin !== 'PENDING-GSTIN' ? gstin : name
          
          const amount = Number(inv.amount_total || inv.amountTotal) || 0
          const risk = Number(inv.risk_score || inv.riskScore) || 0

          if (!vendorMap[key]) {
            vendorMap[key] = {
              name,
              gstin,
              volume: 0,
              totalRisk: 0,
              invoiceCount: 0,
            }
          } else {
            // 🎯 If the dictionary currently says "Unknown Vendor" but THIS invoice has the real name, overwrite it!
            if (vendorMap[key].name === 'Unknown Vendor' && name !== 'Unknown Vendor') {
              vendorMap[key].name = name;
            }
          }

          vendorMap[key].volume += amount
          vendorMap[key].totalRisk += risk
          vendorMap[key].invoiceCount += 1
        })

        // Convert the map to an array and calculate the Trust Score
        const liveVendors = Object.values(vendorMap)
          .map((v) => {
            const avgRisk = v.totalRisk / v.invoiceCount
            const trustScore = Math.max(0, Math.round(100 - avgRisk))
            
            return {
              ...v,
              trustScore,
            }
          })
          .sort((a, b) => b.volume - a.volume) // Sort by highest transaction volume

        setVendorsList(liveVendors)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to fetch vendor data:", err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Directory
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">Vendors</h2>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Vendor Name</TableHead>
                <TableHead>GSTIN</TableHead>
                <TableHead className="text-right">Transaction Volume</TableHead>
                <TableHead className="w-56">Trust Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    Compiling vendor directory from live transactions...
                  </TableCell>
                </TableRow>
              )}
              
              {!loading && vendorsList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    No vendor data available.
                  </TableCell>
                </TableRow>
              )}

              {!loading && vendorsList.map((v) => (
                <TableRow key={v.gstin + v.name}>
                  <TableCell className="font-medium">{v.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {v.gstin}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatINR(v.volume)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Progress value={v.trustScore} className="h-2 flex-1" />
                      <span
                        className={cn('w-8 text-right text-sm font-semibold tabular-nums', trustColor(v.trustScore))}
                      >
                        {v.trustScore}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}