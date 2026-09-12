import { SAMPLE_SCENARIOS, SampleScenario } from '../data/sampleScenarios';
import { X, Play, Layers } from 'lucide-react';

interface ScenarioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenario: SampleScenario) => void;
}

export default function ScenarioDrawer({
  isOpen,
  onClose,
  onSelectScenario,
}: ScenarioDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border-l border-slate-200 w-full max-w-md h-full flex flex-col shadow-xl p-5 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-200">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Test Scenarios</h3>
              <p className="text-[11px] text-slate-500">Sample clinical cases for testing</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scenarios List */}
        <div className="space-y-3 flex-1">
          {SAMPLE_SCENARIOS.map((scenario) => (
            <div
              key={scenario.id}
              className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl p-3.5 transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-slate-900 text-xs">
                  {scenario.title}
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 ${
                    scenario.expectedOutcome === 'Emergency'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : scenario.expectedOutcome === 'AYUSH'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {scenario.expectedOutcome}
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {scenario.subtitle}
              </p>

              {/* Sample patient input snippet */}
              <div className="mt-2.5 text-[11px] font-mono text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                &ldquo;{scenario.initialInput}&rdquo;
              </div>

              {/* Load Button */}
              <button
                type="button"
                onClick={() => {
                  onSelectScenario(scenario);
                  onClose();
                }}
                className="mt-2.5 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Load Scenario</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
