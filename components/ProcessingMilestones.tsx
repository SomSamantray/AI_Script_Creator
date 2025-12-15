import { CheckCircle2, Loader2, Clock } from 'lucide-react';

interface ProcessingMilestonesProps {
  progress: number;
  currentStep: string;
}

interface Milestone {
  id: number;
  label: string;
  range: [number, number];
}

const milestones: Milestone[] = [
  { id: 1, label: 'Analyzing content', range: [0, 30] },
  { id: 2, label: 'Generating script', range: [30, 60] },
  { id: 3, label: 'Converting to audio', range: [60, 90] },
  { id: 4, label: 'Stitching audio', range: [90, 100] },
];

function getMilestoneStatus(milestone: Milestone, progress: number): 'completed' | 'active' | 'pending' {
  if (progress > milestone.range[1]) return 'completed';
  if (progress >= milestone.range[0] && progress <= milestone.range[1]) return 'active';
  return 'pending';
}

export function ProcessingMilestones({ progress, currentStep }: ProcessingMilestonesProps) {
  return (
    <div className="space-y-3">
      {milestones.map((milestone) => {
        const status = getMilestoneStatus(milestone, progress);

        return (
          <div key={milestone.id} className="flex items-center gap-3">
            {/* Icon */}
            {status === 'completed' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            )}
            {status === 'active' && (
              <Loader2 className="w-5 h-5 text-indigo-600 flex-shrink-0 animate-spin" />
            )}
            {status === 'pending' && (
              <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
            )}

            {/* Label */}
            <span
              className={`text-sm ${
                status === 'completed'
                  ? 'text-emerald-600 font-medium'
                  : status === 'active'
                  ? 'text-indigo-600 font-medium'
                  : 'text-gray-500'
              }`}
            >
              {milestone.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
