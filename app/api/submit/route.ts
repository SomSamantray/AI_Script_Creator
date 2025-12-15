import { NextRequest, NextResponse } from 'next/server';
import { createDocument } from '@/lib/db/documents';
import { uploadFile } from '@/lib/google-drive/client';
import { getDocumentProcessingQueue } from '@/lib/queue/config';
import { z } from 'zod';

// Validation schema
const TextSubmissionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  input_type: z.literal('text'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
});

const DocxSubmissionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  input_type: z.literal('docx'),
  fileName: z.string(),
  fileContent: z.string(), // Base64 encoded
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input type
    if (body.input_type === 'text') {
      // Text paste submission
      const validated = TextSubmissionSchema.parse(body);

      // Create document in database
      const document = await createDocument({
        title: validated.title,
        input_type: 'text',
        content: validated.content,
      });

      // Queue background job
      await getDocumentProcessingQueue().add('process-document', {
        documentId: document.id,
      });

      return NextResponse.json({
        success: true,
        documentId: document.id,
        message: 'Document queued for processing',
      });
    } else if (body.input_type === 'docx') {
      // DOCX upload submission
      const validated = DocxSubmissionSchema.parse(body);

      // Decode base64 file content
      const fileBuffer = Buffer.from(validated.fileContent, 'base64');

      // Upload to Google Drive
      const uploadResult = await uploadFile(
        fileBuffer,
        validated.fileName,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );

      // Create document in database
      const document = await createDocument({
        title: validated.title,
        input_type: 'docx',
        file_url: uploadResult.webViewLink,
      });

      // Queue background job
      await getDocumentProcessingQueue().add('process-document', {
        documentId: document.id,
      });

      return NextResponse.json({
        success: true,
        documentId: document.id,
        message: 'Document uploaded and queued for processing',
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid input_type' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[Submit API] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
