import { Worker, Job } from 'bullmq';
import { AudioGenerationJob, AudioGenerationResult } from '../lib/queue/jobs';
import { QUEUE_NAMES, getConnection } from '../lib/queue/config';
import { getDocument, updateDocument } from '../lib/db/documents';
import { getAudioOutputByDocumentId, updateAudioOutput } from '../lib/db/audio-outputs';
import { generateAllAudioChunks } from '../lib/audio/elevenlabs-client';
import { stitchAudioFiles, getAudioDuration, getAudioFileSize } from '../lib/audio/ffmpeg-stitcher';
import { mkdir, rm, copyFile } from 'fs/promises';
import { join } from 'path';

// Generate and stitch audio
async function generateAudio(
  job: Job<AudioGenerationJob>
): Promise<AudioGenerationResult> {
  const { documentId } = job.data;
  const tempDir = join(process.cwd(), 'temp', documentId);

  try {
    console.log(`[Audio Worker] Generating audio for document: ${documentId}`);

    // Create temp directory
    await mkdir(tempDir, { recursive: true });

    // Update status
    await updateDocument(documentId, {
      status: 'generating_audio',
      progress_percentage: 65,
      current_step: 'Converting script to audio...',
    });

    // Get document
    const document = await getDocument(documentId);
    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    // Get audio output (contains script)
    const audioOutput = await getAudioOutputByDocumentId(documentId);
    if (!audioOutput || !audioOutput.script_text) {
      throw new Error('No script found for document');
    }

    const script = audioOutput.script_text;
    console.log(`[Audio Worker] Script length: ${script.length} characters`);

    // Generate audio chunks with progress tracking
    const audioFilePaths = await generateAllAudioChunks(
      script,
      tempDir,
      (current, total) => {
        const progress = 65 + Math.floor((current / total) * 25); // 65% to 90%
        updateDocument(documentId, {
          progress_percentage: progress,
          current_step: `Generating audio chunk ${current}/${total}...`,
        });
      }
    );

    // Update status
    await updateDocument(documentId, {
      status: 'stitching',
      progress_percentage: 90,
      current_step: 'Stitching audio chunks...',
    });

    // Stitch audio files
    const finalAudioPath = join(tempDir, 'final.mp3');
    await stitchAudioFiles(audioFilePaths, finalAudioPath);

    console.log(`[Audio Worker] Audio stitched successfully`);

    // Get audio metadata
    const duration = await getAudioDuration(finalAudioPath);
    const fileSize = await getAudioFileSize(finalAudioPath);

    console.log(`[Audio Worker] Duration: ${duration}s, Size: ${fileSize} bytes`);

    // Move to persistent temp directory
    console.log('[Audio Worker] Saving audio to temp storage...');
    await updateDocument(documentId, {
      progress_percentage: 95,
      current_step: 'Saving audio file...',
    });

    const persistentTempDir = join(process.cwd(), 'temp-audio', documentId);
    await mkdir(persistentTempDir, { recursive: true });

    const persistentAudioPath = join(persistentTempDir, 'final.mp3');
    await copyFile(finalAudioPath, persistentAudioPath);

    console.log(`[Audio Worker] Audio saved to: ${persistentAudioPath}`);

    // Store local API endpoint URL instead of Google Drive URL
    const audioUrl = `/api/audio/${documentId}/download`;

    // Update audio output record
    await updateAudioOutput(documentId, {
      audio_url: audioUrl,
      duration_seconds: duration,
      file_size_bytes: fileSize,
    });

    // Update document to complete
    await updateDocument(documentId, {
      status: 'complete',
      progress_percentage: 100,
      current_step: 'Audio generation complete!',
    });

    // Cleanup temp files (processing directory only, keep persistent copy)
    await rm(tempDir, { recursive: true, force: true });
    console.log('[Audio Worker] Temporary processing files cleaned up');
    console.log(`[Audio Worker] Persistent audio file kept at: ${persistentAudioPath}`);

    console.log(`[Audio Worker] Audio for ${documentId} generated successfully`);

    return {
      documentId,
      audioUrl,
      durationSeconds: duration,
      fileSizeBytes: fileSize,
      success: true,
    };
  } catch (error) {
    console.error(`[Audio Worker] Error generating audio for ${documentId}:`, error);

    // Update document with error
    await updateDocument(documentId, {
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Failed to generate audio',
    });

    // Cleanup temp files
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});

    return {
      documentId,
      audioUrl: '',
      durationSeconds: 0,
      fileSizeBytes: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Create worker
export const audioWorker = new Worker<AudioGenerationJob, AudioGenerationResult>(
  QUEUE_NAMES.AUDIO_GENERATION,
  generateAudio,
  {
    connection: getConnection(),
    concurrency: 2, // Limit concurrency for resource-intensive audio generation
  }
);

audioWorker.on('completed', (job) => {
  console.log(`[Audio Worker] Job ${job.id} completed`);
});

audioWorker.on('failed', (job, err) => {
  console.error(`[Audio Worker] Job ${job?.id} failed:`, err);
});

console.log('[Audio Worker] Started and listening for jobs...');
