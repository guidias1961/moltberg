'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlitchTextProps {
    children: ReactNode;
    className?: string;
    as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

export default function GlitchText({ children, className = '', as: Tag = 'span' }: GlitchTextProps) {
    return (
        <motion.span
            className={`glitch-hover inline-block ${className}`}
            whileHover={{
                textShadow: [
                    '0 0 0 transparent',
                    '2px 0 rgba(255,69,0,0.7), -2px 0 rgba(0,255,65,0.7)',
                    '-1px 0 rgba(255,69,0,0.5), 1px 0 rgba(0,255,65,0.5)',
                    '0 0 0 transparent',
                ],
                transition: { duration: 0.3 },
            }}
        >
            {children}
        </motion.span>
    );
}
