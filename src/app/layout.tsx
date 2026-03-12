import type { Metadata } from 'next';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
    subsets: ['latin'],
    variable: '--font-outfit',
    display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-jetbrains',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'MOLTBERG Protocol — Decentralized Project Evaluation Hub',
    description: 'Submit your vision to MOLTBERG, the unbiased AI agent. Get scored on Feasibility, Market Disruption, and Narrative Strength. Top 3 projects receive funding from the Moltberg Fee Pool.',
    keywords: ['MOLTBERG', 'decentralized', 'project evaluation', 'Web3', 'Base', 'Ethereum', 'crypto', 'funding'],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className={`${outfit.variable} ${jetbrainsMono.variable} font-outfit antialiased`}>
                {children}
            </body>
        </html>
    );
}
