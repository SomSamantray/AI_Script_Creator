import { notFound, redirect } from 'next/navigation';
import { ResultsPageContent } from '@/components/ResultsPageContent';
import { getDocument } from '@/lib/db/documents';
import { getAudioOutputByDocumentId } from '@/lib/db/audio-outputs';

interface ResultsPageProps {
  params: Promise<{
    documentId: string;
  }>;
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { documentId } = await params;

  // Fetch document and audio output
  const document = await getDocument(documentId);
  const audioOutput = await getAudioOutputByDocumentId(documentId);

  // Handle not found or not complete
  if (!document) {
    notFound();
  }

  if (document.status === 'error') {
    redirect(`/?error=${encodeURIComponent(document.error_message || 'Processing failed')}`);
  }

  if (document.status !== 'complete' || !audioOutput) {
    redirect(`/?error=${encodeURIComponent('Audio not ready yet')}`);
  }

  return <ResultsPageContent documentId={documentId} audioOutput={audioOutput} />;
}
