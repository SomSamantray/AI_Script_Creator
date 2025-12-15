import { getSheet, SHEET_NAMES } from '../google-sheets/client';
import { v4 as uuidv4 } from 'uuid';

// Document status types
export type DocumentStatus =
  | 'queued'
  | 'organizing'
  | 'generating_script'
  | 'generating_audio'
  | 'stitching'
  | 'complete'
  | 'error';

// Document input types
export type DocumentInputType = 'text' | 'docx';

// Document interface
export interface Document {
  id: string;
  title: string;
  input_type: DocumentInputType;
  content?: string; // For text paste
  file_url?: string; // For DOCX uploads
  status: DocumentStatus;
  progress_percentage: number;
  current_step: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// Create a new document
export async function createDocument(data: {
  title: string;
  input_type: DocumentInputType;
  content?: string;
  file_url?: string;
}): Promise<Document> {
  const sheet = await getSheet(SHEET_NAMES.DOCUMENTS);

  const document: Document = {
    id: uuidv4(),
    title: data.title,
    input_type: data.input_type,
    content: data.content || '',
    file_url: data.file_url || '',
    status: 'queued',
    progress_percentage: 0,
    current_step: 'Document queued for processing',
    error_message: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Add row to sheet
  await sheet.addRow([
    document.id,
    document.title,
    document.input_type,
    document.content || '',
    document.file_url || '',
    document.status,
    document.progress_percentage,
    document.current_step,
    document.error_message || '',
    document.created_at,
    document.updated_at,
  ]);

  return document;
}

// Get document by ID
export async function getDocument(documentId: string): Promise<Document | null> {
  const sheet = await getSheet(SHEET_NAMES.DOCUMENTS);
  const rows = await sheet.getRows();

  const row = rows.find((r) => r.get('id') === documentId);
  if (!row) return null;

  return {
    id: row.get('id'),
    title: row.get('title'),
    input_type: row.get('input_type') as DocumentInputType,
    content: row.get('content'),
    file_url: row.get('file_url'),
    status: row.get('status') as DocumentStatus,
    progress_percentage: parseInt(row.get('progress_percentage') || '0', 10),
    current_step: row.get('current_step'),
    error_message: row.get('error_message'),
    created_at: row.get('created_at'),
    updated_at: row.get('updated_at'),
  };
}

// Update document
export async function updateDocument(
  documentId: string,
  updates: Partial<Omit<Document, 'id' | 'created_at'>>
): Promise<void> {
  const sheet = await getSheet(SHEET_NAMES.DOCUMENTS);
  const rows = await sheet.getRows();

  const row = rows.find((r) => r.get('id') === documentId);
  if (!row) {
    throw new Error(`Document with id ${documentId} not found`);
  }

  // Update fields
  if (updates.title !== undefined) row.set('title', updates.title);
  if (updates.input_type !== undefined) row.set('input_type', updates.input_type);
  if (updates.content !== undefined) row.set('content', updates.content);
  if (updates.file_url !== undefined) row.set('file_url', updates.file_url);
  if (updates.status !== undefined) row.set('status', updates.status);
  if (updates.progress_percentage !== undefined)
    row.set('progress_percentage', updates.progress_percentage.toString());
  if (updates.current_step !== undefined) row.set('current_step', updates.current_step);
  if (updates.error_message !== undefined) row.set('error_message', updates.error_message);

  // Always update updated_at timestamp
  row.set('updated_at', new Date().toISOString());

  await row.save();
}

// Delete document
export async function deleteDocument(documentId: string): Promise<void> {
  const sheet = await getSheet(SHEET_NAMES.DOCUMENTS);
  const rows = await sheet.getRows();

  const row = rows.find((r) => r.get('id') === documentId);
  if (!row) {
    throw new Error(`Document with id ${documentId} not found`);
  }

  await row.delete();
}

// Get all documents (with optional limit)
export async function getAllDocuments(limit?: number): Promise<Document[]> {
  const sheet = await getSheet(SHEET_NAMES.DOCUMENTS);
  const rows = await sheet.getRows({ limit });

  return rows.map((row) => ({
    id: row.get('id'),
    title: row.get('title'),
    input_type: row.get('input_type') as DocumentInputType,
    content: row.get('content'),
    file_url: row.get('file_url'),
    status: row.get('status') as DocumentStatus,
    progress_percentage: parseInt(row.get('progress_percentage') || '0', 10),
    current_step: row.get('current_step'),
    error_message: row.get('error_message'),
    created_at: row.get('created_at'),
    updated_at: row.get('updated_at'),
  }));
}
