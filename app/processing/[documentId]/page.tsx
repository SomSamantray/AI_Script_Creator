'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProcessingStatus } from '@/components/ProcessingStatus';
import { AudioPlayer } from '@/components/AudioPlayer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

interface AudioOutput {
  id: string;
  document_id: string;
  script_text: string;
  audio_url: string;
  duration_seconds: number;
  file_size_bytes: number;
  created_at: string;
}

interface Document {
  id: string;
  title: string;
  input_type: string;
  status: string;
  progress_percentage: number;
  current_step: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export default function ProcessingPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.documentId as string;

  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [audioOutput, setAudioOutput] = useState<AudioOutput | null>(null);
  const [showScript, setShowScript] = useState(false);

  // Fetch document and audio output when complete
  useEffect(() => {
    if (isComplete) {
      fetchDocumentDetails();
    }
  }, [isComplete]);

  const fetchDocumentDetails = async () => {
    try {
      // Fetch document info
      const docResponse = await fetch(`/api/document/${documentId}`);
      if (docResponse.ok) {
        const docData = await docResponse.json();
        setDocument(docData);
      }

      // Fetch audio output
      const audioResponse = await fetch(`/api/audio/${documentId}`);
      if (audioResponse.ok) {
        const audioData = await audioResponse.json();
        setAudioOutput(audioData);
      }
    } catch (err) {
      console.error('Error fetching document details:', err);
    }
  };

  const handleComplete = () => {
    setIsComplete(true);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 dark:text-white">Processing Document</h1>
          <p className="text-slate-600 dark:text-slate-300">Document ID: {documentId}</p>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-destructive dark:bg-slate-800 dark:border-red-500">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="text-6xl">❌</div>
                <h2 className="text-2xl font-semibold text-destructive dark:text-red-400">
                  Processing Failed
                </h2>
                <p className="text-slate-600 dark:text-slate-300">{error}</p>
                <Link href="/">
                  <Button className="dark:bg-blue-600 dark:hover:bg-blue-700">Return to Home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing State */}
        {!isComplete && !error && (
          <ProcessingStatus
            documentId={documentId}
            onComplete={handleComplete}
            onError={handleError}
          />
        )}

        {/* Complete State */}
        {isComplete && !error && audioOutput && (
          <div className="space-y-6">
            {/* Success Message */}
            <Card className="border-green-500/50 bg-green-50 dark:bg-green-900/20 dark:border-green-500">
              <CardContent className="p-6">
                <div className="text-center space-y-2">
                  <div className="text-6xl">✅</div>
                  <h2 className="text-2xl font-semibold text-green-600 dark:text-green-400">
                    Audio Generation Complete!
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300">
                    Your newsletter has been converted into a professional audio narration
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Audio Player */}
            <AudioPlayer
              audioUrl={audioOutput.audio_url}
              title={document?.title || 'Audio Narration'}
            />

            {/* Script View */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold dark:text-white">Generated Script</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowScript(!showScript)}
                    className="dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-slate-600"
                  >
                    {showScript ? 'Hide' : 'View'} Script
                  </Button>
                </div>

                {showScript && (
                  <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap font-mono dark:text-slate-200">
                      {audioOutput.script_text}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Duration</p>
                    <p className="font-medium dark:text-white">
                      {Math.floor(audioOutput.duration_seconds / 60)}:
                      {Math.floor(audioOutput.duration_seconds % 60)
                        .toString()
                        .padStart(2, '0')}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">File Size</p>
                    <p className="font-medium dark:text-white">
                      {(audioOutput.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Created</p>
                    <p className="font-medium dark:text-white">
                      {new Date(audioOutput.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Input Type</p>
                    <p className="font-medium uppercase dark:text-white">
                      {document?.input_type || 'Unknown'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <Link href="/">
                <Button variant="outline" size="lg" className="dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-slate-600">
                  Process Another Document
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
