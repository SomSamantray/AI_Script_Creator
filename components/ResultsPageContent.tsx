'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle, Clock, HardDrive, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnhancedAudioPlayer } from '@/components/EnhancedAudioPlayer';
import { ScriptViewer } from '@/components/ScriptViewer';
import type { AudioOutput } from '@/lib/db/audio-outputs';

interface ResultsPageContentProps {
  documentId: string;
  audioOutput: AudioOutput;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ResultsPageContent({ documentId, audioOutput }: ResultsPageContentProps) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="rounded-full gap-2 text-gray-700 hover:text-gray-900 hover:bg-white">
              <ArrowLeft className="h-4 w-4" />
              New Script
            </Button>
          </Link>
        </div>

        {/* Success Badge */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-lg border border-emerald-100 mb-6">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-emerald-700 font-semibold">Audio Ready</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Your Audio is Ready!
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Professional audio narration generated and ready to download
          </p>
        </div>

        {/* Audio Player */}
        <div className="mb-6">
          <EnhancedAudioPlayer audioUrl={audioOutput.audio_url} documentId={documentId} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Duration */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {formatDuration(audioOutput.duration_seconds)}
            </p>
            <p className="text-sm text-gray-500">Duration</p>
          </div>

          {/* File Size */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <HardDrive className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {formatBytes(audioOutput.file_size_bytes)}
            </p>
            <p className="text-sm text-gray-500">File Size</p>
          </div>

          {/* Created */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-sm font-bold text-gray-900 mb-1">
              {formatDate(audioOutput.created_at)}
            </p>
            <p className="text-sm text-gray-500">Generated</p>
          </div>
        </div>

        {/* Script Viewer */}
        <ScriptViewer scriptText={audioOutput.script_text} />
      </div>
    </main>
  );
}
