"use client";
import { useState, useEffect } from 'react';
import abiJson from '../../abi/TimeLockVaultFactory.json';
import type { Abi } from 'viem';

const abi = abiJson.abi as Abi;

interface Vault {
    id: number;
    owner: string;
    amount: bigint;
    unlockTime: bigint;
    isWithdrawn: boolean;
}

export default function VaultList({ account, publicClient }: {
    account: string | undefined,
    publicClient: any
}) {
    const [vaults, setVaults] = useState<Vault[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');

    async function fetchVaults() {
        if (!publicClient) return;
        setVaults([]); // Clear previous vaults
        setIsLoading(true);
        setError('');

        try {
            let index = 0;

            // Keep fetching vaults until we hit an empty one
            while (true) {
                const vault = await publicClient.readContract({
                    address: '0xa8C5B6f5f330E34e33F3d22B3Fe834e2bEFEa095', // Your contract address
                    abi: abi,
                    functionName: 'vaults',
                    args: [BigInt(index)]
                });

                // Check if this vault is empty (owner is zero address)
                // Note: Contract returns array structure: [owner, zeroAddress, amount, unlockTime, isWithdrawn]
                if (!vault || !vault[0] || vault[0] === '0x0000000000000000000000000000000000000000') {
                    break; // Stop fetching, we've reached the end
                }

                // Add valid vault to our list progressively
                setVaults(prev => [...prev, {
                    id: index,
                    owner: vault[0], // owner is at index 0
                    amount: vault[2], // amount is at index 2
                    unlockTime: vault[3], // unlockTime is at index 3
                    isWithdrawn: vault[4] || false // isWithdrawn is at index 4
                }]);

                index++;
                // Wait a tick to allow UI to update
                await new Promise(res => setTimeout(res, 0));
            }
        } catch (err) {
            console.error('Error fetching vaults:', err);
            setError('Failed to fetch vaults. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (account && publicClient) {
            fetchVaults();
        }
    }, [account, publicClient]);

    // Helper function to format address display
    function formatAddress(address: string) {
        if (!address || address === '0x0000000000000000000000000000000000000000') {
            return 'No Owner';
        }
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    // Helper function to format CELO amount
    function formatAmount(amount: bigint) {
        return Number(amount) / 1e18;
    }

    // Helper function to check if vault is unlocked
    function isVaultUnlocked(unlockTime: bigint) {
        return Date.now() / 1000 > Number(unlockTime);
    }

    // Helper function to format unlock time
    function formatUnlockTime(unlockTime: bigint) {
        const date = new Date(Number(unlockTime) * 1000);
        return date.toLocaleString();
    }

    if (!account) return null;

    return (
        <div className="space-y-4">
            <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Time-Lock Vaults</h2>
                    <button
                        onClick={fetchVaults}
                        disabled={isLoading}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Loading...' : 'Refresh'}
                    </button>
                </div>

                {/* Loading State */}
                {isLoading && vaults.length === 0 && (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="animate-pulse bg-gray-100 rounded-lg p-4">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                {/* Vaults List */}
                {vaults.length > 0 && (
                    <div className="space-y-3">
                        {vaults.map((vault) => (
                            <div key={vault.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-medium text-gray-900">Vault #{vault.id}</h3>
                                    <span className={`px-2 py-1 text-xs rounded-full ${vault.isWithdrawn
                                            ? 'bg-gray-100 text-gray-600'
                                            : isVaultUnlocked(vault.unlockTime)
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {vault.isWithdrawn ? 'Withdrawn' : isVaultUnlocked(vault.unlockTime) ? 'Unlocked' : 'Locked'}
                                    </span>
                                </div>

                                <div className="space-y-1 text-sm">
                                    <p className="text-gray-600">
                                        <span className="font-medium">Owner:</span> {formatAddress(vault.owner)}
                                        {vault.owner.toLowerCase() === account.toLowerCase() && (
                                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">You</span>
                                        )}
                                    </p>
                                    <p className="text-gray-600">
                                        <span className="font-medium">Amount:</span> {formatAmount(vault.amount)} CELO
                                    </p>
                                    <p className="text-gray-600">
                                        <span className="font-medium">Unlocks:</span> {formatUnlockTime(vault.unlockTime)}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="text-center text-gray-500 text-sm py-2">Loading more vaults...</div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && vaults.length === 0 && !error && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                        <p className="text-gray-600">No vaults found. Create your first vault above!</p>
                    </div>
                )}
            </div>
        </div>
    );
} 