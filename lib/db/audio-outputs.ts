import { getSheet, SHEET_NAMES } from '../google-sheets/client';
import { v4 as uuidv4 } from 'uuid';

// AudioOutput interface
export interface AudioOutput {
  id: string;
  document_id: string;
  script_text: string;
  audio_url: string;
  duration_seconds: number;
  file_size_bytes: number;
  created_at: string;
}

// Create a new audio output
export async function createAudioOutput(data: {
  document_id: string;
  script_text: string;
  audio_url: string;
  duration_seconds: number;
  file_size_bytes: number;
}): Promise<AudioOutput> {
  const sheet = await getSheet(SHEET_NAMES.AUDIO_OUTPUTS);

  const audioOutput: AudioOutput = {
    id: uuidv4(),
    document_id: data.document_id,
    script_text: data.script_text,
    audio_url: data.audio_url,
    duration_seconds: data.duration_seconds,
    file_size_bytes: data.file_size_bytes,
    created_at: new Date().toISOString(),
  };

  // Add row to sheet
  await sheet.addRow([
    audioOutput.id,
    audioOutput.document_id,
    audioOutput.script_text,
    audioOutput.audio_url,
    audioOutput.duration_seconds,
    audioOutput.file_size_bytes,
    audioOutput.created_at,
  ]);

  return audioOutput;
}

// Get audio output by document ID
export async function getAudioOutputByDocumentId(
  documentId: string
): Promise<AudioOutput | null> {
  const sheet = await getSheet(SHEET_NAMES.AUDIO_OUTPUTS);
  const rows = await sheet.getRows();

  const row = rows.find((r) => r.get('document_id') === documentId);
  if (!row) return null;

  return {
    id: row.get('id'),
    document_id: row.get('document_id'),
    script_text: row.get('script_text'),
    audio_url: row.get('audio_url'),
    duration_seconds: parseFloat(row.get('duration_seconds') || '0'),
    file_size_bytes: parseInt(row.get('file_size_bytes') || '0', 10),
    created_at: row.get('created_at'),
  };
}

// Update audio output
export async function updateAudioOutput(
  documentId: string,
  updates: Partial<Omit<AudioOutput, 'id' | 'document_id' | 'created_at'>>
): Promise<void> {
  const sheet = await getSheet(SHEET_NAMES.AUDIO_OUTPUTS);
  const rows = await sheet.getRows();

  const row = rows.find((r) => r.get('document_id') === documentId);
  if (!row) {
    throw new Error(`Audio output for document ${documentId} not found`);
  }

  // Update fields
  if (updates.script_text !== undefined) row.set('script_text', updates.script_text);
  if (updates.audio_url !== undefined) row.set('audio_url', updates.audio_url);
  if (updates.duration_seconds !== undefined)
    row.set('duration_seconds', updates.duration_seconds.toString());
  if (updates.file_size_bytes !== undefined)
    row.set('file_size_bytes', updates.file_size_bytes.toString());

  await row.save();
}

// Delete audio output by document ID
export async function deleteAudioOutputByDocumentId(documentId: string): Promise<void> {
  const sheet = await getSheet(SHEET_NAMES.AUDIO_OUTPUTS);
  const rows = await sheet.getRows();

  const row = rows.find((r) => r.get('document_id') === documentId);
  if (!row) {
    throw new Error(`Audio output for document ${documentId} not found`);
  }

  await row.delete();
}
