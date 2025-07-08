"use client";
import { useState } from 'react';
import abiJson from '../../abi/TimeLockVaultFactory.json';
import type { Abi } from 'viem';

const abi = abiJson.abi as Abi;

export default function VaultCreation({ account, walletClient, publicClient, balance }: {
    account: string | undefined,
    walletClient: any,
    publicClient: any,
    balance: string
}) {
    const [vaultAmount, setVaultAmount] = useState<string>('0.01');
    const [timeUnits, setTimeUnits] = useState({ seconds: 0, minutes: 0, hours: 0, days: 0 });
    const [isCreating, setIsCreating] = useState(false);
    const [vaultId, setVaultId] = useState<string>('');

    function getTotalSeconds() {
        return timeUnits.days * 86400 + timeUnits.hours * 3600 + timeUnits.minutes * 60 + timeUnits.seconds;
    }

    async function createVault() {
        if (!walletClient || !account || !abi) return;
        const totalSeconds = getTotalSeconds();
        if (totalSeconds === 0) {
            alert('Please set a lock duration');
            return;
        }
        const amount = parseFloat(vaultAmount);
        if (amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        if (amount > parseFloat(balance)) {
            alert('Insufficient balance');
            return;
        }
        setIsCreating(true);
        try {
            const unlockTime = Math.floor(Date.now() / 1000) + totalSeconds;
            const { request } = await publicClient.simulateContract({
                address: '0xa8C5B6f5f330E34e33F3d22B3Fe834e2bEFEa095', // Updated contract address
                abi: abi,
                functionName: 'createVaultCelo',
                args: [BigInt(unlockTime)],
                value: BigInt(Math.floor(amount * 1e18)),
                account: account,
            });
            const hash = await walletClient.writeContract(request);
            await publicClient.waitForTransactionReceipt({ hash });
            setVaultId('0'); // For now, just set to 0
            alert('Vault created successfully!');
        } catch (error) {
            console.error('Error creating vault:', error);
            alert('Failed to create vault. Please try again.');
        } finally {
            setIsCreating(false);
        }
    }

    if (!account) return null;

    return (
        <div className="space-y-4">
            <div className="border-t pt-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Create Time-Lock Vault</h2>
                {/* Amount Input */}
                <div className="space-y-2 mb-4">
                    <label className="block text-sm font-medium text-gray-900">CELO Amount to Lock</label>
                    <input
                        type="number"
                        value={vaultAmount}
                        onChange={(e) => setVaultAmount(e.target.value)}
                        min="0.001"
                        step="0.001"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                        placeholder="0.01"
                    />
                    <p className="text-xs text-gray-500">Available: {balance} CELO</p>
                </div>
                {/* Time Duration Controls */}
                <div className="space-y-3 mb-4">
                    <label className="block text-sm font-medium text-gray-900">Lock Duration</label>
                    <div className="grid grid-cols-2 gap-3">
                        {/* Days */}
                        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                            <span className="text-sm text-gray-700 font-medium">Days</span>
                            <div className="flex items-center space-x-1">
                                <button onClick={() => setTimeUnits(prev => ({ ...prev, days: Math.max(0, prev.days - 1) }))} className="w-6 h-6 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm font-bold">-</button>
                                <span className="w-6 text-center font-bold text-gray-900">{timeUnits.days}</span>
                                <button onClick={() => setTimeUnits(prev => ({ ...prev, days: prev.days + 1 }))} className="w-6 h-6 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm font-bold">+</button>
                            </div>
                        </div>
                        {/* Hours */}
                        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                            <span className="text-sm text-gray-700 font-medium">Hours</span>
                            <div className="flex items-center space-x-1">
                                <button onClick={() => setTimeUnits(prev => ({ ...prev, hours: Math.max(0, prev.hours - 1) }))} className="w-6 h-6 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm font-bold">-</button>
                                <span className="w-6 text-center font-bold text-gray-900">{timeUnits.hours}</span>
                                <button onClick={() => setTimeUnits(prev => ({ ...prev, hours: prev.hours + 1 }))} className="w-6 h-6 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm font-bold">+</button>
                            </div>
                        </div>
                        {/* Minutes */}
                        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                            <span className="text-sm text-gray-700 font-medium">Minutes</span>
                            <div className="flex items-center space-x-1">
                                <button onClick={() => setTimeUnits(prev => ({ ...prev, minutes: Math.max(0, prev.minutes - 1) }))} className="w-6 h-6 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm font-bold">-</button>
                                <span className="w-6 text-center font-bold text-gray-900">{timeUnits.minutes}</span>
                                <button onClick={() => setTimeUnits(prev => ({ ...prev, minutes: prev.minutes + 1 }))} className="w-6 h-6 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm font-bold">+</button>
                            </div>
                        </div>
                        {/* Seconds */}
                        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                            <span className="text-sm text-gray-700 font-medium">Seconds</span>
                            <div className="flex items-center space-x-1">
                                <button onClick={() => setTimeUnits(prev => ({ ...prev, seconds: Math.max(0, prev.seconds - 1) }))} className="w-6 h-6 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm font-bold">-</button>
                                <span className="w-6 text-center font-bold text-gray-900">{timeUnits.seconds}</span>
                                <button onClick={() => setTimeUnits(prev => ({ ...prev, seconds: prev.seconds + 1 }))} className="w-6 h-6 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm font-bold">+</button>
                            </div>
                        </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <p className="text-sm text-blue-800 font-medium">Total Duration:</p>
                        <p className="text-sm font-bold text-blue-900">{timeUnits.days}d {timeUnits.hours}h {timeUnits.minutes}m {timeUnits.seconds}s</p>
                    </div>
                </div>
                {/* Create Vault Button */}
                <button
                    onClick={createVault}
                    disabled={isCreating || !account || Number(vaultAmount) <= 0 || getTotalSeconds() === 0}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                    {isCreating ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Creating Vault...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span>Create Vault</span>
                        </>
                    )}
                </button>
                {/* Success Message */}
                {vaultId && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800 font-medium">✅ Vault Created Successfully!</p>
                        <p className="text-xs text-green-600">Vault ID: {vaultId}</p>
                        <p className="text-xs text-green-600">Amount: {vaultAmount} CELO</p>
                        <p className="text-xs text-green-600">Unlocks in: {timeUnits.days}d {timeUnits.hours}h {timeUnits.minutes}m {timeUnits.seconds}s</p>
                    </div>
                )}
            </div>
        </div>
    );
} 