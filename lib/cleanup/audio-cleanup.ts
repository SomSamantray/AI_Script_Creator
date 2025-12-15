import { readdir, stat, rm } from 'fs/promises';
import { join } from 'path';

export async function cleanupOldAudioFiles(maxAgeHours: number = 24) {
  const audioDir = join(process.cwd(), 'temp-audio');
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  const now = Date.now();

  try {
    const documentIds = await readdir(audioDir);

    for (const documentId of documentIds) {
      const documentDir = join(audioDir, documentId);
      const audioFile = join(documentDir, 'final.mp3');

      try {
        const fileStat = await stat(audioFile);
        const fileAge = now - fileStat.mtimeMs;

        if (fileAge > maxAgeMs) {
          await rm(documentDir, { recursive: true, force: true });
          console.log(`[Cleanup] Deleted old audio: ${documentId} (age: ${Math.floor(fileAge / 1000 / 60 / 60)}h)`);
        }
      } catch (error) {
        // File doesn't exist or can't be accessed, skip
      }
    }

    console.log('[Cleanup] Audio cleanup completed');
  } catch (error) {
    // Directory doesn't exist yet, skip
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('[Cleanup] Error during cleanup:', error);
    }
  }
}
