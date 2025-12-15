# AI Script Maker - Technical Specifications

## Overview
Web application that converts product newsletter text into professional audio narrations.

**Input:** Paste text OR upload DOCX
**Output:** Downloadable MP3 audio file

---

## User Flow

### 1. Landing Page
- User arrives at landing page
- Two input options (tabs):
  - **Paste Text**: Textarea with character counter
  - **Upload DOCX**: Drag-and-drop file upload
- Click "Create Audio Script" button

### 2. Processing Screen
- Real-time progress bar (0-100%)
- Milestone indicators:
  - 📝 Organizing content (0-30%)
  - ✍️ Generating script (30-60%)
  - 🎙️ Converting to audio (60-90%)
  - 🔗 Stitching audio (90-100%)
- Live status updates via Server-Sent Events

### 3. Complete Screen
- Audio player with controls (play, pause, seek, volume)
- Download MP3 button
- View script text link
- "Process Another" button

---

## Tech Stack

### Frontend
- Next.js 14+ (App Router)
- TypeScript
- shadcn/ui + Tailwind CSS
- React Server Components

### Backend
- Next.js API Routes
- BullMQ (job queue)
- Redis (Upstash)
- Node.js workers

### Database & Storage
- Google Sheets (database)
- Google Drive (file storage)

### APIs & Services
- OpenAI GPT-4o mini (script generation)
- ElevenLabs (text-to-speech)
- FFmpeg (audio stitching)
- Google Sheets API
- Google Drive API

---

## APIs Needed

### 1. Google Cloud APIs
**Service Account Required**
- Google Sheets API (database operations)
- Google Drive API (file upload/download)

**Setup:**
- Spreadsheet ID
- Drive Folder ID
- Service Account Email
- Private Key

### 2. Upstash Redis
- Redis URL for BullMQ queue

### 3. OpenAI API
- API Key
- Model: `gpt-4o-mini`
- Cost: ~$0.10-1.00 per document

### 4. ElevenLabs API
- API Key
- Voice ID
- Model: `eleven_multilingual_v2`
- Cost: ~$2-5 per document

---

## System Architecture

```
User Input (Text/DOCX)
    ↓
Next.js API Route → Create job
    ↓
BullMQ Queue (Redis)
    ↓
Workers (Background Processing)
    ├─ Content Worker: Extract & chunk text
    ├─ Script Worker: GPT-4o mini → narrative script
    └─ Audio Worker: ElevenLabs → FFmpeg stitch
    ↓
Google Drive (Final MP3)
    ↓
Audio Player (Frontend)
```

---

## Database Schema

### Google Sheets with 3 Tabs:

**Sheet 1: Documents**
- id, title, input_type, content, file_url, status, progress_percentage, current_step, error_message, created_at, updated_at

**Sheet 2: Chunks**
- id, document_id, section_type, heading, content, chunk_order, created_at

**Sheet 3: AudioOutputs**
- id, document_id, script_text, audio_url, duration_seconds, file_size_bytes, created_at

---

## Processing Pipeline

1. **Submit** → User submits text/DOCX → Create record in Google Sheets
2. **Queue** → Add job to BullMQ
3. **Extract** → Content worker downloads DOCX from Drive, extracts text
4. **Chunk** → Parse into sections (Planned Releases, Tech Releases, Bugs & Fixes)
5. **Script** → Script worker sends chunks to GPT-4o mini for narrative conversion
6. **Audio** → Audio worker splits script, generates audio chunks via ElevenLabs
7. **Stitch** → FFmpeg concatenates chunks into final MP3
8. **Upload** → Final audio uploaded to Google Drive
9. **Complete** → Update status, return shareable link

---

## Key Features

- ✅ Text paste + DOCX upload support
- ✅ Real-time progress tracking (SSE with polling)
- ✅ Background job processing (no timeouts)
- ✅ Professional audio quality (ElevenLabs + FFmpeg)
- ✅ Request stitching for voice consistency
- ✅ Modern, responsive UI
- ✅ Zero database costs (Google Sheets)
- ✅ Free file storage (Google Drive 15GB)

---

## Environment Variables

```bash
# Google (Database & Storage)
GOOGLE_SPREADSHEET_ID=xxx
GOOGLE_DRIVE_FOLDER_ID=xxx
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...

# Queue
REDIS_URL=rediss://...

# AI APIs
OPENAI_API_KEY=sk-proj-...
ELEVENLABS_API_KEY=xxx
ELEVENLABS_VOICE_ID=xxx
```

---

## Cost Estimate

### Monthly Base Cost: ~$40-60
- Vercel Pro: $20
- Google Sheets: FREE
- Google Drive: FREE
- Upstash Redis: $10-20
- Railway (Workers): $10-20

### Per Document: ~$2.10-6.00
- OpenAI: $0.10-1.00
- ElevenLabs: $2-5

**Example:** 100 documents/month = $250-660 total

---

## Critical Files to Implement

### Frontend
- `/app/page.tsx` - Landing page
- `/app/processing/[documentId]/page.tsx` - Processing status
- `/app/components/AudioPlayer.tsx` - Audio playback

### API Routes
- `/app/api/submit/route.ts` - Handle submissions
- `/app/api/progress/[documentId]/route.ts` - SSE progress updates

### Workers
- `/workers/content-worker.ts` - Text extraction & chunking
- `/workers/script-worker.ts` - GPT-4o mini integration
- `/workers/audio-worker.ts` - ElevenLabs + FFmpeg

### Libraries
- `/lib/google-sheets/client.ts` - Sheets API wrapper
- `/lib/google-drive/client.ts` - Drive API wrapper
- `/lib/queue/config.ts` - BullMQ setup

---

## Timeline

**6 weeks total**

- Week 1-2: Setup + Frontend + Google APIs
- Week 3-4: Workers (content, script, audio)
- Week 5: SSE progress + Audio player
- Week 6: Testing + Polish

---

## Success Criteria

- Processing time < 15 minutes for 70-page document
- Error rate < 5%
- Clean, intuitive UI
- Reliable background processing
- High-quality audio output
