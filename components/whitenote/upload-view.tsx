'use client'

import { useCallback, useRef, useState } from 'react'
import {
  UploadCloud,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Ban,
  CheckCheck,
  MessageSquareWarning,
  Building2,
  CalendarDays,
  Receipt,
  History,
  X,
  AlertCircle
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatINR, signalMeta } from '@/lib/mock-data'

type Verdict = {
  riskScore: number
  riskTier: string
  signalsTriggered: string[]
  reasoning: string
  vendorName: string
  invoiceAmount: number
}

type Stage = 'idle' | 'running' | 'done' | 'flagged'

const AGENTS = [
  { key: 'parser', label: 'Parser agent', desc: 'Extracting line items & metadata' },
  { key: 'gst', label: 'GST validator agent', desc: 'Verifying GSTIN against filings' },
  { key: 'search', label: 'Elastic search agent', desc: 'Matching against invoice history' },
  { key: 'scorer', label: 'Anomaly scorer agent', desc: 'Computing composite risk score' },
] as const

function tierTone(score: number) {
  if (score >= 80) return 'destructive'
  if (score >= 60) return 'accent'
  return 'secondary'
}

export function UploadView() {
  const [view, setView] = useState<'form' | 'loading' | 'report'>('form')
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [gstin, setGstin] = useState('')
  const [agentStages, setAgentStages] = useState<Stage[]>(['idle', 'idle', 'idle', 'idle'])
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) setFile(f)
  }, [])

  const runAnalysis = useCallback(async () => {
    if (!file || !gstin) return
    
    setError(null) 
    setView('loading')
    setAgentStages(['running', 'idle', 'idle', 'idle'])

    const timers: ReturnType<typeof setTimeout>[] = []
    AGENTS.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setAgentStages((prev) => {
            const next = [...prev]
            next[i] = 'done' 
            if (i + 1 < next.length) next[i + 1] = 'running'
            return next
          })
        }, 650 * (i + 1)),
      )
    })

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('gstin', gstin)
      fd.append('gmailAccessToken', 'mock-gmail-access-token')

      const res = await fetch('/api/invoices', { method: 'POST', body: fd })
      
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`)
      }

      const data: Verdict = await res.json()
      timers.forEach(clearTimeout)
      
      const hasFlags = data.signalsTriggered && data.signalsTriggered.length > 0;
      setAgentStages(['done', 'done', 'done', hasFlags ? 'flagged' : 'done'])
      
      setVerdict(data)
      setView('report')
    } catch (err) {
      timers.forEach(clearTimeout)
      console.error("Analysis Failed:", err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred during analysis.')
      setAgentStages(['idle', 'idle', 'idle', 'idle'])
      setView('form') 
    }
  }, [file, gstin])

  const reset = () => {
    setView('form')
    setFile(null)
    setGstin('')
    setVerdict(null)
    setError(null)
    setAgentStages(['idle', 'idle', 'idle', 'idle'])
  }

  // ---------- STATE 3: REPORT ----------
  if (view === 'report' && verdict && verdict.signalsTriggered) {
    const tone = tierTone(verdict.riskScore);
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Risk Analysis
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-balance">
              {verdict.vendorName}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex items-center gap-3 rounded-xl border px-4 py-2',
                tone === 'destructive'
                  ? 'border-destructive/40 bg-destructive/10'
                  : tone === 'accent'
                    ? 'border-accent/40 bg-accent/10'
                    : 'border-secondary/40 bg-secondary/10',
              )}
            >
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Risk Score
              </span>
              <span
                className={cn(
                  'text-3xl font-bold tabular-nums',
                  tone === 'destructive'
                    ? 'text-destructive'
                    : tone === 'accent'
                      ? 'text-accent'
                      : 'text-secondary',
                )}
              >
                {verdict.riskScore}
              </span>
            </div>
            <Button variant="outline" size="lg" onClick={reset}>
              <X /> New analysis
            </Button>
          </div>
        </div>

        <Alert variant={tone === 'destructive' ? 'destructive' : 'default'} className={tone === 'destructive' ? "border-destructive/40 bg-destructive/10" : ""}>
          <ShieldAlert className="size-5" />
          <AlertTitle className="text-base">
            AI recommendation: {verdict.riskTier}
          </AlertTitle>
          <AlertDescription className="text-foreground/80">
            {verdict.reasoning}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/15">
                <Ban /> Block payment
              </Button>
              <Button variant="ghost" size="sm" className="text-secondary hover:bg-secondary/15">
                <CheckCheck /> Override &amp; approve
              </Button>
              <Button variant="ghost" size="sm" className="text-foreground hover:bg-muted">
                <MessageSquareWarning /> Request clarification
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <h3 className="text-sm font-semibold tracking-tight">Signal breakdown</h3>
            
            {verdict.signalsTriggered.length === 0 ? (
               <div className="text-sm text-muted-foreground italic p-4 border rounded-lg bg-muted/20">
                  No risk signals detected.
               </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {verdict.signalsTriggered.map((code) => {
                  const meta = signalMeta[code] ?? { label: 'Anomaly signal', points: 10 }
                  return (
                    <Card key={code} className="border-destructive/30 bg-destructive/5">
                      <CardContent className="flex items-start gap-3 p-4">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
                          <AlertTriangle className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-sm font-semibold text-foreground">
                                {code}
                              </span>
                              <Badge variant="destructive">+{meta.points} pts</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{meta.label}</p>
                          </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Receipt className="size-4 text-primary" /> Invoice details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <DetailRow icon={Building2} label="Vendor" value={verdict.vendorName} />
                <DetailRow
                  icon={Receipt}
                  label="Amount"
                  value={formatINR(verdict.invoiceAmount)}
                />
                <DetailRow icon={CalendarDays} label="Date" value="28 Jun 2026" />
              </CardContent>
            </Card>

            <Card className="border-accent/30 bg-accent/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <History className="size-4 text-accent" /> Vendor history
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm text-foreground/80">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-accent" />
                  <span>
                    No prior transaction history found for this vendor. First-time vendors carry
                    elevated baseline risk.
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // ---------- STATE 1 & 2: FORM + LOADING ----------
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Core Feature
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">Upload Invoice</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Submit an invoice to run it through the Whitenote AI fraud-detection pipeline.
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6 border-destructive/50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Analysis Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice submission</CardTitle>
            <CardDescription>PDF only. All fields are required.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
                dragging
                  ? 'border-primary bg-primary/10'
                  : file
                    ? 'border-secondary/50 bg-secondary/5'
                    : 'border-border hover:border-primary/60 hover:bg-muted/40',
              )}
            >
              {file ? (
                <>
                  <div className="flex size-12 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                    <FileText className="size-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(0)} KB · ready to analyze
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <UploadCloud className="size-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Drag &amp; drop your invoice PDF</p>
                    <p className="text-xs text-muted-foreground">or click to browse files</p>
                  </div>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstin">
                Vendor GSTIN <span className="text-destructive">*</span>
              </Label>
              <Input
                id="gstin"
                placeholder="27AAPCA1234F1Z5"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className="font-mono"
              />
            </div>

            <Button
              size="lg"
              className="w-full"
              disabled={!file || !gstin || view === 'loading'}
              onClick={runAnalysis}
            >
              {view === 'loading' ? (
                <>
                  <Loader2 className="animate-spin" /> Analyzing…
                </>
              ) : (
                <>
                  <ShieldAlert /> Run AI Analysis
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agent Pipeline Status</CardTitle>
            <CardDescription>
              {view === 'loading'
                ? 'Agents are processing your invoice…'
                : 'Submit an invoice to activate the multi-agent pipeline.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {AGENTS.map((agent, i) => {
              const stage = view === 'loading' ? agentStages[i] : 'idle'
              return (
                <div
                  key={agent.key}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                    stage === 'running'
                      ? 'border-primary/40 bg-primary/5'
                      : stage === 'done'
                        ? 'border-secondary/30 bg-secondary/5'
                        : stage === 'flagged'
                          ? 'border-destructive/30 bg-destructive/5'
                          : 'border-border',
                  )}
                >
                  <div
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-lg',
                      stage === 'running'
                        ? 'bg-primary/15 text-primary'
                        : stage === 'done'
                          ? 'bg-secondary/15 text-secondary'
                          : stage === 'flagged'
                            ? 'bg-destructive/15 text-destructive'
                            : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {stage === 'running' ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : stage === 'done' ? (
                      <CheckCircle2 className="size-4" />
                    ) : stage === 'flagged' ? (
                      <AlertTriangle className="size-4" />
                    ) : (
                      <span className="font-mono text-xs">{i + 1}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{agent.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{agent.desc}</p>
                  </div>
                  {stage === 'running' && (
                    <Badge variant="outline" className="border-primary/40 text-primary">
                      Running…
                    </Badge>
                  )}
                  {stage === 'done' && (
                    <Badge variant="secondary">Done</Badge>
                  )}
                  {stage === 'flagged' && (
                    <Badge variant="destructive">Flags found</Badge>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" /> {label}
      </span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}