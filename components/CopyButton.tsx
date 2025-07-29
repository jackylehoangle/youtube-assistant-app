import React, { useState, useCallback } from 'react';

interface CopyButtonProps {
    textToCopy: string;
    buttonText?: string;
    size?: 'sm' | 'md';
    className?: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy, buttonText = 'Sao chép gợi ý', size = 'md', className = '' }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation(); // Prevent card click when copy button is clicked
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    }, [textToCopy]);
    
    // Layout classes (w-full, margin) are now passed via `className` prop for flexibility.
    const sizeClasses = {
        sm: 'p-2',
        md: 'px-4 py-2'
    }

    const textClasses = {
        sm: 'text-xs',
        md: 'text-sm'
    }

    return (
        <button
            onClick={handleCopy}
            className={`flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 rounded-md font-semibold text-slate-300 transition-colors ${sizeClasses[size]} ${textClasses[size]} ${className}`}
            aria-label={buttonText || "Sao chép"}
        >
            {isCopied ? (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {size === 'md' && buttonText !== '' && 'Đã sao chép!'}
                </>
            ) : (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {size === 'md' && buttonText !== '' && buttonText}
                </>
            )}
        </button>
    );
};

export default CopyButton;