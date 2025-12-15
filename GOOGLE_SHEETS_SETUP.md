# Google Sheets Database Setup Guide

## Step 1: Create the Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click "Blank" to create a new spreadsheet
3. Name it "AI Script Maker Database"

## Step 2: Create the Three Sheets (Tabs)

By default, you'll have "Sheet1". You need to create 3 sheets total:

1. Rename "Sheet1" to **"Documents"**
2. Click the "+" button to add a new sheet, name it **"Chunks"**
3. Click the "+" button again, name it **"AudioOutputs"**

## Step 3: Add Column Headers

### Documents Sheet

Click on the "Documents" tab and add these column headers in **Row 1** (A1 to K1):

```
A1: id
B1: title
C1: input_type
D1: content
E1: file_url
F1: status
G1: progress_percentage
H1: current_step
I1: error_message
J1: created_at
K1: updated_at
```

**Quick Copy:** Paste this in cell A1:
```
id	title	input_type	content	file_url	status	progress_percentage	current_step	error_message	created_at	updated_at
```

### Chunks Sheet

Click on the "Chunks" tab and add these column headers in **Row 1** (A1 to G1):

```
A1: id
B1: document_id
C1: section_type
D1: heading
E1: content
F1: chunk_order
G1: created_at
```

**Quick Copy:** Paste this in cell A1:
```
id	document_id	section_type	heading	content	chunk_order	created_at
```

### AudioOutputs Sheet

Click on the "AudioOutputs" tab and add these column headers in **Row 1** (A1 to G1):

```
A1: id
B1: document_id
C1: script_text
D1: audio_url
E1: duration_seconds
F1: file_size_bytes
G1: created_at
```

**Quick Copy:** Paste this in cell A1:
```
id	document_id	script_text	audio_url	duration_seconds	file_size_bytes	created_at
```

## Step 4: Share with Service Account

1. Click the **Share** button (top right)
2. Paste your Service Account email from the Google Cloud credentials JSON file
   - It looks like: `ai-script-maker@your-project.iam.gserviceaccount.com`
3. Change permission to **"Editor"**
4. Click **"Send"** (uncheck "Notify people" if prompted)

## Step 5: Get the Spreadsheet ID

1. Look at the URL of your spreadsheet
2. The ID is the long string between `/d/` and `/edit`:
   ```
   https://docs.google.com/spreadsheets/d/[THIS_IS_THE_SPREADSHEET_ID]/edit
   ```
3. Copy this ID and add it to your `.env.local` file as `GOOGLE_SPREADSHEET_ID`

## Step 6: Verify Setup

Your spreadsheet should now have:
- ✅ 3 sheets: Documents, Chunks, AudioOutputs
- ✅ Column headers in Row 1 of each sheet
- ✅ Shared with your Service Account email
- ✅ Spreadsheet ID copied to `.env.local`

## Optional: Formatting

You can optionally format the headers:
1. Select Row 1 in each sheet
2. Make it **bold**
3. Add a background color (e.g., light gray)
4. Freeze Row 1: View → Freeze → 1 row

This makes it easier to see the headers when data starts filling in.

## Troubleshooting

### "Document not found" error
- Make sure the Spreadsheet ID in `.env.local` is correct
- Check that the spreadsheet is shared with the Service Account email

### "Sheet not found" error
- Verify the sheet names are exactly: `Documents`, `Chunks`, `AudioOutputs` (case-sensitive)

### Permission errors
- Ensure the Service Account has "Editor" permission
- Check that the Google Sheets API is enabled in Google Cloud Console

## Next Steps

After setting up the spreadsheet, continue with:
1. Set up Google Drive folder (see README.md)
2. Configure all environment variables
3. Run `npm run dev` and `npm run workers`
