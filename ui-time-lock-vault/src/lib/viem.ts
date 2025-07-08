declare global {
    interface Window {
        ethereum?: unknown;
    }
}

import { createPublicClient, createWalletClient, custom } from 'viem'
import { celoAlfajores } from 'viem/chains'

function getTransport() {
    if (typeof window === 'undefined') {
        throw new Error('No window.ethereum: must be run in browser');
    }
    if (!window.ethereum) {
        throw new Error('No injected wallet found');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return custom(window.ethereum as any);
}

export const publicClient = createPublicClient({
    chain: celoAlfajores,
    transport: getTransport(),
})

export const walletClient = createWalletClient({
    chain: celoAlfajores,
    transport: getTransport(),
}) 