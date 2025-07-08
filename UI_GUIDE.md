# UI Setup Guide

A step-by-step guide to building a minimal web3 UI for wallet connection using Next.js, TypeScript, Tailwind CSS, and Viem.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Scaffolding](#project-scaffolding)
3. [Template Cleanup](#template-cleanup)
4. [ABI Import](#abi-import)
5. [Dependencies Installation](#dependencies-installation)
6. [Viem Client Setup](#viem-client-setup)
7. [Hello World Test Page](#hello-world-test-page)
8. [Wallet Connection Setup](#wallet-connection-setup)
9. [Vault Creation](#vault-creation)
10. [Build and Run](#build-and-run)

---

## Prerequisites

- Node.js & npm
- Deployed TimeLockVaultFactory contract address
- Celo Alfajores testnet account
- Browser wallet (MetaMask, Valora, etc.)

---

## 1. Project Scaffolding

Create a new Next.js project with TypeScript, Tailwind CSS, and ESLint:

```bash
npx create-next-app@latest ui-time-lock-vault --ts --tailwind --eslint --yes
cd ui-time-lock-vault
```

---

## 2. Template Cleanup

Remove default template files to start with a clean slate, but keep globals.css:

```bash
rm -rf src/app/favicon.ico src/app/page.tsx
```

---

## 3. ABI Import

Create the ABI directory and copy the contract ABI from your Foundry build:

```bash
mkdir abi
cp ../time-lock-vault/out/TimeLockVaultFactory.sol/TimeLockVaultFactory.json abi/
```

---

## 4. Dependencies Installation

Install Viem for blockchain interactions and additional TypeScript types:

```bash
npm install viem
npm install -D @types/node
```

---

## 6. Viem Client Setup

Create the Viem client configuration for Celo Alfajores:

### Create `src/lib/viem.ts`

```ts
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
```


---

## 7. Hello World Test Page

Before implementing the full web3 UI, let's create a simple "Hello World" page to verify that the basic Next.js setup is working correctly.

### Create `src/app/page.tsx`

Create a simple page to test the basic setup:

```tsx
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Hello World!</h1>
          <p className="text-gray-600 mb-6">Your Next.js app is working correctly.</p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 font-medium">✅ Setup Complete</p>
            <p className="text-xs text-green-600">Ready to build web3 features</p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Test the Setup

Run the development server to verify everything is working:

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser. You should see:
- A centered "Hello World" message
- The same gradient background and card styling that will be used in the web3 UI
- A green success indicator showing the setup is complete

This step ensures that:
- Next.js is properly configured
- Tailwind CSS is working
- The basic styling approach is functional
- The development server can start without errors

Once you confirm this page renders correctly, you can proceed to the Minimal UI Implementation.

## 8. Wallet Connection Setup

Create the main UI component with wallet connection by following these sub-steps:

### 8.1 Create the Main Component File

Create `src/pages/index.tsx` with the basic component structure:

```tsx
"use client";
import { useState, useRef, useEffect } from 'react'
import abiJson from '../../abi/TimeLockVaultFactory.json'
import type { Abi } from 'viem'

const abi = abiJson.abi as Abi

export default function Home() {
    const [isClient, setIsClient] = useState(false)

    // Refs to hold viem clients, only set on client
    const walletClient = useRef<any>(null)

    useEffect(() => {
        setIsClient(true)
        // Dynamic import to avoid SSR
        import('../lib/viem').then(({ walletClient: wc }) => {
            walletClient.current = wc
        })
    }, [])

    // Component will be built in sub-steps below
    return <div>Loading...</div>
}
```

### 8.2 Add Loading State Component

Add the loading skeleton that shows during client-side hydration:

```tsx
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
    )
}
```

### 8.3 Add Main Container Layout and Header

Add the main container with gradient background, centered card, and header section:

```tsx
return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Web3 Wallet</h1>
                    <p className="text-gray-600">Connect your wallet to get started</p>
                </div>
                
                {/* Content will be added in next sub-steps */}
            </div>
        </div>
    </div>
)
```

### 8.4 Add Wallet Connection Button

Add the connect wallet button with icon, disabled state when connected, and dynamic label:

```tsx
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
        <span>{account ? 'Wallet Connected' : 'Connect Wallet'}</span>
    </button>
</div>
```

### 8.5 Add Connection Status Display

Add the connection status that shows both connected and not connected states:

```tsx
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
```

### 8.6 Add Wallet Connection Logic

Add the account state and connect wallet functionality:

```tsx
// Add account state
const [account, setAccount] = useState<string>()

// Connect wallet function
async function onConnect() {
    if (!walletClient.current) return
    const addresses = await walletClient.current.requestAddresses()
    setAccount(addresses[0])
}

// Add onClick handler to the button
<button 
    onClick={onConnect} 
    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
>
```

### 8.7 Add Account Balance Display

Add the balance display that shows the user's CELO balance when connected:

```tsx
// Add balance state and fetch function
const [balance, setBalance] = useState<string>('0')

// Balance fetching function
async function fetchBalance(address: string) {
    if (!publicClient.current) return
    const balanceWei = await publicClient.current.getBalance({ address })
    const balanceCelo = Number(balanceWei) / 1e18
    setBalance(balanceCelo.toFixed(4))
}

// Update connect function to fetch balance
async function onConnect() {
    if (!walletClient.current) return
    const addresses = await walletClient.current.requestAddresses()
    setAccount(addresses[0])
    await fetchBalance(addresses[0])
}

// Add balance display after connection status
{/* Balance Display */}
{account && (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800 font-medium">Account Balance</p>
        <p className="text-lg text-blue-900 font-bold">{balance} CELO</p>
    </div>
)}
```

---

## 9. Vault Creation (as a Component)

Now that we have wallet connection working, let's add the vault creation functionality as a separate component. This will allow users to create time-locked vaults with CELO and keep your main page clean and modular.

### 9.1 Create the VaultCreation Component File

Create a new file at `src/app/VaultCreation.tsx`:

```tsx
"use client";
import { useState, useRef, useEffect } from 'react';
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
        address: '0x...', // Replace with your deployed contract address
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
```

### 9.2 Import and Use the VaultCreation Component in the Main Page

In your main page (e.g., `src/app/page.tsx`), import and use the new component:

```tsx
import VaultCreation from "./VaultCreation";
// ... inside your Home component's return, after wallet connection ...
<VaultCreation account={account} walletClient={walletClient.current} publicClient={publicClient.current} balance={balance} />
```

### 9.3 Remove Vault Creation Logic from Main Page

Remove the vault creation state, logic, and UI from your main page, as it now lives in the `VaultCreation` component.

---

## 10. Build and Run

### Update TypeScript Configuration

Ensure your `tsconfig.json` targets ES2020 or higher for BigInt support:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    // ... other options
  }
}
```

### Build the Application

```bash
npm run build
```

### Start Development Server

```bash
npm run dev
```

---

## 11. Troubleshooting

#### ESLint Errors
The code uses `@typescript-eslint/no-explicit-any` disable for minimal web3 UI compatibility. Remove the disable if you want strict typing.

#### SSR Errors
The UI prevents SSR by:
- Using `"use client"` directive
- Using `isClient` state for hydration safety
- Using dynamic imports for viem clients

#### Wallet Connection Issues
- Ensure your browser has a wallet extension installed
- Make sure the wallet is connected to Celo Alfajores testnet
- Check that your account has test CELO

#### Contract Interaction Issues
- Verify the `FACTORY_ADDRESS` is correct
- Ensure the ABI file is properly imported
- Check that your account has sufficient CELO for transactions

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Viem Documentation](https://viem.sh/)
- [Celo Documentation](https://docs.celo.org/) 