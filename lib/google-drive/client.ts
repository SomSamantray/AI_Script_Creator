import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { Readable } from 'stream';

// Initialize Google Drive client with Service Account
export function getGoogleDriveClient() {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!serviceAccountEmail || !privateKey || !folderId) {
    throw new Error('Missing Google Drive environment variables');
  }

  // Create JWT client for authentication
  const auth = new JWT({
    email: serviceAccountEmail,
    key: privateKey.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const drive = google.drive({ version: 'v3', auth });

  return { drive, folderId };
}

// Upload a file to Google Drive
export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ fileId: string; webViewLink: string; webContentLink: string }> {
  const { drive, folderId } = getGoogleDriveClient();

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const media = {
    mimeType,
    body: Readable.from(fileBuffer),
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, webViewLink, webContentLink',
  });

  if (!response.data.id) {
    throw new Error('Failed to upload file to Google Drive');
  }

  // Make file publicly accessible
  await drive.permissions.create({
    fileId: response.data.id,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  return {
    fileId: response.data.id,
    webViewLink: response.data.webViewLink || '',
    webContentLink: response.data.webContentLink || '',
  };
}

// Download a file from Google Drive
export async function downloadFile(fileId: string): Promise<Buffer> {
  const { drive } = getGoogleDriveClient();

  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );

  return Buffer.from(response.data as ArrayBuffer);
}

// Delete a file from Google Drive
export async function deleteFile(fileId: string): Promise<void> {
  const { drive } = getGoogleDriveClient();
  await drive.files.delete({ fileId });
}

// Get file metadata
export async function getFileMetadata(fileId: string) {
  const { drive } = getGoogleDriveClient();

  const response = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size, createdTime, webViewLink, webContentLink',
  });

  return response.data;
}
