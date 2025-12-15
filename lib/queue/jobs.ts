// Job data interfaces for each queue

// Document processing job (Step 1: Extract text and chunk content)
export interface DocumentProcessingJob {
  documentId: string;
}

// Script generation job (Step 2: Generate narrative script from chunks)
export interface ScriptGenerationJob {
  documentId: string;
}

// Audio generation job (Step 3: Generate and stitch audio)
export interface AudioGenerationJob {
  documentId: string;
}

// Job priorities
export enum JobPriority {
  LOW = 1,
  NORMAL = 5,
  HIGH = 10,
  CRITICAL = 20,
}

// Job result interfaces
export interface DocumentProcessingResult {
  documentId: string;
  chunkCount: number;
  success: boolean;
  error?: string;
}

export interface ScriptGenerationResult {
  documentId: string;
  scriptLength: number;
  success: boolean;
  error?: string;
}

export interface AudioGenerationResult {
  documentId: string;
  audioUrl: string;
  durationSeconds: number;
  fileSizeBytes: number;
  success: boolean;
  error?: string;
}
