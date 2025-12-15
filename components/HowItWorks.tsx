import { FileText, Sparkles, Headphones } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const steps = [
  {
    icon: FileText,
    title: 'Paste Your Script',
    description: 'Paste your newsletter text to get started',
  },
  {
    icon: Sparkles,
    title: 'AI Processing',
    description: 'Our AI transforms it into a narrative script',
  },
  {
    icon: Headphones,
    title: 'Get Audio',
    description: 'Download your professional audio narration',
  },
];

export function HowItWorks() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">How It Works</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((step, index) => (
          <Card
            key={index}
            className="text-center border-2 border-gray-200 hover:border-indigo-300 transition-colors duration-300 hover:shadow-lg bg-white"
          >
            <CardHeader>
              <div className="w-16 h-16 mx-auto mb-4 text-indigo-600">
                <step.icon className="w-full h-full" strokeWidth={1.5} />
              </div>
              <CardTitle className="text-xl text-gray-900">{step.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{step.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
