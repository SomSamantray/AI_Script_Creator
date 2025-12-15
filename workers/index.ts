// Worker entry point - imports and starts all workers
import dotenv from 'dotenv';
import { resolve } from 'path';
import { cleanupOldAudioFiles } from '../lib/cleanup/audio-cleanup.js';

// Load environment variables from .env.local FIRST
const envPath = resolve(process.cwd(), '.env.local');
console.log(`[Workers] Loading .env from: ${envPath}`);
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('[Workers] Error loading .env.local:', result.error);
} else {
  console.log('[Workers] Environment variables loaded successfully');
  console.log('[Workers] REDIS_URL:', process.env.REDIS_URL?.substring(0, 30) + '...');
}

// Use dynamic imports to load workers AFTER environment is ready
async function startWorkers() {
  console.log('='.repeat(60));
  console.log('AI Script Maker - Background Workers');
  console.log('='.repeat(60));

  await import('./content-worker.js');
  await import('./script-worker.js');
  await import('./audio-worker.js');

  console.log('All workers started successfully!');
  console.log('Listening for jobs on the following queues:');
  console.log('  - document-processing (Content Worker)');
  console.log('  - script-generation (Script Worker)');
  console.log('  - audio-generation (Audio Worker)');
  console.log('='.repeat(60));

  // Run initial cleanup
  console.log('[Workers] Running initial audio cleanup...');
  await cleanupOldAudioFiles(24);

  // Schedule cleanup to run every hour
  setInterval(async () => {
    console.log('[Workers] Running scheduled audio cleanup...');
    await cleanupOldAudioFiles(24);
  }, 60 * 60 * 1000); // Run every hour

  console.log('[Workers] Audio cleanup scheduled (runs every hour)');
}

startWorkers().catch(console.error);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});
