import React from 'react';

interface HeaderProps {
    onReset: () => void;
}

const Header: React.FC<HeaderProps> = ({ onReset }) => {
    return (
        <header className="w-full max-w-7xl mx-auto flex justify-between items-center pb-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
                    Trợ lý YouTube
                </h1>
            </div>
            <button
                onClick={onReset}
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-md transition-colors"
                title="Bắt đầu lại"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.13-6.36M20 15a9 9 0 01-14.13 6.36" />
                </svg>
                Làm lại
            </button>
        </header>
    );
};

export default Header;
