'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatusUpdate {
  status: string;
  progress: number;
  currentStep: string;
  errorMessage?: string;
}

interface ProcessingStatusProps {
  documentId: string;
  onComplete: () => void;
  onError: (error: string) => void;
}

export function ProcessingStatus({ documentId, onComplete, onError }: ProcessingStatusProps) {
  const [status, setStatus] = useState<StatusUpdate>({
    status: 'queued',
    progress: 0,
    currentStep: 'Initializing...',
  });

  useEffect(() => {
    // Create EventSource for SSE
    const eventSource = new EventSource(`/api/progress/${documentId}`);

    eventSource.onmessage = (event) => {
      try {
        const data: StatusUpdate = JSON.parse(event.data);
        setStatus(data);

        // Check for completion or error
        if (data.status === 'complete') {
          eventSource.close();
          onComplete();
        } else if (data.status === 'error') {
          eventSource.close();
          onError(data.errorMessage || 'An error occurred');
        }
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
      eventSource.close();
      onError('Connection lost. Please refresh the page.');
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, [documentId, onComplete, onError]);

  // Get milestone indicator
  const getMilestone = () => {
    if (status.progress < 30) return '📝 Organizing content';
    if (status.progress < 60) return '✍️ Generating script';
    if (status.progress < 90) return '🎙️ Converting to audio';
    return '🔗 Stitching audio';
  };

  return (
    <Card className="dark:bg-slate-800 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between dark:text-white">
          <span>Processing Document</span>
          <span className="text-2xl">{getMilestone()}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium dark:text-white">{status.currentStep}</span>
            <span className="text-slate-500 dark:text-slate-400">{status.progress}%</span>
          </div>
          <Progress value={status.progress} className="h-3" />
        </div>

        {/* Milestone Indicators */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className={status.progress >= 0 ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-400 dark:text-slate-600'}>
            <div className="mb-1">📝</div>
            <div>Organizing</div>
            <div className="text-slate-500 dark:text-slate-500">0-30%</div>
          </div>
          <div className={status.progress >= 30 ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-400 dark:text-slate-600'}>
            <div className="mb-1">✍️</div>
            <div>Script</div>
            <div className="text-slate-500 dark:text-slate-500">30-60%</div>
          </div>
          <div className={status.progress >= 60 ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-400 dark:text-slate-600'}>
            <div className="mb-1">🎙️</div>
            <div>Audio</div>
            <div className="text-slate-500 dark:text-slate-500">60-90%</div>
          </div>
          <div className={status.progress >= 90 ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-400 dark:text-slate-600'}>
            <div className="mb-1">🔗</div>
            <div>Stitching</div>
            <div className="text-slate-500 dark:text-slate-500">90-100%</div>
          </div>
        </div>

        {/* Status Message */}
        <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4">
          <p className="text-sm text-center text-slate-600 dark:text-slate-300">
            This may take several minutes depending on document length.
            <br />
            Please don't close this page.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
