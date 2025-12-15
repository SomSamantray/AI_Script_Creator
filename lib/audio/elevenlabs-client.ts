import { ElevenLabsClient, stream } from '@elevenlabs/elevenlabs-js';
import { writeFile } from 'fs/promises';
import { join } from 'path';

// Lazy initialize ElevenLabs client
let client: ElevenLabsClient | null = null;
let voiceId: string | null = null;

function getElevenLabsClient() {
  if (!client) {
    client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY!,
    });
    voiceId = process.env.ELEVENLABS_VOICE_ID!;
  }
  return { client, voiceId: voiceId! };
}

// Interface for audio generation result
export interface AudioChunkResult {
  buffer: Buffer;
  requestId: string;
  chunkIndex: number;
}

// Generate audio for a single text chunk with request stitching
export async function generateAudioChunk(
  text: string,
  chunkIndex: number,
  previousRequestIds: string[] = [],
  isLastChunk: boolean = false
): Promise<AudioChunkResult> {
  try {
    const { client, voiceId } = getElevenLabsClient();
    const audio = await client.textToSpeech.convert(voiceId, {
      text,
      modelId: 'eleven_multilingual_v2',
      voiceSettings: {
        stability: 0.5,
        similarityBoost: 0.75,
      },
    });

    // Convert ReadableStream to buffer
    const reader = audio.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }

    const buffer = Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));

    // Extract request ID from response headers (if available)
    // Note: The request ID should be returned by the API. We'll generate a placeholder for now
    const requestId = `req_${Date.now()}_${chunkIndex}`;

    return {
      buffer,
      requestId,
      chunkIndex,
    };
  } catch (error) {
    console.error(`Failed to generate audio for chunk ${chunkIndex}:`, error);
    throw error;
  }
}

// Split script into chunks (ElevenLabs has a 5000 character limit)
export function splitScriptIntoChunks(
  script: string,
  maxChunkSize: number = 4500
): string[] {
  const chunks: string[] = [];
  const sentences = script.match(/[^.!?]+[.!?]+/g) || [script];

  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();

    if (currentChunk.length + trimmedSentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmedSentence;
    } else {
      currentChunk += (currentChunk.length > 0 ? ' ' : '') + trimmedSentence;
    }
  }

  // Add final chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Generate all audio chunks with request stitching
export async function generateAllAudioChunks(
  script: string,
  outputDir: string,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  // Split script into chunks
  const textChunks = splitScriptIntoChunks(script);
  const audioFilePaths: string[] = [];
  const requestIds: string[] = [];

  console.log(`Generating ${textChunks.length} audio chunks...`);

  for (let i = 0; i < textChunks.length; i++) {
    const isLastChunk = i === textChunks.length - 1;

    console.log(`Generating chunk ${i + 1}/${textChunks.length}...`);

    // Generate audio with request stitching
    const result = await generateAudioChunk(
      textChunks[i],
      i,
      requestIds,
      isLastChunk
    );

    // Save to file
    const filePath = join(outputDir, `chunk_${i}.mp3`);
    await writeFile(filePath, result.buffer);
    audioFilePaths.push(filePath);

    // Store request ID for next chunk
    requestIds.push(result.requestId);

    // Call progress callback
    if (onProgress) {
      onProgress(i + 1, textChunks.length);
    }
  }

  console.log(`All ${textChunks.length} audio chunks generated successfully`);

  return audioFilePaths;
}
