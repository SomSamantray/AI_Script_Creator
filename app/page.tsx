'use client';

import { useState } from 'react';
import { Mic, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedIcon } from '@/components/AnimatedIcon';
import { HowItWorks } from '@/components/HowItWorks';
import { ScriptInputModal } from '@/components/ScriptInputModal';

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Animated Icon */}
          <AnimatedIcon icon={Mic} className="w-20 h-20 mx-auto text-indigo-600" />

          {/* Main Heading */}
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            AI Script Maker
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-700 max-w-2xl mx-auto">
            Transform your newsletter into professional audio narration
          </p>

          {/* CTA Button */}
          <div className="pt-4">
            <Button
              onClick={() => setModalOpen(true)}
              size="lg"
              className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-shadow bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <FileText className="mr-2 h-5 w-5" />
              Insert Script
            </Button>
          </div>

          {/* Feature Badges */}
          <div className="flex flex-wrap justify-center gap-4 pt-8 text-sm">
            <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
              <span className="text-gray-700">🤖 AI-Powered</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
              <span className="text-gray-700">🎙️ Professional Voice</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
              <span className="text-gray-700">⚡ Fast Processing</span>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <HowItWorks />

      {/* Features Detail Section */}
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Powered by Leading AI</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🧠</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1 text-gray-900">GPT-4o mini</h3>
                  <p className="text-gray-600">
                    Converts your newsletter into engaging narrative scripts with natural flow
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🎤</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1 text-gray-900">ElevenLabs TTS</h3>
                  <p className="text-gray-600">
                    Generates studio-quality audio narration with human-like voice
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Script Input Modal */}
      <ScriptInputModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </main>
  );
}
