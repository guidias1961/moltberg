'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useMoltbergStore, AgentId, ChatMessage } from '@/store/store';

/* ─── Agent Config ─── */

interface AgentConfig {
    id: AgentId;
    name: string;
    title: string;
    color: string;
    borderColor: string;
    bgGlow: string;
    avatar: string;
    accent: string;
    placeholder: string;
}

const AGENTS: AgentConfig[] = [
    {
        id: 'moltberg',
        name: 'MOLTBERG',
        title: 'Chief Evaluator',
        color: 'text-lobster',
        borderColor: 'border-lobster/40',
        bgGlow: 'shadow-[0_0_30px_rgba(255,69,0,0.15)]',
        avatar: '/moltberg.png',
        accent: '#FF4500',
        placeholder: 'Ask Moltberg about the protocol...',
    },
    {
        id: 'bozworth',
        name: 'BOZWORTH',
        title: 'CTO — Technical Enforcer',
        color: 'text-cyan-400',
        borderColor: 'border-cyan-400/40',
        bgGlow: 'shadow-[0_0_30px_rgba(0,200,255,0.15)]',
        avatar: '/moltberg.png',
        accent: '#00C8FF',
        placeholder: 'Ask Bozworth about architecture...',
    },
    {
        id: 'coxwell',
        name: 'COXWELL',
        title: 'CPO — Product Strategist',
        color: 'text-purple-400',
        borderColor: 'border-purple-400/40',
        bgGlow: 'shadow-[0_0_30px_rgba(168,85,247,0.15)]',
        avatar: '/moltberg.png',
        accent: '#A855F7',
        placeholder: 'Ask Coxwell about market fit...',
    },
];

export const AGENT_CONFIG_MAP: Record<AgentId, AgentConfig> = {
    moltberg: AGENTS[0],
    bozworth: AGENTS[1],
    coxwell: AGENTS[2],
};

/* ─── Component ─── */

export default function AgentChat() {
    const {
        chatMessages,
        chatAgent,
        chatLoading,
        setChatAgent,
        addChatMessage,
        setChatLoading,
    } = useMoltbergStore();

    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const activeConfig = AGENT_CONFIG_MAP[chatAgent];

    // Auto-scroll on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatMessages, chatLoading]);

    const sendMessage = useCallback(async () => {
        const text = input.trim();
        if (!text || chatLoading) return;

        const userMsg: ChatMessage = {
            id: `msg-${Date.now()}`,
            agent: chatAgent,
            role: 'user',
            content: text,
            timestamp: Date.now(),
        };
        addChatMessage(userMsg);
        setInput('');
        setChatLoading(true);

        try {
            // Build conversation history for this agent
            const agentHistory = [...chatMessages.filter(m => m.agent === chatAgent), userMsg];
            const apiMessages = agentHistory.map(m => ({
                role: m.role,
                content: m.content,
            }));

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agent: chatAgent, messages: apiMessages }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.reply) {
                    addChatMessage({
                        id: `msg-${Date.now()}-reply`,
                        agent: chatAgent,
                        role: 'assistant',
                        content: data.reply,
                        timestamp: Date.now(),
                    });
                } else {
                    addChatMessage({
                        id: `msg-${Date.now()}-err`,
                        agent: chatAgent,
                        role: 'assistant',
                        content: '⚠ Agent temporarily offline. Try again.',
                        timestamp: Date.now(),
                    });
                }
            } else {
                addChatMessage({
                    id: `msg-${Date.now()}-err`,
                    agent: chatAgent,
                    role: 'assistant',
                    content: '⚠ Connection failed. Agent may be rate-limited.',
                    timestamp: Date.now(),
                });
            }
        } catch {
            addChatMessage({
                id: `msg-${Date.now()}-err`,
                agent: chatAgent,
                role: 'assistant',
                content: '⚠ Network error. Check your connection.',
                timestamp: Date.now(),
            });
        } finally {
            setChatLoading(false);
        }
    }, [input, chatAgent, chatLoading, chatMessages, addChatMessage, setChatLoading]);

    const filteredMessages = chatMessages.filter(m => m.agent === chatAgent);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
        >
            <div className="flex items-center gap-2 mb-5">
                <div className="w-1.5 h-1.5 rounded-full bg-matrix animate-pulse" />
                <h2 className="font-mono text-xs text-matrix tracking-[0.2em] uppercase font-semibold">
                    Agent Tribunal — Live Chat
                </h2>
            </div>

            <div className={`glass-card overflow-hidden ${activeConfig.bgGlow} transition-shadow duration-500`}>
                {/* Agent Tabs */}
                <div className="flex border-b border-terminal-border/50">
                    {AGENTS.map((agent) => {
                        const isActive = chatAgent === agent.id;
                        const agentMsgs = chatMessages.filter(m => m.agent === agent.id && m.role === 'assistant').length;
                        return (
                            <button
                                key={agent.id}
                                onClick={() => setChatAgent(agent.id)}
                                className={`
                                    flex-1 px-4 py-3.5 font-mono text-[11px] uppercase tracking-wider transition-all duration-300
                                    flex items-center justify-center gap-2 relative
                                    ${isActive
                                        ? `${agent.color} bg-white/[0.03]`
                                        : 'text-gray-600 hover:text-gray-400 hover:bg-white/[0.02]'
                                    }
                                `}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'animate-pulse' : ''}`}
                                    style={{ backgroundColor: isActive ? agent.accent : '#333' }} />
                                <span className="hidden sm:inline">{agent.name}</span>
                                <span className="sm:hidden">{agent.name.slice(0, 3)}</span>
                                {agentMsgs > 0 && (
                                    <span className="text-[8px] text-gray-600">({agentMsgs})</span>
                                )}
                                {isActive && (
                                    <motion.div
                                        layoutId="agent-tab-indicator"
                                        className="absolute bottom-0 left-0 right-0 h-[2px]"
                                        style={{ backgroundColor: agent.accent }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Agent Info Banner */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={chatAgent}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.2 }}
                        className="px-4 py-3 border-b border-terminal-border/30 flex items-center gap-3"
                    >
                        <div className="relative w-8 h-8 flex-shrink-0">
                            <Image src={activeConfig.avatar} alt="" width={32} height={32} className="rounded-full" />
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-terminal-dark animate-pulse"
                                style={{ backgroundColor: activeConfig.accent }} />
                        </div>
                        <div>
                            <p className={`font-mono text-xs font-bold ${activeConfig.color}`}>
                                {activeConfig.name}
                            </p>
                            <p className="font-mono text-[9px] text-gray-600">{activeConfig.title}</p>
                        </div>
                        <div className="ml-auto flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-matrix animate-pulse" />
                            <span className="font-mono text-[9px] text-matrix">ONLINE</span>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Messages */}
                <div ref={scrollRef} className="h-64 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
                    {filteredMessages.length === 0 && !chatLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <span className="text-2xl mb-2 opacity-20">◈</span>
                            <p className="font-mono text-[11px] text-gray-600">
                                Start a conversation with {activeConfig.name}
                            </p>
                            <p className="font-mono text-[9px] text-gray-700 mt-1">
                                Ask about the protocol, evaluation criteria, or anything
                            </p>
                        </div>
                    )}

                    <AnimatePresence initial={false}>
                        {filteredMessages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`
                                        max-w-[80%] px-3.5 py-2.5 rounded-xl font-mono text-[11px] leading-relaxed
                                        ${msg.role === 'user'
                                            ? 'bg-white/[0.06] text-gray-300 rounded-br-sm'
                                            : `bg-white/[0.03] rounded-bl-sm border-l-2`
                                        }
                                    `}
                                    style={msg.role === 'assistant' ? { borderLeftColor: activeConfig.accent + '60' } : {}}
                                >
                                    {msg.role === 'assistant' && (
                                        <p className={`text-[9px] font-bold ${activeConfig.color} mb-1 uppercase tracking-wider`}>
                                            {activeConfig.name}
                                        </p>
                                    )}
                                    {msg.content}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Typing Indicator */}
                    {chatLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start"
                        >
                            <div className="px-3.5 py-2.5 rounded-xl rounded-bl-sm bg-white/[0.03] border-l-2"
                                style={{ borderLeftColor: activeConfig.accent + '60' }}>
                                <p className={`text-[9px] font-bold ${activeConfig.color} mb-1 uppercase tracking-wider`}>
                                    {activeConfig.name}
                                </p>
                                <div className="flex gap-1.5 py-1">
                                    {[0, 1, 2].map(i => (
                                        <motion.div
                                            key={i}
                                            className="w-1.5 h-1.5 rounded-full"
                                            style={{ backgroundColor: activeConfig.accent }}
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-terminal-border/30">
                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            placeholder={activeConfig.placeholder}
                            disabled={chatLoading}
                            className="terminal-input flex-1 px-3.5 py-2.5 rounded-lg text-xs disabled:opacity-40"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || chatLoading}
                            className={`
                                px-4 py-2.5 rounded-lg font-mono text-[10px] uppercase tracking-wider
                                border transition-all duration-300
                                ${activeConfig.borderColor}
                                ${activeConfig.color}
                                hover:bg-white/[0.05]
                                disabled:opacity-20 disabled:cursor-not-allowed
                            `}
                        >
                            ▶
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
