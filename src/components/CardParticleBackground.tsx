
'use client';

import { cn } from "@/lib/utils";
import React, { useMemo } from "react";

// SVG components for card suits
const HeartIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="text-red-500/50">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
);

const DiamondIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="text-red-500/50">
        <path d="M12 2L2 12l10 10 10-10L12 2z"/>
    </svg>
);

const ClubIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="text-black/50 dark:text-white/50">
        <path d="M12 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-3.5 5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm7 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-3.5 5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 4c-2.21 0-4 1.79-4 4h8c0-2.21-1.79-4-4-4z"/>
    </svg>
);

const SpadeIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="text-black/50 dark:text-white/50">
        <path d="M12 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-3.5 5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm7 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-3.5 5c-2.21 0-4 1.79-4 4h8c0-2.21-1.79-4-4-4zM12 19c-1.1 0-2 .9-2 2h4c0-1.1-.9-2-2-2z"/>
    </svg>
);

const icons = [HeartIcon, DiamondIcon, ClubIcon, SpadeIcon];
const NUM_PARTICLES = 30;

interface CardParticleBackgroundProps {
    children: React.ReactNode;
    className?: string;
}

const CardParticleBackground: React.FC<CardParticleBackgroundProps> = ({ children, className }) => {
    
    const particles = useMemo(() => {
        return Array.from({ length: NUM_PARTICLES }).map((_, i) => {
            const Icon = icons[i % icons.length];
            const size = Math.random() * 20 + 10; // 10px to 30px
            const left = Math.random() * 100; // 0% to 100%
            const duration = Math.random() * 10 + 10; // 10s to 20s
            const delay = Math.random() * -20; // Start at different times

            return (
                <div
                    key={i}
                    className="particle"
                    style={{
                        left: `${left}vw`,
                        width: `${size}px`,
                        height: `${size}px`,
                        animationDuration: `${duration}s`,
                        animationDelay: `${delay}s`,
                    }}
                >
                    <Icon />
                </div>
            );
        });
    }, []);

    return (
        <div className={cn("relative overflow-hidden", className)}>
             <div className="absolute inset-0 z-0 bg-background">
                {particles}
            </div>
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};

export default CardParticleBackground;
