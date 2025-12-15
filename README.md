# AI Script Maker

Convert product newsletters into professional audio narrations using AI.

## Features

- Paste text or upload simple DOCX files
- Automatic content chunking and categorization
- AI-powered script generation with OpenAI GPT-4o mini
- Professional text-to-speech with ElevenLabs
- Background job processing with BullMQ
- Real-time progress tracking
- Google Sheets database (zero cost)
- Google Drive file storage

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, BullMQ, Redis (Upstash)
- **Database**: Google Sheets API
- **Storage**: Google Drive API
- **AI**: OpenAI GPT-4o mini, ElevenLabs TTS
- **Audio**: FFmpeg

## Prerequisites

- Node.js 18+ and npm
- Google Cloud Project with Sheets and Drive APIs enabled
- Google Service Account with credentials
- Upstash Redis instance
- OpenAI API key
- ElevenLabs API key

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Google Sheets (Database)
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Redis (Upstash)
REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379

# AI APIs
OPENAI_API_KEY=sk-proj-...
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_VOICE_ID=your-voice-id
```

### 3. Google Sheets Setup

1. Create a new Google Spreadsheet
2. Create 3 sheets (tabs) with these exact names:
   - `Documents`
   - `Chunks`
   - `AudioOutputs`

3. Add column headers to each sheet:

**Documents sheet:**
```
id | title | input_type | content | file_url | status | progress_percentage | current_step | error_message | created_at | updated_at
```

**Chunks sheet:**
```
id | document_id | section_type | heading | content | chunk_order | created_at
```

**AudioOutputs sheet:**
```
id | document_id | script_text | audio_url | duration_seconds | file_size_bytes | created_at
```

4. Share the spreadsheet with your Google Service Account email

### 4. Google Drive Setup

1. Create a folder in Google Drive
2. Share it with your Google Service Account email (Editor permission)
3. Copy the folder ID from the URL

## Development

### Run Next.js Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run Workers (Separate Terminal)

```bash
npm run workers
```

Or with auto-reload during development:

```bash
npm run workers:dev
```

### Build for Production

```bash
npm run build
npm start
```

## Architecture

### Processing Pipeline

1. **User submits text/DOCX** → Next.js API creates job
2. **Content Worker** → Extracts text, chunks into sections
3. **Script Worker** → Generates narrative script with GPT-4o mini
4. **Audio Worker** → Generates audio chunks with ElevenLabs, stitches with FFmpeg
5. **Upload to Google Drive** → Returns shareable MP3 link

### Background Workers

- **Content Worker** (`/workers/content-worker.ts`)
  - Downloads DOCX from Google Drive
  - Extracts text with mammoth
  - Chunks content by headings
  - Categorizes sections (Planned Releases, Tech Releases, Bugs & Fixes)
  - Saves to Google Sheets

- **Script Worker** (`/workers/script-worker.ts`)
  - Fetches chunks from Google Sheets
  - Sends to OpenAI GPT-4o mini
  - Generates narrative script
  - Saves to AudioOutputs sheet

- **Audio Worker** (`/workers/audio-worker.ts`)
  - Splits script into 5000-char chunks
  - Generates audio with ElevenLabs (request stitching)
  - Stitches chunks with FFmpeg
  - Uploads MP3 to Google Drive

### Real-Time Progress

- Server-Sent Events (SSE) endpoint polls Google Sheets every 2 seconds
- Frontend displays live progress bar (0-100%)
- Milestone indicators for each stage

## Project Structure

```
/app
  /api
    /submit/route.ts          # Handle submissions
    /progress/[id]/route.ts   # SSE progress endpoint
  /processing/[id]/page.tsx   # Processing status page
  /components
    AudioPlayer.tsx           # Audio playback
    ProcessingStatus.tsx      # SSE consumer
  page.tsx                    # Landing page
  layout.tsx                  # Root layout
  globals.css                 # Tailwind styles

/lib
  /google-sheets
    client.ts                 # Sheets API wrapper
  /google-drive
    client.ts                 # Drive API wrapper
  /db
    documents.ts              # Documents CRUD
    chunks.ts                 # Chunks operations
    audio-outputs.ts          # Audio outputs operations
  /queue
    config.ts                 # BullMQ setup
    jobs.ts                   # Job type definitions
  /parsers
    chunking.ts               # Text chunking logic
  /audio
    script-generator.ts       # OpenAI prompt builder
    elevenlabs-client.ts      # ElevenLabs TTS wrapper
    ffmpeg-stitcher.ts        # FFmpeg concatenation
  utils.ts                    # shadcn/ui utilities

/workers
  index.ts                    # Worker entry point
  content-worker.ts           # Extract & chunk
  script-worker.ts            # Generate script
  audio-worker.ts             # Generate & stitch audio

/components/ui               # shadcn/ui components
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_SPREADSHEET_ID` | ID from Sheets URL | `1Got2aP7PE9LcWoQ...` |
| `GOOGLE_DRIVE_FOLDER_ID` | ID from Drive folder URL | `1c2XdSJMuzxX7u2l...` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email | `ai-script-maker@...` |
| `GOOGLE_PRIVATE_KEY` | Private key (keep `\n`) | `"-----BEGIN..."` |
| `REDIS_URL` | Upstash Redis URL | `rediss://default:...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-proj-...` |
| `ELEVENLABS_API_KEY` | ElevenLabs API key | `sk_...` |
| `ELEVENLABS_VOICE_ID` | Voice ID from library | `QTKSa2Iyv0yoxvXY2V8a` |

## Deployment

### Vercel (Frontend + API)

```bash
vercel deploy
```

Configure environment variables in Vercel dashboard.

### Railway (Workers)

1. Push to GitHub
2. Connect Railway to repository
3. Configure environment variables
4. Deploy worker service

## Troubleshooting

### Workers not processing jobs

- Check Redis connection (`REDIS_URL`)
- Ensure workers are running (`npm run workers`)
- Check worker logs for errors

### Google API errors

- Verify Service Account has access to Sheets and Drive
- Check private key formatting (must have `\n` characters)
- Ensure Sheets has correct column headers

### Audio generation fails

- Verify ElevenLabs API key and voice ID
- Check FFmpeg installation (uses `ffmpeg-static` package)
- Ensure temp directory is writable

## License

ISC

## Support

For issues, check:
- CLAUDE.md (guidance for future Claude instances)
- SPECS.md (technical specifications)
- TODO.md (implementation checklist)
