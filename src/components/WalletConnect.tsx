'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMoltbergStore } from '@/store/store';

export default function WalletConnect() {
    const { walletAddress, feePool, connectWallet, disconnectWallet, phase, tickFeePool } = useMoltbergStore();

    // Live-ticker for fee pool — ticks every 3s
    useEffect(() => {
        const id = setInterval(tickFeePool, 3000);
        return () => clearInterval(id);
    }, [tickFeePool]);



    const truncate = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="w-full"
        >
            <div className="glass-card glass-card-hover p-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-matrix animate-pulse" />
                    <h2 className="font-mono text-xs text-matrix tracking-[0.2em] uppercase font-semibold">
                        Treasury Node
                    </h2>
                </div>

                {/* Fee Pool — live ticker */}
                <div className="mb-4 p-3 rounded-lg bg-terminal-dark/50 border border-terminal-border relative overflow-hidden">
                    {/* Flicker overlay */}
                    <motion.div
                        className="absolute inset-0 pointer-events-none bg-matrix/[0.02]"
                        animate={{ opacity: [0, 0.04, 0] }}
                        transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 2.5 }}
                    />
                    <p className="font-mono text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                        Moltberg Fee Pool
                    </p>
                    <div className="flex items-baseline gap-1">
                        <motion.span
                            key={feePool.toFixed(2)}
                            initial={{ opacity: 0.6 }}
                            animate={{ opacity: 1 }}
                            className="font-mono text-xl font-bold text-lobster lobster-glow"
                        >
                            ${feePool.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </motion.span>
                        <span className="font-mono text-[10px] text-gray-600">MOLT</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="w-1 h-1 rounded-full bg-matrix animate-pulse" />
                        <span className="font-mono text-[9px] text-matrix/60">Live</span>
                    </div>
                </div>

                {/* Networks */}
                <div className="flex gap-2 mb-4">
                    <div className="flex-1 p-2 rounded-lg bg-terminal-dark/30 border border-terminal-border/50 text-center">
                        <p className="font-mono text-[9px] text-gray-600 mb-0.5">Primary Network</p>
                        <p className="font-mono text-[11px] text-blue-400">Base Chain (L2)</p>
                    </div>
                    <div className="flex-1 p-2 rounded-lg bg-terminal-dark/30 border border-terminal-border/50 text-center">
                        <p className="font-mono text-[9px] text-gray-600 mb-0.5">Asset Type</p>
                        <p className="font-mono text-[11px] text-matrix">ETH</p>
                    </div>
                </div>

                {/* Wallet */}
                {walletAddress ? (
                    <div className="space-y-3">
                        <div className="p-2.5 rounded-lg bg-matrix/5 border border-matrix/20">
                            <p className="font-mono text-[10px] text-gray-500 mb-0.5">Connected</p>
                            <p className="font-mono text-xs text-matrix">{truncate(walletAddress)}</p>
                        </div>
                        <button
                            onClick={disconnectWallet}
                            className="w-full py-2.5 px-4 rounded-lg border border-terminal-border
                font-mono text-[11px] text-gray-400 uppercase tracking-wider
                hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/5
                transition-all duration-300"
                        >
                            Disconnect
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={connectWallet}
                        className="submit-btn w-full text-[11px] !py-3 !border-matrix/50 !text-matrix
              hover:!border-matrix hover:!bg-matrix/10
              hover:!shadow-[0_0_20px_rgba(0,255,65,0.2)]"
                    >
                        ◈ Connect Wallet
                    </button>
                )}
            </div>
        </motion.div>
    );
}
