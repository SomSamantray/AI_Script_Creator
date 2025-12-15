# Setup Checklist - Complete This Before Testing

Follow these steps in order to set up the AI Script Maker application.

## ✅ Prerequisites (Already Done)

- [x] Node.js 18+ installed
- [x] npm installed
- [x] Project dependencies installed (`npm install`)
- [x] Environment variables configured in `.env.local`

## 📋 Google Cloud Setup

### Step 1: Google Sheets Database

**Follow the detailed guide in `GOOGLE_SHEETS_SETUP.md`**

- [ ] Create new Google Spreadsheet named "AI Script Maker Database"
- [ ] Create 3 sheets: `Documents`, `Chunks`, `AudioOutputs`
- [ ] Add column headers to Documents sheet (11 columns)
- [ ] Add column headers to Chunks sheet (7 columns)
- [ ] Add column headers to AudioOutputs sheet (7 columns)
- [ ] Share spreadsheet with Service Account email
- [ ] Copy Spreadsheet ID to `.env.local`

**Quick verification:**
```bash
# Check that GOOGLE_SPREADSHEET_ID is set
grep GOOGLE_SPREADSHEET_ID .env.local
```

### Step 2: Google Drive Folder

- [ ] Create folder in Google Drive named "AI Script Maker Files"
- [ ] Share folder with Service Account email (Editor permission)
- [ ] Copy folder ID from URL to `.env.local` as `GOOGLE_DRIVE_FOLDER_ID`

**Folder ID is in the URL:**
```
https://drive.google.com/drive/folders/[FOLDER_ID_HERE]
```

**Quick verification:**
```bash
# Check that GOOGLE_DRIVE_FOLDER_ID is set
grep GOOGLE_DRIVE_FOLDER_ID .env.local
```

## 🔑 API Keys Verification

Verify all environment variables are set:

```bash
# Run this command to check all variables
cat .env.local | grep -E "GOOGLE_SPREADSHEET_ID|GOOGLE_DRIVE_FOLDER_ID|GOOGLE_SERVICE_ACCOUNT_EMAIL|REDIS_URL|OPENAI_API_KEY|ELEVENLABS_API_KEY|ELEVENLABS_VOICE_ID"
```

You should see 7 variables with values (not empty).

## 🧪 Pre-Test Verification

### Check 1: Dependencies Installed
```bash
npm list google-spreadsheet googleapis bullmq ioredis openai @elevenlabs/elevenlabs-js
```

### Check 2: Build Check
```bash
npm run build
```

If build succeeds, continue to testing!

## 🚀 Running the Application

### Terminal 1: Start Next.js Server
```bash
npm run dev
```

Expected output:
```
   ▲ Next.js 16.0.10 (Turbopack)
   - Local:        http://localhost:3000
   ✓ Ready in 2.5s
```

### Terminal 2: Start Background Workers
```bash
npm run workers
```

Expected output:
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

## 📝 Test Data

Use this sample newsletter text for testing:

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

BUGS & FIXES

Login Issue Fixed
Fixed a bug where users were occasionally logged out after 10 minutes of inactivity.

Search Performance
Improved search performance by 50% through database indexing.
```

## ✅ Ready to Test

Once all checks pass:

1. [ ] Google Sheets database is set up with correct structure
2. [ ] Google Drive folder is created and shared
3. [ ] All environment variables are configured
4. [ ] Dependencies are installed
5. [ ] Next.js dev server is running (Terminal 1)
6. [ ] Workers are running (Terminal 2)

**You're ready to test!** Open http://localhost:3000 and paste the test data.

## 🐛 Troubleshooting

### Issue: "Sheet not found"
- Check sheet names are exactly: `Documents`, `Chunks`, `AudioOutputs` (case-sensitive)
- Verify spreadsheet is shared with Service Account email

### Issue: Workers not picking up jobs
- Check Redis connection in `.env.local`
- Ensure workers terminal shows "Started and listening for jobs"
- Check for errors in worker logs

### Issue: "Permission denied" on Google APIs
- Verify Service Account has Editor permission on Sheets and Drive
- Check that Google Sheets API and Drive API are enabled in Google Cloud Console

### Issue: Audio generation fails
- Verify ElevenLabs API key is valid
- Check Voice ID is correct
- Ensure `temp` directory exists and is writable

## 📊 Monitoring During Test

Watch these outputs:

**Terminal 1 (Next.js):**
- API route logs
- Request handling

**Terminal 2 (Workers):**
- Job pickup messages
- Processing progress
- Completion/error messages

**Browser:**
- Real-time progress updates
- Final audio player with download
