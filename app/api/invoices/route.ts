// app/api/invoices/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { analyzeInvoice } from '@/lib/agent';

export const dynamic = 'force-dynamic';

export async function GET() {
  const orgId = '00000000-0000-0000-0000-000000000001'; 

  try {
    const invoiceQueue = await query(
      `SELECT * FROM invoice_queue WHERE org_id = $1 ORDER BY created_at DESC;`,
      [orgId]
    );

    const formattedRows = invoiceQueue.rows.map((row: any) => ({
      ...row,
      // Map your raw db column to the exact camelCase prop your UI component wants
      vendorName: row.vendor_name,
      
      // Safety net for the amount as well
      invoiceAmount: row.amount_total
    }));

    return NextResponse.json(formattedRows, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch dashboard invoice data view:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================
// POST: Process incoming payload, pass to agent, write records, alert via Meta
// ============================================================
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // 1. Unpack request fields from FormData
    const file = formData.get('file') as File | null;
    const gstin = formData.get('gstin') as string || ''; 
    const gmailAccessToken = formData.get('gmailAccessToken') as string || 'MOCK_TOKEN';
    
    // Fallback phone for the AI agent context (since we removed it from the frontend)
    const ownerPhone = '+919876543210'; 
    
    const invoiceText = file ? `PDF Upload: ${file.name}` : 'No file provided';

    // 2. Invoke the agent framework
    const analysis = await analyzeInvoice(
      invoiceText,
      gstin,
      gmailAccessToken,
      ownerPhone
    );

    // 3. Map the riskTier string to database ENUM keys
    let targetStatus = 'pending';
    const tier = analysis.riskTier?.toLowerCase();
    if (tier === 'block') targetStatus = 'blocked';
    else if (tier === 'hold') targetStatus = 'hold';
    else if (tier === 'review') targetStatus = 'review';

    const orgId = '00000000-0000-0000-0000-000000000001'; // Mehta & Associates UUID

    // 4. Save results to the core invoices transactional table
    const insertInvoiceSql = `
      INSERT INTO invoices (
        org_id, invoice_number, vendor_name_raw, vendor_gstin_raw, 
        amount_total, status, risk_score, risk_level, 
        signals_triggered, agent_report, processed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING id, risk_score, risk_level, status;
    `;

    const invoiceInsertion = await query(insertInvoiceSql, [
      orgId,
      `INV-${Math.floor(Math.random() * 10000)}`, 
      analysis.vendorName || 'Unknown Vendor',
      gstin,
      analysis.invoiceAmount || 0,
      targetStatus,
      analysis.riskScore || 0,
      tier || 'approve',
      analysis.signalsTriggered || [], 
      analysis.reasoning || 'No reasoning provided.',
    ]);

    const newInvoice = invoiceInsertion.rows[0];

    // 5. Build telemetry visibility trail inside the immutable audit_log table
    await query(
      `INSERT INTO audit_log (org_id, invoice_id, actor, action, detail) VALUES ($1, $2, $3, $4, $5);`,
      [
        orgId,
        newInvoice.id,
        'agent',
        'invoice_scored',
        JSON.stringify({ 
          risk_score: newInvoice.risk_score, 
          risk_level: newInvoice.risk_level, 
          status: newInvoice.status 
        })
      ]
    );

    const isSuspicious = (analysis.riskScore || 0) >= 70 || targetStatus !== 'pending';
    
    // Read environment values injected via .env.local
    const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
    const rawTargetPhone = process.env.WHATSAPP_ALERT_RECIPIENT || ownerPhone;

    if (isSuspicious && WHATSAPP_PHONE_NUMBER_ID && WHATSAPP_ACCESS_TOKEN) {
      try {
        // Formats phone numbers by stripping spaces/symbols
        const cleanPhone = rawTargetPhone.replace(/[\s+]+/g, ''); 
        const signals = analysis.signalsTriggered?.join(', ') || 'None';

        const messageText = `*WHITENOTE FRAUD ALERT*\n\n` +
                            `*Vendor:* ${analysis.vendorName}\n` +
                            `*Amount:* ₹${analysis.invoiceAmount?.toLocaleString('en-IN')}\n` +
                            `*Risk Score:* ${analysis.riskScore}/100\n` +
                            `*Pipeline Status:* ${targetStatus.toUpperCase()}\n\n` +
                            `*Flags:* [${signals}]\n\n` +
                            `*AI Verdict:* ${analysis.reasoning?.substring(0, 120)}...`;

        // Native fetch hitting Meta's v25.0 Graph API
        await fetch(`https://graph.facebook.com/v25.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone,
            type: 'text',
            text: {
              preview_url: false,
              body: messageText,
            },
          }),
        });
        
        console.log(`Dispatched live Meta WhatsApp alert to: ${cleanPhone}`);
      } catch (metaErr) {
        // Log error but allow DB transaction to succeed
        console.error("Failed to fire alert gateway payload:", metaErr);
      }
    }

    // 7. Return evaluations back to the frontend
    return NextResponse.json(analysis, { status: 201 });

  } catch (error: any) {
    console.error("API POST entry point execution failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}