import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

// Queue names
export const QUEUE_NAMES = {
  DOCUMENT_PROCESSING: 'document-processing',
  SCRIPT_GENERATION: 'script-generation',
  AUDIO_GENERATION: 'audio-generation',
} as const;

// Lazy initialization for Redis connection and queues
let connection: Redis | null = null;
let documentProcessingQueue: Queue | null = null;
let scriptGenerationQueue: Queue | null = null;
let audioGenerationQueue: Queue | null = null;
let documentProcessingEvents: QueueEvents | null = null;
let scriptGenerationEvents: QueueEvents | null = null;
let audioGenerationEvents: QueueEvents | null = null;

function getConnection(): Redis {
  if (!connection) {
    console.log('[Queue] Creating Redis connection to:', process.env.REDIS_URL?.substring(0, 30) + '...');
    connection = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: null,
    });
  }
  return connection;
}

// Export for use in workers
export { getConnection };

// Queue configurations with default options
function getDefaultQueueOptions() {
  return {
    connection: getConnection(),
    defaultJobOptions: {
      attempts: 3, // Retry up to 3 times
      backoff: {
        type: 'exponential' as const,
        delay: 2000, // Start with 2 second delay
      },
      removeOnComplete: {
        age: 24 * 3600, // Keep completed jobs for 24 hours
        count: 100, // Keep last 100 completed jobs
      },
      removeOnFail: {
        age: 7 * 24 * 3600, // Keep failed jobs for 7 days
      },
    },
  };
}

// Getter functions for lazy initialization
export function getDocumentProcessingQueue(): Queue {
  if (!documentProcessingQueue) {
    documentProcessingQueue = new Queue(
      QUEUE_NAMES.DOCUMENT_PROCESSING,
      getDefaultQueueOptions()
    );
  }
  return documentProcessingQueue;
}

export function getScriptGenerationQueue(): Queue {
  if (!scriptGenerationQueue) {
    scriptGenerationQueue = new Queue(
      QUEUE_NAMES.SCRIPT_GENERATION,
      getDefaultQueueOptions()
    );
  }
  return scriptGenerationQueue;
}

export function getAudioGenerationQueue(): Queue {
  if (!audioGenerationQueue) {
    audioGenerationQueue = new Queue(
      QUEUE_NAMES.AUDIO_GENERATION,
      getDefaultQueueOptions()
    );
  }
  return audioGenerationQueue;
}

// Queue events for monitoring (optional but useful)
export function getDocumentProcessingEvents(): QueueEvents {
  if (!documentProcessingEvents) {
    documentProcessingEvents = new QueueEvents(
      QUEUE_NAMES.DOCUMENT_PROCESSING,
      { connection: getConnection() }
    );
  }
  return documentProcessingEvents;
}

export function getScriptGenerationEvents(): QueueEvents {
  if (!scriptGenerationEvents) {
    scriptGenerationEvents = new QueueEvents(
      QUEUE_NAMES.SCRIPT_GENERATION,
      { connection: getConnection() }
    );
  }
  return scriptGenerationEvents;
}

export function getAudioGenerationEvents(): QueueEvents {
  if (!audioGenerationEvents) {
    audioGenerationEvents = new QueueEvents(
      QUEUE_NAMES.AUDIO_GENERATION,
      { connection: getConnection() }
    );
  }
  return audioGenerationEvents;
}

// Helper to close all connections gracefully
export async function closeQueues() {
  if (documentProcessingQueue) await documentProcessingQueue.close();
  if (scriptGenerationQueue) await scriptGenerationQueue.close();
  if (audioGenerationQueue) await audioGenerationQueue.close();
  if (documentProcessingEvents) await documentProcessingEvents.close();
  if (scriptGenerationEvents) await scriptGenerationEvents.close();
  if (audioGenerationEvents) await audioGenerationEvents.close();
  if (connection) await connection.quit();
}

// Setup queue event listeners (call this after initialization)
export function setupQueueEventListeners() {
  if (process.env.NODE_ENV === 'development') {
    const docEvents = getDocumentProcessingEvents();
    const scriptEvents = getScriptGenerationEvents();
    const audioEvents = getAudioGenerationEvents();

    docEvents.on('completed', ({ jobId }) => {
      console.log(`[Queue] Document processing job ${jobId} completed`);
    });

    scriptEvents.on('completed', ({ jobId }) => {
      console.log(`[Queue] Script generation job ${jobId} completed`);
    });

    audioEvents.on('completed', ({ jobId }) => {
      console.log(`[Queue] Audio generation job ${jobId} completed`);
    });

    docEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`[Queue] Document processing job ${jobId} failed:`, failedReason);
    });

    scriptEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`[Queue] Script generation job ${jobId} failed:`, failedReason);
    });

    audioEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`[Queue] Audio generation job ${jobId} failed:`, failedReason);
    });
  }
}
