# AI Script Maker - Implementation Checklist

## Phase 1: Setup & Configuration ⚙️

- [ ] Create Next.js 14+ project with TypeScript
- [ ] Install dependencies (shadcn/ui, Tailwind, BullMQ, etc.)
- [ ] Configure shadcn/ui components
- [ ] Set up Google Cloud Project
  - [ ] Enable Google Sheets API
  - [ ] Enable Google Drive API
  - [ ] Create Service Account
  - [ ] Download JSON credentials
- [ ] Create Google Spreadsheet with 3 sheets (Documents, Chunks, AudioOutputs)
- [ ] Create Google Drive folder and share with service account
- [ ] Set up Upstash Redis instance
- [ ] Configure environment variables

---

## Phase 2: Google API Integration 🔗

- [ ] Create Google Sheets client library (`/lib/google-sheets/client.ts`)
- [ ] Create Google Drive client library (`/lib/google-drive/client.ts`)
- [ ] Implement document CRUD operations (`/lib/db/documents.ts`)
- [ ] Implement chunks operations (`/lib/db/chunks.ts`)
- [ ] Implement audio outputs operations (`/lib/db/audio-outputs.ts`)
- [ ] Create Drive storage helpers (`/lib/storage/drive-storage.ts`)
- [ ] Test connection to Google Sheets
- [ ] Test file upload to Google Drive

---

## Phase 3: Frontend Development 🎨

### Landing Page
- [ ] Create landing page (`/app/page.tsx`)
- [ ] Build tab switcher component (Paste Text / Upload DOCX)
- [ ] Implement text paste textarea with character counter
- [ ] Implement DOCX file upload zone (drag-and-drop)
- [ ] Add file validation (DOCX only, size limits)
- [ ] Create "Create Audio Script" button with loading states

### Processing Screen
- [ ] Create processing page (`/app/processing/[documentId]/page.tsx`)
- [ ] Build progress bar component
- [ ] Add milestone indicators (4 stages)
- [ ] Implement Server-Sent Events connection
- [ ] Add real-time status updates

### Complete Screen
- [ ] Build audio player component (`/app/components/AudioPlayer.tsx`)
- [ ] Add play/pause, seek, volume controls
- [ ] Implement download button
- [ ] Add "View Script" modal
- [ ] Create "Process Another" button

---

## Phase 4: Backend API Routes 🛤️

- [ ] Create submit endpoint (`/app/api/submit/route.ts`)
  - [ ] Handle text paste submissions
  - [ ] Handle DOCX file uploads to Google Drive
  - [ ] Create document record in Google Sheets
  - [ ] Queue job in BullMQ
  - [ ] Return documentId
- [ ] Create progress SSE endpoint (`/app/api/progress/[documentId]/route.ts`)
  - [ ] Poll Google Sheets every 2 seconds
  - [ ] Stream status updates via SSE
  - [ ] Close connection on complete/error
- [ ] Create status REST endpoint (`/app/api/status/[documentId]/route.ts`)

---

## Phase 5: Queue & Workers Setup 🔄

- [ ] Configure BullMQ (`/lib/queue/config.ts`)
  - [ ] Set up Redis connection
  - [ ] Create job queues (document, script, audio)
  - [ ] Configure queue events
- [ ] Define job types (`/lib/queue/jobs.ts`)
- [ ] Create worker entry point (`/workers/index.ts`)

---

## Phase 6: Content Worker 📝

- [ ] Create content worker (`/workers/content-worker.ts`)
- [ ] Implement DOCX download from Google Drive
- [ ] Integrate mammoth library for text extraction
- [ ] Create text chunking logic (`/lib/parsers/chunking.ts`)
- [ ] Implement section categorization (keywords detection)
- [ ] Save chunks to Google Sheets
- [ ] Update document status and progress
- [ ] Queue next job (script generation)

---

## Phase 7: Script Worker ✍️

- [ ] Create script worker (`/workers/script-worker.ts`)
- [ ] Fetch chunks from Google Sheets
- [ ] Build GPT-4o mini prompt (`/lib/audio/script-generator.ts`)
- [ ] Implement OpenAI API integration
- [ ] Handle streaming responses
- [ ] Save generated script to AudioOutputs sheet
- [ ] Update progress (70%)
- [ ] Queue audio generation job

---

## Phase 8: Audio Worker 🎙️

- [ ] Create audio worker (`/workers/audio-worker.ts`)
- [ ] Create ElevenLabs client (`/lib/audio/elevenlabs-client.ts`)
- [ ] Implement script chunking (5000 char limit)
- [ ] Generate audio chunks with request stitching
- [ ] Save chunks to temporary storage
- [ ] Create FFmpeg stitcher (`/lib/audio/ffmpeg-stitcher.ts`)
- [ ] Concatenate audio chunks with FFmpeg
- [ ] Upload final MP3 to Google Drive
- [ ] Generate shareable link
- [ ] Update AudioOutputs sheet with URL
- [ ] Update document status to complete (100%)
- [ ] Cleanup temporary files

---

## Phase 9: Error Handling 🛡️

- [ ] Add try-catch blocks in all workers
- [ ] Implement BullMQ retry logic (3 attempts)
- [ ] Handle Google API rate limits
- [ ] Create error status updates in UI
- [ ] Add fallback for DOCX extraction failures
- [ ] Log errors to console/file
- [ ] Display user-friendly error messages

---

## Phase 10: Testing & Polish ✨

- [ ] Test full flow with pasted text
- [ ] Test full flow with DOCX upload
- [ ] Test large documents (50+ pages)
- [ ] Verify audio quality
- [ ] Test progress updates accuracy
- [ ] Check responsive design (mobile, tablet, desktop)
- [ ] Optimize loading states
- [ ] Add animations and transitions
- [ ] Test error scenarios
- [ ] Performance optimization

---

## Phase 11: Deployment 🚀

- [ ] Deploy Next.js to Vercel
- [ ] Deploy workers to Railway
- [ ] Configure environment variables on Vercel
- [ ] Configure environment variables on Railway
- [ ] Test production deployment
- [ ] Set up monitoring (optional)
- [ ] Create deployment documentation

---

## Optional Enhancements 🎁

- [ ] Add user authentication
- [ ] Create document library
- [ ] Implement custom voice selection
- [ ] Add script editing before audio generation
- [ ] Support batch processing
- [ ] Add analytics dashboard
- [ ] Implement caching strategies
- [ ] Add email notifications

---

## Notes

- **Priority**: Phases 1-8 are critical for MVP
- **Timeline**: 6 weeks estimated
- **Testing**: Test after each phase before moving forward
- **Documentation**: Update this checklist as you progress
