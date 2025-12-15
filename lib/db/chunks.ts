import { getSheet, SHEET_NAMES } from '../google-sheets/client';
import { v4 as uuidv4 } from 'uuid';

// Chunk section types
export type SectionType =
  | 'planned_releases'
  | 'tech_releases'
  | 'bugs_fixes'
  | 'other';

// Chunk interface
export interface Chunk {
  id: string;
  document_id: string;
  section_type: SectionType;
  heading: string;
  content: string;
  chunk_order: number;
  created_at: string;
}

// Create a new chunk
export async function createChunk(data: {
  document_id: string;
  section_type: SectionType;
  heading: string;
  content: string;
  chunk_order: number;
}): Promise<Chunk> {
  const sheet = await getSheet(SHEET_NAMES.CHUNKS);

  const chunk: Chunk = {
    id: uuidv4(),
    document_id: data.document_id,
    section_type: data.section_type,
    heading: data.heading,
    content: data.content,
    chunk_order: data.chunk_order,
    created_at: new Date().toISOString(),
  };

  // Add row to sheet
  await sheet.addRow([
    chunk.id,
    chunk.document_id,
    chunk.section_type,
    chunk.heading,
    chunk.content,
    chunk.chunk_order,
    chunk.created_at,
  ]);

  return chunk;
}

// Get all chunks for a document
export async function getChunksByDocumentId(documentId: string): Promise<Chunk[]> {
  const sheet = await getSheet(SHEET_NAMES.CHUNKS);
  const rows = await sheet.getRows();

  const chunks = rows
    .filter((row) => row.get('document_id') === documentId)
    .map((row) => ({
      id: row.get('id'),
      document_id: row.get('document_id'),
      section_type: row.get('section_type') as SectionType,
      heading: row.get('heading'),
      content: row.get('content'),
      chunk_order: parseInt(row.get('chunk_order'), 10),
      created_at: row.get('created_at'),
    }));

  // Sort by chunk_order
  return chunks.sort((a, b) => a.chunk_order - b.chunk_order);
}

// Create multiple chunks in batch
export async function createChunksBatch(chunks: Omit<Chunk, 'id' | 'created_at'>[]): Promise<void> {
  const sheet = await getSheet(SHEET_NAMES.CHUNKS);

  const rows = chunks.map((chunk) => [
    uuidv4(),
    chunk.document_id,
    chunk.section_type,
    chunk.heading,
    chunk.content,
    chunk.chunk_order,
    new Date().toISOString(),
  ]);

  await sheet.addRows(rows);
}

// Delete all chunks for a document
export async function deleteChunksByDocumentId(documentId: string): Promise<void> {
  const sheet = await getSheet(SHEET_NAMES.CHUNKS);
  const rows = await sheet.getRows();

  const chunksToDelete = rows.filter((row) => row.get('document_id') === documentId);

  // Delete all matching rows
  await Promise.all(chunksToDelete.map((row) => row.delete()));
}

// Get chunk count for a document
export async function getChunkCount(documentId: string): Promise<number> {
  const chunks = await getChunksByDocumentId(documentId);
  return chunks.length;
}
