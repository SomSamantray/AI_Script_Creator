# Testing Guide - AI Script Maker

## ✅ Pre-Testing Checklist

Before you start testing, make sure you've completed:

- [x] Project built successfully (`npm run build` - COMPLETED ✅)
- [x] All dependencies installed
- [x] Environment variables configured in `.env.local`
- [ ] **Google Sheets database set up** (see GOOGLE_SHEETS_SETUP.md)
- [ ] **Google Drive folder created and shared**

## 📋 Step 1: Set Up Google Sheets Database

**This is critical - the app won't work without it!**

Follow the detailed guide in `GOOGLE_SHEETS_SETUP.md`:

1. Create spreadsheet: "AI Script Maker Database"
2. Create 3 sheets (tabs): `Documents`, `Chunks`, `AudioOutputs`
3. Add column headers to each sheet (copy-paste from guide)
4. Share with Service Account email
5. Verify Spreadsheet ID is in `.env.local`

## 📁 Step 2: Set Up Google Drive Folder

1. Go to [Google Drive](https://drive.google.com)
2. Create new folder: "AI Script Maker Files"
3. Right-click → Share
4. Add your Service Account email (from `.env.local`)
5. Set permission to **Editor**
6. Copy folder ID from URL and verify it's in `.env.local`

## 🚀 Step 3: Start the Application

### Terminal 1: Start Next.js

```bash
npm run dev
```

**Expected output:**
```
   ▲ Next.js 16.0.10 (Turbopack)
   - Local:        http://localhost:3000
   ✓ Ready in 2.5s
```

### Terminal 2: Start Workers

```bash
npm run workers
```

**Expected output:**
```
============================================================
AI Script Maker - Background Workers
============================================================
All workers started successfully!
Listening for jobs on the following queues:
  - document-processing (Content Worker)
  - script-generation (Script Worker)
  - audio-generation (Audio Worker)
============================================================
[Content Worker] Started and listening for jobs...
[Script Worker] Started and listening for jobs...
[Audio Worker] Started and listening for jobs...
```

## 🧪 Step 4: Test with Sample Data

### Test 1: Text Paste (Recommended First Test)

1. Open http://localhost:3000 in your browser
2. Make sure you're on the **"Paste Text"** tab
3. Enter a title: `Test Newsletter Q4 2024`
4. Paste this sample text:

```
PRODUCT UPDATES - Q4 2024

PLANNED RELEASES

New Dashboard Feature
We're planning to release a new analytics dashboard next month with real-time metrics and customizable widgets.

Mobile App Update
The mobile app will receive a major update including dark mode and offline support.

TECH RELEASES

API v2.0 Released
We've released version 2.0 of our REST API with improved performance and new endpoints for data export.

Integration Updates
Enhanced integrations with Slack, Teams, and Discord for better collaboration.

BUGS & FIXES

Login Issue Fixed
Fixed a bug where users were occasionally logged out after 10 minutes of inactivity.

Search Performance
Improved search performance by 50% through database indexing.

Dashboard Loading
Resolved slow loading times on the main dashboard by optimizing database queries.
```

5. Click **"Create Audio Script"**
6. You should be redirected to the processing page

### Expected Behavior During Processing

**Processing Page:**
- Real-time progress bar updating every 2 seconds
- Milestone indicators lighting up as work progresses:
  - 📝 Organizing content (0-30%)
  - ✍️ Generating script (30-60%)
  - 🎙️ Converting to audio (60-90%)
  - 🔗 Stitching audio (90-100%)

**Terminal 2 (Workers) Output:**
```
[Content Worker] Processing document: [document-id]
[Content Worker] Using pasted text (XXX characters)
[Content Worker] Created X chunks
[Content Worker] Document [document-id] processed successfully
[Script Worker] Generating script for document: [document-id]
[Script Worker] Found X chunks
[Script Worker] Calling OpenAI GPT-4o mini...
[Script Worker] Generated script (XXX characters)
[Audio Worker] Generating audio for document: [document-id]
[Audio Worker] Script length: XXX characters
Generating X audio chunks...
[Audio Worker] Audio stitched successfully
[Audio Worker] Uploaded to Drive: [URL]
```

**When Complete:**
- ✅ Success message appears
- 🎵 Audio player loads with playback controls
- 📥 Download button appears
- 📄 View Script button shows generated narrative

### Test 2: DOCX Upload

1. Create a simple `.docx` file with similar content
2. Go back to http://localhost:3000
3. Switch to **"Upload DOCX"** tab
4. Enter title and upload file
5. Monitor processing (same as Test 1)

## 🔍 What to Monitor

### Google Sheets
Open your spreadsheet and watch data appear in real-time:

**Documents Sheet:**
- New row appears with document info
- `status` column updates: `queued` → `organizing` → `generating_script` → `generating_audio` → `stitching` → `complete`
- `progress_percentage` increases from 0 to 100

**Chunks Sheet:**
- Multiple rows appear with content sections

**AudioOutputs Sheet:**
- Final row appears with script and audio URL

### Google Drive
- Check your folder - final MP3 file should appear

## ✅ Success Criteria

A successful test includes:

- [ ] Text successfully submitted
- [ ] Progress updates work in real-time
- [ ] Workers process job without errors
- [ ] Google Sheets data appears correctly
- [ ] Audio file appears in Google Drive
- [ ] Audio player loads and plays audio
- [ ] Download button works
- [ ] Generated script is visible

## 🐛 Troubleshooting

### Issue: "Document not found" error

**Possible causes:**
- Google Sheets not set up correctly
- Spreadsheet ID incorrect in `.env.local`
- Spreadsheet not shared with Service Account

**Solution:**
```bash
# Verify spreadsheet ID
grep GOOGLE_SPREADSHEET_ID .env.local

# Check service account email
grep GOOGLE_SERVICE_ACCOUNT_EMAIL .env.local
```

### Issue: Workers not picking up jobs

**Possible causes:**
- Redis connection failed
- Workers not running

**Solution:**
```bash
# Check workers terminal for errors
# Look for "Started and listening for jobs..."

# Test Redis connection
grep REDIS_URL .env.local
```

### Issue: "Permission denied" on Google APIs

**Possible causes:**
- Service Account doesn't have access
- APIs not enabled in Google Cloud

**Solution:**
1. Verify spreadsheet is shared with Service Account email
2. Verify Drive folder is shared with Service Account email
3. Check Google Cloud Console - APIs enabled

### Issue: Audio generation fails

**Possible causes:**
- ElevenLabs API key invalid
- Voice ID incorrect

**Solution:**
```bash
# Verify ElevenLabs credentials
grep ELEVENLABS_API_KEY .env.local
grep ELEVENLABS_VOICE_ID .env.local
```

### Issue: FFmpeg errors

**Possible causes:**
- `temp` directory doesn't exist
- Permission issues

**Solution:**
```bash
# Create temp directory
mkdir -p temp
chmod 755 temp
```

## 📊 Performance Expectations

For the sample newsletter (≈600 words):

- **Total processing time:** 2-5 minutes
- **Content Worker:** 10-20 seconds
- **Script Worker:** 20-40 seconds (OpenAI)
- **Audio Worker:** 1-3 minutes (ElevenLabs + FFmpeg)

For larger documents (70 pages):

- **Total processing time:** 10-15 minutes

## 🎉 Next Steps After Successful Test

1. Try with your own newsletter content
2. Test with a real DOCX file
3. Verify audio quality and voice
4. Check if script accurately represents the newsletter
5. Test error scenarios (invalid file, empty content)

## 📝 Test Checklist

- [ ] Test 1: Paste text - Success
- [ ] Test 2: Upload DOCX - Success
- [ ] Progress updates work correctly
- [ ] Audio playback works
- [ ] Download works
- [ ] Script view works
- [ ] Error handling works (test with empty text)
- [ ] Google Sheets data is correct
- [ ] Google Drive file is accessible

## 🚀 Ready for Production

Once all tests pass, you're ready to:
- Deploy to Vercel (frontend)
- Deploy to Railway (workers)
- Set up production monitoring
- Share with users!

---

**Need Help?** Check:
- README.md - Full documentation
- GOOGLE_SHEETS_SETUP.md - Sheets configuration
- SETUP_CHECKLIST.md - Pre-flight checks
- CLAUDE.md - Architecture details
