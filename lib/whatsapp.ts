export async function sendWhatsAppAlert(phone: string, message: string) {
  const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
  const rawTargetPhone = process.env.WHATSAPP_ALERT_RECIPIENT || phone;

  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    console.warn("WhatsApp credentials missing from .env.local");
    return;
  }

  try {
    // Strip spaces and the '+' symbol
    const cleanPhone = rawTargetPhone.replace(/[\s+]+/g, ''); 
    
    const res = await fetch(`https://graph.facebook.com/v25.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
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
          body: message,
        },
      }),
    });

    const data = await res.json();
    
    if (data.error) {
      console.error("WhatsApp API Error Response:", data.error);
      throw new Error(data.error.message);
    }
    
    console.log(`Successfully dispatched WhatsApp alert to: ${cleanPhone}`);
    return data;
  } catch (error: any) {
    console.error("WhatsApp delivery failed:", error.message);
    throw new Error("Communication layer failure.");
  }
}