import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// We need read-only access to search and view messages
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

/**
 * Generate the URL the user clicks to authorize our app.
 */
export function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Forces refresh token generation
  });
}

/**
 * Exchange the code from the redirect URL for auth tokens.
 */
export async function getTokens(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * The core retrieval function: Searches a user's inbox for a specific vendor or invoice number
 * and returns the plain text of the email thread for Gemini to read.
 */
export async function searchVendorContext(accessToken: string, query: string): Promise<string> {
  // ==========================================
  // HACKATHON / DEMO MODE BYPASS
  // ==========================================
  if (accessToken === 'mock-gmail-access-token' || process.env.GMAIL_MOCK_MODE === 'true') {
    console.log("Using Mock Gmail Context for:", query);
    return "MOCK EMAIL CONTEXT: Previous correspondence with this vendor indicates standard payment terms. No urgent warnings or bank account changes requested via email.";
  }

  oauth2Client.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  try {
    // Search for emails matching the vendor name or invoice number
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 3, // Keep it tight for context windows
    });

    const messages = res.data.messages;
    if (!messages || messages.length === 0) {
      return "No context found in Gmail for this query.";
    }

    let fullContext = "";

    // Fetch the actual payload for each matched message
    for (const msg of messages) {
      if (!msg.id) continue;
      const msgData = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full', // 'full' allows us to parse the body
      });

      // Extract subject for context
      const headers = msgData.data.payload?.headers;
      const subject = headers?.find((h) => h.name === 'Subject')?.value || 'No Subject';
      
      // Basic extraction of snippet (we can parse deep body parts later if needed)
      const snippet = msgData.data.snippet;
      
      fullContext += `\n--- Email: ${subject} ---\n${snippet}\n`;
    }

    return fullContext;
  } catch (error) {
    console.error('Error fetching Gmail context:', error);
    throw new Error('Failed to retrieve Gmail context.');
  }
}