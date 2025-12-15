'use client';

import { Copy, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useState } from 'react';

interface ScriptViewerProps {
  scriptText: string;
}

export function ScriptViewer({ scriptText }: ScriptViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="script" className="border-none">
          <AccordionTrigger className="px-8 py-6 hover:no-underline hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-lg">📝</span>
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900">Generated Script</h3>
                <p className="text-sm text-gray-500">View the AI-generated narrative</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-8 pb-8">
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <pre className="text-sm leading-relaxed whitespace-pre-wrap font-mono text-gray-800 max-h-[500px] overflow-y-auto">
                  {scriptText}
                </pre>
              </div>
              <Button
                onClick={handleCopy}
                className="absolute top-4 right-4 rounded-full bg-white hover:bg-gray-50 text-gray-700 shadow-lg border border-gray-200"
                size="sm"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
