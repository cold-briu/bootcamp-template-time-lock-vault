"use client";
import { useState, useRef, useEffect } from "react";
import abiJson from "../../abi/TimeLockVaultFactory.json";
import type { Abi } from "viem";
import VaultCreation from "./VaultCreation";
import VaultList from "./VaultList";

const abi = abiJson.abi as Abi;

export default function Home() {
    const [isClient, setIsClient] = useState(false);
    const [account, setAccount] = useState<string>();
    const [balance, setBalance] = useState<string>("0");
    const walletClient = useRef<any>(null);
    const publicClient = useRef<any>(null);

    useEffect(() => {
        setIsClient(true);
        // Dynamic import to avoid SSR
        import("../lib/viem").then(({ walletClient: wc, publicClient: pc }) => {
            walletClient.current = wc;
            publicClient.current = pc;
        });
    }, []);

    // Show loading state until client-side hydration is complete
    if (!isClient) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="max-w-md w-full mx-auto p-6">
                    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
                        <div className="animate-pulse">
                            <div className="h-12 bg-gray-200 rounded-lg mb-4"></div>
                            <div className="text-center text-gray-500">Loading...</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Connect wallet function
    async function onConnect() {
        if (!walletClient.current) return;
        const addresses = await walletClient.current.requestAddresses();
        setAccount(addresses[0]);
        await fetchBalance(addresses[0]);
    }

    // Balance fetching function
    async function fetchBalance(address: string) {
        if (!publicClient.current) return;
        const balanceWei = await publicClient.current.getBalance({ address });
        const balanceCelo = Number(balanceWei) / 1e18;
        setBalance(balanceCelo.toFixed(4));
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
                    {/* Header */}
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Web3 Wallet</h1>
                        <p className="text-gray-600">Connect your wallet to get started</p>
                    </div>

                    {/* Wallet Connection */}
                    <div className="space-y-3">
                        <button
                            onClick={onConnect}
                            disabled={!!account}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium flex items-center justify-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>{account ? "Wallet Connected" : "Connect Wallet"}</span>
                        </button>
                    </div>

                    {/* Connection Status */}
                    {account ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-sm text-green-800 font-medium">Connected</p>
                            <p className="text-xs text-green-600 font-mono break-all">{account}</p>
                        </div>
                    ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p className="text-sm text-gray-800 font-medium">Not Connected</p>
                            <p className="text-xs text-gray-600">Click the button above to connect your wallet</p>
                        </div>
                    )}

                    {/* Balance Display */}
                    {account && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800 font-medium">Account Balance</p>
                            <p className="text-lg text-blue-900 font-bold">{balance} CELO</p>
                        </div>
                    )}

                    {/* Vault Creation Component */}
                    {account && (
                        <VaultCreation
                            account={account}
                            walletClient={walletClient.current}
                            publicClient={publicClient.current}
                            balance={balance}
                        />
                    )}

                    {/* Vault List Component */}
                    {account && (
                        <VaultList
                            account={account}
                            publicClient={publicClient.current}
                        />
                    )}
                </div>
            </div>
        </div>
    );
} 