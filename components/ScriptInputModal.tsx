'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ProcessingMilestones } from './ProcessingMilestones';
import { Progress } from '@/components/ui/progress';

interface ScriptInputModalProps {
  open: boolean;
  onClose: () => void;
}

type View = 'input' | 'processing';

export function ScriptInputModal({ open, onClose }: ScriptInputModalProps) {
  const router = useRouter();
  const [view, setView] = useState<View>('input');
  const [script, setScript] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Processing state
  const [documentId, setDocumentId] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [currentStep, setCurrentStep] = useState('');

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setView('input');
        setScript('');
        setError('');
        setProgress(0);
        setStatus('');
        setCurrentStep('');
        setDocumentId('');
      }, 300); // Wait for close animation
    }
  }, [open]);

  // Handle SSE for progress updates
  useEffect(() => {
    if (!documentId || view !== 'processing') return;

    console.log('[Modal] Starting SSE connection for document:', documentId);
    const eventSource = new EventSource(`/api/progress/${documentId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[Modal] SSE update received:', data);

        setStatus(data.status || '');
        // The API sends 'progress' not 'progress_percentage'
        setProgress(data.progress || 0);
        setCurrentStep(data.currentStep || '');

        // Redirect to results page when complete
        if (data.status === 'complete') {
          console.log('[Modal] Processing complete, redirecting...');
          eventSource.close();
          setTimeout(() => {
            router.push(`/results/${documentId}`);
          }, 1000);
        }

        // Handle error
        if (data.status === 'error') {
          console.error('[Modal] Processing error:', data.errorMessage);
          eventSource.close();
          setError(data.errorMessage || 'An error occurred');
          setView('input');
        }
      } catch (err) {
        console.error('[Modal] Error parsing SSE data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('[Modal] SSE connection error:', err);
      eventSource.close();
      setError('Connection lost. Please refresh the page.');
    };

    return () => {
      console.log('[Modal] Closing SSE connection');
      eventSource.close();
    };
  }, [documentId, view, router]);

  const handlePrepareAudio = async () => {
    if (!script.trim() || script.length < 50) {
      setError('Please enter at least 50 characters');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      console.log('[Modal] Submitting script...');
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Audio Script',
          input_type: 'text',
          content: script,
        }),
      });

      const data = await response.json();
      console.log('[Modal] Submit response:', data);

      if (data.success) {
        setDocumentId(data.documentId);
        setView('processing');
        setProgress(0);
        console.log('[Modal] Switched to processing view');
      } else {
        setError(data.error || 'Failed to submit script');
      }
    } catch (err) {
      console.error('[Modal] Submit error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (view === 'processing') return; // Prevent closing during processing
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-white text-gray-900">
        {view === 'input' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-gray-900">Insert Your Script</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Paste your newsletter script here..."
                className="min-h-[300px] font-mono text-sm resize-none border-gray-300 text-gray-900 bg-white"
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-600">
                {script.length} characters {script.length < 50 && '(minimum 50 required)'}
              </p>

              {error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm border border-red-200">
                  {error}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={handleClose} disabled={isSubmitting} className="text-gray-700">
                Cancel
              </Button>
              <Button
                onClick={handlePrepareAudio}
                disabled={isSubmitting || script.length < 50}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isSubmitting ? 'Submitting...' : 'Prepare Audio'}
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </DialogFooter>
          </>
        )}

        {view === 'processing' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-gray-900">Creating Your Audio</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-gray-900">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              {/* Current Step */}
              {currentStep && (
                <div className="text-center">
                  <p className="text-sm font-medium text-indigo-600">{currentStep}</p>
                </div>
              )}

              {/* Milestones */}
              <ProcessingMilestones progress={progress} currentStep={currentStep} />

              {/* Status Message */}
              <p className="text-center text-sm text-gray-600">
                This may take a few minutes...
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
