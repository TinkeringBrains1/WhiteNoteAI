import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Handle authentication cancellation or errors from Google
    if (error) {
      console.error('Google OAuth Error:', error);
      return NextResponse.redirect(new URL('/dashboard?auth_status=error', request.url));
    }

    if (!code) {
      return NextResponse.json({ error: 'Authorization code missing.' }, { status: 400 });
    }

    // Exchange the authorization code for access tokens
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || '',
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await response.json();

    if (!response.ok) {
      console.error('Token exchange failure:', tokenData);
      return NextResponse.json({ error: 'Failed to exchange authorization code.' }, { status: 500 });
    }

    /**
     * Token Exchange Payload Breakdown:
     * tokenData.access_token   -> Used to authenticate Gmail API requests
     * tokenData.refresh_token  -> Used to request a new access token when it expires
     * tokenData.expires_in     -> Lifetime of the access token (typically 3600 seconds)
     */
    console.log('Google OAuth authentication successful.');

    // Redirect the user back to the application dashboard with the authentication state
    const redirectUrl = new URL('/dashboard', request.url);
    redirectUrl.searchParams.set('auth_status', 'success');
    
    // For production/hackathon builds, you can pass the short-lived access token back 
    // via a secure HTTP-only cookie or hash fragments depending on your session strategy.
    const finalResponse = NextResponse.redirect(redirectUrl);
    
    finalResponse.cookies.set('gmail_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in, 
    });

    return finalResponse;

  } catch (error) {
    console.error('OAuth Callback Exception:', error);
    return NextResponse.json({ error: 'Internal server error during authentication.' }, { status: 500 });
  }
}