import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Cache for spreadsheet document to reduce API calls
let cachedDoc: GoogleSpreadsheet | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 10000; // Cache for 10 seconds

// Initialize Google Sheets client with Service Account
export async function getGoogleSheetsClient() {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!spreadsheetId || !serviceAccountEmail || !privateKey) {
    throw new Error('Missing Google Sheets environment variables');
  }

  // Return cached document if still valid
  const now = Date.now();
  if (cachedDoc && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedDoc;
  }

  // Create JWT client for authentication
  const serviceAccountAuth = new JWT({
    email: serviceAccountEmail,
    key: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  });

  // Initialize spreadsheet
  const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
  await doc.loadInfo();

  // Update cache
  cachedDoc = doc;
  cacheTimestamp = now;

  return doc;
}

// Helper function to get a specific sheet by title
export async function getSheet(sheetTitle: string) {
  const doc = await getGoogleSheetsClient();
  const sheet = doc.sheetsByTitle[sheetTitle];

  if (!sheet) {
    throw new Error(`Sheet "${sheetTitle}" not found in spreadsheet`);
  }

  return sheet;
}

// Sheet names (tabs in the spreadsheet)
export const SHEET_NAMES = {
  DOCUMENTS: 'Documents',
  CHUNKS: 'Chunks',
  AUDIO_OUTPUTS: 'AudioOutputs',
} as const;
