
'use client';

import { cn } from "@/lib/utils";
import React from "react";

interface AnimatedGradientBackgroundProps {
    children: React.ReactNode;
    className?: string;
}

const AnimatedGradientBackground: React.FC<AnimatedGradientBackgroundProps> = ({ children, className }) => {
    return (
        <div className={cn("relative", className)}>
            <div className="absolute inset-0 z-0 animated-gradient" />
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};

export default AnimatedGradientBackground;
