import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                lobster: "#FF4500",
                matrix: "#00FF41",
                "terminal-dark": "#0A0A0F",
                "terminal-mid": "#12121A",
                "terminal-light": "#1A1A2E",
                "terminal-border": "#2A2A3E",
            },
            fontFamily: {
                outfit: ["Outfit", "sans-serif"],
                mono: ["JetBrains Mono", "Fira Code", "monospace"],
            },
            animation: {
                "data-stream": "dataStream 20s linear infinite",
                "glow-pulse": "glowPulse 2s ease-in-out infinite",
                "float": "float 6s ease-in-out infinite",
                "glitch": "glitch 0.3s ease-in-out",
                "scan-line": "scanLine 2s linear infinite",
                "flicker": "flicker 0.15s infinite",
            },
            keyframes: {
                dataStream: {
                    "0%": { backgroundPosition: "0% 0%" },
                    "100%": { backgroundPosition: "0% 100%" },
                },
                glowPulse: {
                    "0%, 100%": { boxShadow: "0 0 5px rgba(0, 255, 65, 0.3)" },
                    "50%": { boxShadow: "0 0 20px rgba(0, 255, 65, 0.6), 0 0 40px rgba(0, 255, 65, 0.3)" },
                },
                float: {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-10px)" },
                },
                glitch: {
                    "0%": { transform: "translate(0)" },
                    "20%": { transform: "translate(-3px, 3px)" },
                    "40%": { transform: "translate(-3px, -3px)" },
                    "60%": { transform: "translate(3px, 3px)" },
                    "80%": { transform: "translate(3px, -3px)" },
                    "100%": { transform: "translate(0)" },
                },
                scanLine: {
                    "0%": { top: "-10%" },
                    "100%": { top: "110%" },
                },
                flicker: {
                    "0%": { opacity: "0.97" },
                    "50%": { opacity: "1" },
                    "100%": { opacity: "0.98" },
                },
            },
        },
    },
    plugins: [],
};

export default config;
