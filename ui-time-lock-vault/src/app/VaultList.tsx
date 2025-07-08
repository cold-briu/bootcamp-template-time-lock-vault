"use client";
import { useState, useRef, useEffect } from 'react';
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

export default function VaultList({ account, publicClient, walletClient }: {
    account: string | undefined,
    publicClient: any,
    walletClient: any
}) {
    const [vaults, setVaults] = useState<Vault[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [withdrawingVaultId, setWithdrawingVaultId] = useState<number | null>(null);

    async function fetchVaults() {
        if (!publicClient) return;

        // Prevent multiple simultaneous fetches
        if (isLoading) return;

        setIsLoading(true);
        setError('');
        setVaults([]); // Clear previous vaults

        try {
            let index = 0;
            const newVaults: Vault[] = [];

            // Keep fetching vaults until we hit an empty one
            while (true) {
                const vault = await publicClient.readContract({
                    address: '0xa8C5B6f5f330E34e33F3d22B3Fe834e2bEFEa095', // Replace with your deployed contract address
                    abi: abi,
                    functionName: 'vaults',
                    args: [BigInt(index)]
                });

                // Check if this vault is empty (owner is zero address)
                // Note: Contract returns array structure: [owner, zeroAddress, amount, unlockTime, isWithdrawn]
                if (!vault || !vault[0] || vault[0] === '0x0000000000000000000000000000000000000000') {
                    break; // Stop fetching, we've reached the end
                }

                // Add vault to our local array
                newVaults.push({
                    id: index, // Use index as vault ID
                    owner: vault[0], // owner is at index 0
                    amount: vault[2], // amount is at index 2
                    unlockTime: vault[3], // unlockTime is at index 3
                    isWithdrawn: vault[4] || false // isWithdrawn is at index 4
                });

                index++;
            }

            // Set all vaults at once to avoid multiple re-renders
            setVaults(newVaults);
        } catch (err) {
            console.error('Error fetching vaults:', err);
            setError('Failed to fetch vaults. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    async function withdrawVault(vaultId: number) {
        if (!walletClient || !account) return;

        setWithdrawingVaultId(vaultId);
        try {
            const { request } = await publicClient.simulateContract({
                address: '0xa8C5B6f5f330E34e33F3d22B3Fe834e2bEFEa095', // Your contract address
                abi: abi,
                functionName: 'withdraw',
                args: [BigInt(vaultId)],
                account: account,
            });

            const hash = await walletClient.writeContract(request);
            await publicClient.waitForTransactionReceipt({ hash });

            // Refresh vault list to show updated withdrawal status
            await fetchVaults();
            alert('Withdrawal successful!');
        } catch (error) {
            console.error('Withdrawal error:', error);
            alert('Withdrawal failed. Please try again.');
        } finally {
            setWithdrawingVaultId(null);
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
                            <div key={`${vault.id}-${vault.owner}`} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
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

                                {/* Withdraw Button */}
                                {vault.owner.toLowerCase() === account.toLowerCase() &&
                                    !vault.isWithdrawn &&
                                    isVaultUnlocked(vault.unlockTime) && (
                                        <button
                                            onClick={() => withdrawVault(vault.id)}
                                            disabled={withdrawingVaultId === vault.id}
                                            className="mt-3 w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                        >
                                            {withdrawingVaultId === vault.id ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    <span>Withdrawing...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                    </svg>
                                                    <span>Withdraw</span>
                                                </>
                                            )}
                                        </button>
                                    )}
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