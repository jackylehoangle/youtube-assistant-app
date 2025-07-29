
import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    noHover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', noHover = false }) => {
    const hoverClass = noHover ? '' : 'hover:shadow-indigo-500/10';
    return (
        <div className={`bg-slate-800 border border-slate-700 rounded-lg p-5 shadow-lg transition-shadow ${hoverClass} ${className}`}>
            {children}
        </div>
    );
};

export default Card;
