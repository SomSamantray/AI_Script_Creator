import { Worker, Job } from 'bullmq';
import { ScriptGenerationJob, ScriptGenerationResult } from '../lib/queue/jobs';
import { QUEUE_NAMES, getAudioGenerationQueue, getConnection } from '../lib/queue/config';
import { getDocument, updateDocument } from '../lib/db/documents';
import { getChunksByDocumentId } from '../lib/db/chunks';
import { createAudioOutput } from '../lib/db/audio-outputs';
import { generateScript } from '../lib/audio/script-generator';

// Generate script from chunks
async function generateScriptFromChunks(
  job: Job<ScriptGenerationJob>
): Promise<ScriptGenerationResult> {
  const { documentId } = job.data;

  try {
    console.log(`[Script Worker] Generating script for document: ${documentId}`);

    // Update status
    await updateDocument(documentId, {
      status: 'generating_script',
      progress_percentage: 40,
      current_step: 'Generating narrative script...',
    });

    // Get document
    const document = await getDocument(documentId);
    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    // Get chunks
    const chunks = await getChunksByDocumentId(documentId);
    if (chunks.length === 0) {
      throw new Error('No chunks found for document');
    }

    console.log(`[Script Worker] Found ${chunks.length} chunks`);

    // Generate script using OpenAI
    console.log(`[Script Worker] Calling OpenAI GPT-4o mini...`);
    const script = await generateScript(chunks);

    console.log(`[Script Worker] Generated script (${script.length} characters)`);

    // Update progress
    await updateDocument(documentId, {
      progress_percentage: 60,
      current_step: 'Script generated successfully',
    });

    // Save script to AudioOutputs sheet (without audio_url yet)
    await createAudioOutput({
      document_id: documentId,
      script_text: script,
      audio_url: '', // Will be filled by audio worker
      duration_seconds: 0,
      file_size_bytes: 0,
    });

    // Queue audio generation job
    await getAudioGenerationQueue().add('generate-audio', { documentId });

    console.log(`[Script Worker] Script for ${documentId} generated successfully`);

    return {
      documentId,
      scriptLength: script.length,
      success: true,
    };
  } catch (error) {
    console.error(`[Script Worker] Error generating script for ${documentId}:`, error);

    // Update document with error
    await updateDocument(documentId, {
      status: 'error',
      error_message:
        error instanceof Error ? error.message : 'Failed to generate script',
    });

    return {
      documentId,
      scriptLength: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Create worker
export const scriptWorker = new Worker<ScriptGenerationJob, ScriptGenerationResult>(
  QUEUE_NAMES.SCRIPT_GENERATION,
  generateScriptFromChunks,
  {
    connection: getConnection(),
    concurrency: 3,
  }
);

scriptWorker.on('completed', (job) => {
  console.log(`[Script Worker] Job ${job.id} completed`);
});

scriptWorker.on('failed', (job, err) => {
  console.error(`[Script Worker] Job ${job?.id} failed:`, err);
});

console.log('[Script Worker] Started and listening for jobs...');
