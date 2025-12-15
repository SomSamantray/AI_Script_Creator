import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';

// Set ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

// Stitch multiple audio files into one using FFmpeg
export async function stitchAudioFiles(
  audioFilePaths: string[],
  outputPath: string
): Promise<void> {
  if (audioFilePaths.length === 0) {
    throw new Error('No audio files to stitch');
  }

  if (audioFilePaths.length === 1) {
    // If only one file, just copy it
    const fs = await import('fs/promises');
    await fs.copyFile(audioFilePaths[0], outputPath);
    return;
  }

  return new Promise((resolve, reject) => {
    // Create file list for FFmpeg concat
    const fileListContent = audioFilePaths
      .map((path) => `file '${path}'`)
      .join('\n');

    const fileListPath = join(process.cwd(), 'temp', 'filelist.txt');

    // Write file list
    writeFile(fileListPath, fileListContent)
      .then(() => {
        // Run FFmpeg concat
        ffmpeg()
          .input(fileListPath)
          .inputOptions(['-f', 'concat', '-safe', '0'])
          .outputOptions(['-c', 'copy']) // Copy codec (no re-encoding)
          .output(outputPath)
          .on('start', (commandLine) => {
            console.log('[FFmpeg] Spawned: ' + commandLine);
          })
          .on('progress', (progress) => {
            if (progress.percent) {
              console.log(`[FFmpeg] Processing: ${Math.round(progress.percent)}% done`);
            }
          })
          .on('end', async () => {
            console.log('[FFmpeg] Stitching complete');
            // Clean up file list
            await unlink(fileListPath).catch(() => {});
            resolve();
          })
          .on('error', async (err) => {
            console.error('[FFmpeg] Error:', err);
            // Clean up file list
            await unlink(fileListPath).catch(() => {});
            reject(err);
          })
          .run();
      })
      .catch(reject);
  });
}

// Get audio duration in seconds
export async function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const duration = metadata.format.duration || 0;
      resolve(duration);
    });
  });
}

// Get audio file size in bytes
export async function getAudioFileSize(filePath: string): Promise<number> {
  const fs = await import('fs/promises');
  const stats = await fs.stat(filePath);
  return stats.size;
}
