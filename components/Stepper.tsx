import React from 'react';
import { Step } from '../types';

interface StepperProps {
    currentStep: Step;
    onStepClick: (step: Step) => void;
}

const steps = [
    { id: Step.Ideation, name: 'Lên ý tưởng' },
    { id: Step.IdeaSelection, name: 'Chọn ý tưởng' },
    { id: Step.Outlining, name: 'Dàn ý' },
    { id: Step.KeywordAnalysis, name: 'Phân tích SEO' },
    { id: Step.Scripting, name: 'Viết kịch bản' },
    { id: Step.ScriptReview, name: 'Biên tập' },
    { id: Step.MusicGeneration, name: 'Tạo nhạc nền' },
    { id: Step.ImageGeneration, name: 'Tạo ảnh' },
    { id: Step.Voiceover, name: 'Lồng tiếng' },
    { id: Step.Publishing, name: 'Xuất bản' },
];

const Stepper: React.FC<StepperProps> = ({ currentStep, onStepClick }) => {
    return (
        <nav aria-label="Progress" className="mt-8 overflow-x-auto pb-4">
            <ol role="list" className="flex items-center w-max">
                {steps.map((step, stepIdx) => (
                    <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-12 sm:pr-20' : ''}`}>
                        {step.id < currentStep ? (
                            <>
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="h-0.5 w-full bg-indigo-600" />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onStepClick(step.id)}
                                    className="relative flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500"
                                    aria-label={`Go to ${step.name} step`}
                                >
                                    <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <button type="button" onClick={() => onStepClick(step.id)} className="absolute top-10 -left-1/2 w-full text-center text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-colors">{step.name}</button>
                            </>
                        ) : step.id === currentStep ? (
                             <>
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="h-0.5 w-full bg-slate-700" />
                                </div>
                                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-indigo-600 bg-slate-800">
                                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" aria-hidden="true" />
                                </div>
                                <span className="absolute top-10 -left-1/2 w-full text-center text-xs sm:text-sm font-medium text-indigo-400">{step.name}</span>
                             </>
                        ) : (
                            <>
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="h-0.5 w-full bg-slate-700" />
                                </div>
                                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-700 bg-slate-800">
                                </div>
                                 <span className="absolute top-10 -left-1/2 w-full text-center text-xs sm:text-sm font-medium text-slate-500">{step.name}</span>
                            </>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
};

export default Stepper;
