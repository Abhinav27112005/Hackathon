import React from 'react';

interface Step {
  number: number;
  title: string;
  icon: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.number;
        const isCurrent = currentStep === step.number;
        const isUpcoming = currentStep < step.number;

        return (
          <React.Fragment key={step.number}>
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center
                          text-sm font-bold transition-all duration-300
                          ${isCompleted
                            ? 'bg-green-500 text-white shadow-md shadow-green-200'
                            : isCurrent
                            ? 'bg-green-600 text-white shadow-lg shadow-green-200 ring-4 ring-green-100'
                            : 'bg-gray-100 text-gray-400'
                          }`}
              >
                {isCompleted ? '✓' : step.icon}
              </div>
              <span
                className={`text-xs mt-1.5 font-medium hidden sm:block
                          ${isCurrent ? 'text-green-700' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}
              >
                {step.title}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2 h-0.5 rounded-full">
                <div
                  className={`h-full rounded-full transition-all duration-500
                            ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepIndicator;