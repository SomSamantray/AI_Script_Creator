# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Script Maker converts product newsletter text into professional audio narrations using a background job processing pipeline.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, shadcn/ui, BullMQ, Google Sheets (DB), Google Drive (storage), OpenAI GPT-4o mini, ElevenLabs TTS, FFmpeg

## Architecture

### System Flow
```
User Input → Next.js API → BullMQ (Redis) → Workers → Google Drive → Audio Player
```

### Processing Pipeline (3 Background Workers)

1. **Content Worker** (`/workers/content-worker.ts`)
   - Extracts text from DOCX (via Google Drive download + mammoth library) or retrieves pasted text
   - Chunks content by section type: Planned Releases, Tech Releases, Bugs & Fixes
   - Saves chunks to Google Sheets
   - Updates progress: 0% → 30%

2. **Script Worker** (`/workers/script-worker.ts`)
   - Fetches chunks from Google Sheets
   - Sends to OpenAI GPT-4o mini to convert newsletter → narrative script
   - Saves script to AudioOutputs sheet
   - Updates progress: 30% → 60%

3. **Audio Worker** (`/workers/audio-worker.ts`)
   - Splits script into 5000-char chunks (ElevenLabs limit)
   - Generates audio chunks with **request stitching** (`previousRequestIds`) for voice consistency
   - Uses FFmpeg to concatenate chunks into final MP3
   - Uploads to Google Drive, generates shareable link
   - Updates progress: 60% → 100%

### Database: Google Sheets

**3 Sheets (tabs) in a single spreadsheet:**

1. **Documents** - Main records (id, title, input_type, content, file_url, status, progress_percentage, current_step, error_message, created_at, updated_at)
2. **Chunks** - Content sections (id, document_id, section_type, heading, content, chunk_order, created_at)
3. **AudioOutputs** - Final results (id, document_id, script_text, audio_url, duration_seconds, file_size_bytes, created_at)

Access via Google Sheets API using Service Account authentication.

### Real-Time Progress

**Server-Sent Events (SSE) with polling:**
- No native real-time from Google Sheets
- SSE endpoint polls Sheets every 2 seconds for status updates
- Frontend subscribes via `EventSource`
- Connection closes on `complete` or `error` status

## Development Commands

### Project Setup
```bash
# Install dependencies (will be created during init)
npm install

# Set up environment variables
# Copy .env.local.example → .env.local (if template exists)
# Or ensure .env.local has all required variables (see below)

# Run development server
npm run dev

# Run workers (separate terminal)
npm run workers
```

### Workers
```bash
# Development mode (auto-reload)
npm run workers:dev

# Production
npm run workers
```

### Build & Deploy
```bash
# Build Next.js
npm run build

# Start production server
npm start

# Deploy to Vercel (frontend + API routes)
vercel deploy

# Deploy workers to Railway
# Push to GitHub, Railway auto-deploys from repo
```

## Environment Variables Required

```bash
GOOGLE_SPREADSHEET_ID=<from Google Sheets URL>
GOOGLE_DRIVE_FOLDER_ID=<from Google Drive folder URL>
GOOGLE_SERVICE_ACCOUNT_EMAIL=<from service account JSON>
GOOGLE_PRIVATE_KEY=<from service account JSON, keep \n characters>
REDIS_URL=rediss://...
OPENAI_API_KEY=sk-proj-...
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_VOICE_ID=<from ElevenLabs voice library>
```

## Key Implementation Details

### Google API Integration
- **Service Account authentication** (not OAuth) - single account shared across app
- Sheets: Read/write rows using A1 notation (`Documents!A2:K`)
- Drive: Upload files to folder, generate shareable links with `webContentLink`
- **Rate Limits:** 60 requests/min per user - use batching for writes

### BullMQ Queue System
- 3 queues: `document-processing`, `script-generation`, `audio-generation`
- Workers run as separate Node.js processes
- Redis connection via Upstash (serverless-compatible)
- Retry logic: 3 attempts with exponential backoff
- Concurrency: 3 jobs per worker by default

### ElevenLabs Request Stitching
- **Critical for voice consistency:** Pass `previousRequestIds` to each chunk
- Store `requestId` from each API response
- Use in next chunk's `previousRequestIds` array
- Set `nextTextRequested: true` for all chunks except the last

### FFmpeg Audio Stitching
- Create file list: `file '/path/to/chunk_0.mp3'\nfile '/path/to/chunk_1.mp3'`
- Command: `ffmpeg -f concat -safe 0 -i filelist.txt -c copy output.mp3`
- Use `fluent-ffmpeg` wrapper with `ffmpeg-static` for portability
- Cleanup temp files after upload to Drive

### Progress Tracking Pattern
```typescript
// Update status in Google Sheets
await updateDocument(documentId, {
  status: 'generating_script',
  progress_percentage: 60,
  current_step: 'Generating narrative script'
});

// SSE endpoint polls this and streams to frontend
```

### Error Handling
- Workers: Try-catch with status update to `error` + `error_message` in Sheets
- BullMQ: 3 automatic retries with exponential backoff
- Frontend: Display user-friendly messages from `error_message` field

## Critical File Locations

### Frontend (Next.js App Router)
- `/app/page.tsx` - Landing page with text paste / DOCX upload tabs
- `/app/processing/[documentId]/page.tsx` - Progress screen with SSE
- `/app/components/AudioPlayer.tsx` - Custom audio player

### API Routes
- `/app/api/submit/route.ts` - Creates Sheets record, queues BullMQ job
- `/app/api/progress/[documentId]/route.ts` - SSE endpoint (polls Sheets)

### Workers (Separate Process)
- `/workers/index.ts` - Entry point that imports all workers
- `/workers/content-worker.ts`
- `/workers/script-worker.ts`
- `/workers/audio-worker.ts`

### Libraries
- `/lib/google-sheets/client.ts` - Sheets API wrapper (google-spreadsheet library)
- `/lib/google-drive/client.ts` - Drive API wrapper (googleapis library)
- `/lib/queue/config.ts` - BullMQ + Redis setup
- `/lib/db/documents.ts` - CRUD operations for Documents sheet
- `/lib/db/chunks.ts` - Operations for Chunks sheet
- `/lib/audio/script-generator.ts` - OpenAI prompt builder
- `/lib/audio/elevenlabs-client.ts` - ElevenLabs API wrapper
- `/lib/audio/ffmpeg-stitcher.ts` - FFmpeg concatenation logic

## Dependencies to Install

**Core:**
- `next`, `react`, `typescript`
- `@radix-ui/*`, `tailwindcss`, `shadcn/ui` components

**Queue & Workers:**
- `bullmq`, `ioredis`

**Google APIs:**
- `google-spreadsheet`, `googleapis`

**AI & Audio:**
- `openai`, `elevenlabs` (or direct HTTP calls)
- `fluent-ffmpeg`, `ffmpeg-static`
- `mammoth` (DOCX text extraction)

**Utils:**
- `uuid` (generate document IDs)
- `zod` (validation)

## Common Gotchas

1. **Google Private Key:** Must be in `.env.local` with quotes and actual `\n` characters preserved (not interpreted as newlines)

2. **Workers Must Run Separately:** In dev, run `npm run workers` in separate terminal from `npm run dev`

3. **Sheet Column Order Matters:** First row is headers. Data starts row 2. Maintain column order in schema

4. **Redis URL Format:** Must be `rediss://` (with SSL) for Upstash, not `https://` REST endpoint

5. **ElevenLabs Character Limit:** 5000 chars per request. Must chunk script. Use request stitching!

6. **FFmpeg Not in Node:** Install `ffmpeg-static` for embedded binary, or ensure system FFmpeg available

7. **Large Documents:** 70-page DOCX can take 10-15 minutes to process. Progress updates every 2 seconds keep user informed

8. **Polling Overhead:** SSE polls every 2 seconds. Acceptable for <10 concurrent users. Scale with proper real-time DB if needed

## Development Workflow

1. Start Next.js: `npm run dev`
2. Start workers: `npm run workers:dev` (separate terminal)
3. Submit text/DOCX via frontend
4. Monitor worker logs for job processing
5. Check Google Sheets for data updates
6. View progress updates in browser (SSE)
7. Listen to final audio in player

## Testing Strategy

- **Unit:** Test individual functions (chunking logic, prompt builder)
- **Integration:** Test Google API wrappers with real credentials (staging sheet)
- **E2E:** Full flow from submit → audio download (use small test documents)
- **Worker:** Test each worker independently by manually queueing jobs

## Performance Targets

- Processing: <15 minutes for 70-page document
- Error rate: <5%
- Audio quality: Professional narrator voice, smooth transitions between chunks
