import { NextResponse } from 'next/server';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// 1. Verification Endpoint (Required by Meta to register the Webhook)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED');
    // Meta requires us to return just the challenge string with a 200 OK
    return new NextResponse(challenge, { status: 200 });
  } else {
    // Responds with '403 Forbidden' if verify tokens do not match
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
  }
}

// 2. Incoming Message Listener
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check if it's a WhatsApp status update or a real message
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      // If there is an actual text message
      if (message && message.type === 'text') {
        const fromPhone = message.from;
        const textContent = message.text.body;

        console.log(`💬 Incoming message from ${fromPhone}: ${textContent}`);

        // Note: For the hackathon MVP, we are just logging the replies to the terminal.
        // Post-hackathon, we would import the DB client here and insert the chat history.
      }

      return NextResponse.json({ status: 'success' }, { status: 200 });
    }

    return NextResponse.json({ status: 'ignored' }, { status: 404 });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}