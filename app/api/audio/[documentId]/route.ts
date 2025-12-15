import { NextRequest, NextResponse } from 'next/server';
import { getAudioOutputByDocumentId } from '@/lib/db/audio-outputs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    const audioOutput = await getAudioOutputByDocumentId(documentId);

    if (!audioOutput) {
      return NextResponse.json(
        { error: 'Audio output not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(audioOutput);
  } catch (error) {
    console.error('[Audio API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
