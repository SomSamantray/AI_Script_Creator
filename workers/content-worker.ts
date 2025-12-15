import { Worker, Job } from 'bullmq';
import { DocumentProcessingJob, DocumentProcessingResult } from '../lib/queue/jobs';
import { QUEUE_NAMES, getScriptGenerationQueue, getConnection } from '../lib/queue/config';
import { getDocument, updateDocument } from '../lib/db/documents';
import { createChunksBatch } from '../lib/db/chunks';
import { downloadFile } from '../lib/google-drive/client';
import { chunkText } from '../lib/parsers/chunking';
import mammoth from 'mammoth';

// Process document: extract text and chunk content
async function processDocument(
  job: Job<DocumentProcessingJob>
): Promise<DocumentProcessingResult> {
  const { documentId } = job.data;

  try {
    console.log(`[Content Worker] Processing document: ${documentId}`);

    // Update status
    await updateDocument(documentId, {
      status: 'organizing',
      progress_percentage: 5,
      current_step: 'Extracting content...',
    });

    // Get document from database
    const document = await getDocument(documentId);
    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    let textContent = '';

    // Extract text based on input type
    if (document.input_type === 'docx') {
      console.log(`[Content Worker] Downloading DOCX file from Drive...`);

      // Extract file ID from Google Drive URL
      const fileIdMatch = document.file_url?.match(/[-\w]{25,}/);
      if (!fileIdMatch) {
        throw new Error('Invalid Google Drive file URL');
      }
      const fileId = fileIdMatch[0];

      // Download file from Google Drive
      const fileBuffer = await downloadFile(fileId);

      // Extract text using mammoth
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      textContent = result.value;

      console.log(`[Content Worker] Extracted ${textContent.length} characters from DOCX`);
    } else {
      // Use pasted text content
      textContent = document.content || '';
      console.log(`[Content Worker] Using pasted text (${textContent.length} characters)`);
    }

    if (!textContent.trim()) {
      throw new Error('No text content found in document');
    }

    // Update progress
    await updateDocument(documentId, {
      progress_percentage: 15,
      current_step: 'Chunking content into sections...',
    });

    // Chunk the text
    const parsedChunks = chunkText(textContent);
    console.log(`[Content Worker] Created ${parsedChunks.length} chunks`);

    // Save chunks to database
    const chunksToSave = parsedChunks.map((chunk) => ({
      document_id: documentId,
      section_type: chunk.section_type,
      heading: chunk.heading,
      content: chunk.content,
      chunk_order: chunk.chunk_order,
    }));

    await createChunksBatch(chunksToSave);

    // Update progress
    await updateDocument(documentId, {
      progress_percentage: 30,
      current_step: 'Content organized into sections',
    });

    // Queue script generation job
    await getScriptGenerationQueue().add('generate-script', { documentId });

    console.log(`[Content Worker] Document ${documentId} processed successfully`);

    return {
      documentId,
      chunkCount: parsedChunks.length,
      success: true,
    };
  } catch (error) {
    console.error(`[Content Worker] Error processing document ${documentId}:`, error);

    // Update document with error
    await updateDocument(documentId, {
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Failed to process document',
    });

    return {
      documentId,
      chunkCount: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Create worker
export const contentWorker = new Worker<DocumentProcessingJob, DocumentProcessingResult>(
  QUEUE_NAMES.DOCUMENT_PROCESSING,
  processDocument,
  {
    connection: getConnection(),
    concurrency: 3, // Process 3 documents concurrently
  }
);

contentWorker.on('completed', (job) => {
  console.log(`[Content Worker] Job ${job.id} completed`);
});

contentWorker.on('failed', (job, err) => {
  console.error(`[Content Worker] Job ${job?.id} failed:`, err);
});

console.log('[Content Worker] Started and listening for jobs...');
