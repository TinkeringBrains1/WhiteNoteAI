export type RiskVerdict = 'Approve' | 'Manual review' | 'Block payment'

export type InvoiceRow = {
  id: string
  date: string
  vendor: string
  amount: number
  riskScore: number
  verdict: RiskVerdict
  status: 'Cleared' | 'Blocked' | 'In review'
}

export type VendorRow = {
  name: string
  gstin: string
  volume: number
  trustScore: number
}

export const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)

export const dashboardStats = [
  { label: 'Total Invoices', value: '12,847', delta: '+8.2%', up: true },
  { label: 'Fraud Prevented', value: '₹4.7Cr', delta: '+12.4%', up: true },
  { label: 'High-Risk Flags', value: '342', delta: '+3.1%', up: false },
  { label: 'Active Vendors', value: '1,206', delta: '+1.9%', up: true },
]

// invoices processed over last 7 days
export const weeklyVolume = [
  { day: 'Mon', total: 184, flagged: 22 },
  { day: 'Tue', total: 231, flagged: 31 },
  { day: 'Wed', total: 198, flagged: 18 },
  { day: 'Thu', total: 276, flagged: 44 },
  { day: 'Fri', total: 312, flagged: 51 },
  { day: 'Sat', total: 142, flagged: 12 },
  { day: 'Sun', total: 97, flagged: 7 },
]

export const recentHighRisk = [
  { vendor: 'Meridian Supplies Pvt Ltd', amount: 184500, score: 91, time: '2m ago', signal: 'W-GST-01' },
  { vendor: 'Nimbus Tech Solutions', amount: 256000, score: 87, time: '14m ago', signal: 'W-DUP-02' },
  { vendor: 'Quantum Traders', amount: 73200, score: 84, time: '41m ago', signal: 'W-CTX-03' },
  { vendor: 'Veracore Industries', amount: 47300, score: 82, time: '1h ago', signal: 'W-AMT-07' },
]

export const invoiceQueue: InvoiceRow[] = [
  { id: 'INV-2041', date: '2026-06-28', vendor: 'Meridian Supplies Pvt Ltd', amount: 184500, riskScore: 91, verdict: 'Block payment', status: 'Blocked' },
  { id: 'INV-2040', date: '2026-06-28', vendor: 'Apex Logistics LLP', amount: 92750, riskScore: 34, verdict: 'Approve', status: 'Cleared' },
  { id: 'INV-2039', date: '2026-06-27', vendor: 'Nimbus Tech Solutions', amount: 256000, riskScore: 87, verdict: 'Block payment', status: 'Blocked' },
  { id: 'INV-2038', date: '2026-06-27', vendor: 'Stellar Components', amount: 41200, riskScore: 22, verdict: 'Approve', status: 'Cleared' },
  { id: 'INV-2037', date: '2026-06-27', vendor: 'Quantum Traders', amount: 73200, riskScore: 68, verdict: 'Manual review', status: 'In review' },
  { id: 'INV-2036', date: '2026-06-26', vendor: 'Veracore Industries', amount: 47300, riskScore: 82, verdict: 'Block payment', status: 'Blocked' },
  { id: 'INV-2035', date: '2026-06-26', vendor: 'BlueOak Materials', amount: 118900, riskScore: 19, verdict: 'Approve', status: 'Cleared' },
  { id: 'INV-2034', date: '2026-06-25', vendor: 'Horizon Freight', amount: 65400, riskScore: 57, verdict: 'Manual review', status: 'In review' },
]

export const vendors: VendorRow[] = [
  { name: 'Apex Logistics LLP', gstin: '27AAPCA1234F1Z5', volume: 8420000, trustScore: 94 },
  { name: 'Stellar Components', gstin: '29AABCS9876K1Z2', volume: 5310000, trustScore: 88 },
  { name: 'BlueOak Materials', gstin: '06AAACB4567P1Z9', volume: 3980000, trustScore: 81 },
  { name: 'Horizon Freight', gstin: '24AAGCH1122L1Z4', volume: 2740000, trustScore: 63 },
  { name: 'Meridian Supplies Pvt Ltd', gstin: '07AAECM7788Q1Z1', volume: 1920000, trustScore: 38 },
  { name: 'Nimbus Tech Solutions', gstin: '33AADCN3344R1Z7', volume: 1450000, trustScore: 29 },
]

export const whatsappAlerts = [
  { vendor: 'Meridian Supplies Pvt Ltd', phone: '+91 98••• ••231', message: 'High-risk invoice INV-2041 blocked. Risk 91.', time: '2m ago' },
  { vendor: 'Nimbus Tech Solutions', phone: '+91 99••• ••884', message: 'Duplicate invoice detected (W-DUP-02).', time: '14m ago' },
  { vendor: 'Quantum Traders', phone: '+91 70••• ••012', message: 'Manual review requested for INV-2037.', time: '41m ago' },
  { vendor: 'Veracore Industries', phone: '+91 88••• ••556', message: 'Amount anomaly W-AMT-07 flagged.', time: '1h ago' },
]

export const signalDistribution = [
  { code: 'W-GST-01', label: 'GSTIN mismatch', count: 128, color: 'var(--destructive)' },
  { code: 'W-CTX-03', label: 'Contextual anomaly', count: 96, color: 'var(--accent)' },
  { code: 'W-DUP-02', label: 'Duplicate invoice', count: 74, color: 'var(--chart-2)' },
  { code: 'W-AMT-07', label: 'Amount deviation', count: 53, color: 'var(--primary)' },
  { code: 'W-BNK-09', label: 'Bank detail change', count: 31, color: 'var(--chart-4)' },
]

export const signalMeta: Record<string, { label: string; points: number }> = {
  'W-GST-01': { label: 'GSTIN not matched to active filing', points: 28 },
  'W-GST-04': { label: 'GSTIN registration recently modified', points: 15 },
  'W-CTX-03': { label: 'Unusual billing context detected', points: 18 },
  'W-DUP-02': { label: 'Near-duplicate invoice number', points: 22 },
  'W-AMT-07': { label: 'Amount deviates from baseline', points: 19 },
  'W-VEN-05': { label: 'Vendor age below threshold', points: 12 },
  'W-BNK-09': { label: 'Bank account details changed', points: 24 },
}
