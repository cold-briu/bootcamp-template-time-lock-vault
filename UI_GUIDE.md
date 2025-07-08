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
8. [Minimal UI Implementation](#minimal-ui-implementation)
9. [Build and Run](#build-and-run)
10. [Troubleshooting](#troubleshooting)

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

## 5. Viem Client Setup

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

## 8. Minimal UI Implementation

Create the main UI component with wallet connection by following these sub-steps:

### 8.1 Create the Main Component File

Create `src/pages/index.tsx` with the basic component structure:

```tsx
"use client";
import { useState, useRef, useEffect } from 'react'
import abiJson from '../../abi/TimeLockVaultFactory.json'
import type { Abi } from 'viem'

const abi = abiJson as unknown as Abi

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

Add the connect wallet button with icon:

```tsx
{/* Wallet Connection */}
<div className="space-y-3">
    <button 
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
    >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>Connect Wallet</span>
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

### 8.7 Complete Component Structure

Here's the complete component with all elements combined:

```tsx
"use client";
import { useState, useRef, useEffect } from 'react'
import abiJson from '../../abi/TimeLockVaultFactory.json'
import type { Abi } from 'viem'

const abi = abiJson as unknown as Abi

export default function Home() {
    const [account, setAccount] = useState<string>()
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

    // Connect wallet
    async function onConnect() {
        if (!walletClient.current) return
        const addresses = await walletClient.current.requestAddresses()
        setAccount(addresses[0])
    }

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
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>Connect Wallet</span>
                        </button>
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
                    </div>
                </div>
            </div>
        </div>
    )
}
```

---

## 9. Build and Run

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

## 10. Troubleshooting

### Common Issues and Solutions

#### Hydration Errors
**Problem**: "Hydration failed because the server rendered HTML didn't match the client"

**Solution**: Use the `isClient` state approach instead of `typeof window` checks:
```tsx
const [isClient, setIsClient] = useState(false)

useEffect(() => {
    setIsClient(true)
    // ... rest of initialization
}, [])

if (!isClient) {
    return <LoadingSkeleton />
}
```

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

## 11. UI Features

### Modern Design Elements
- **Gradient Background**: Beautiful blue-to-indigo gradient
- **Card Layout**: Centered white card with shadow and rounded corners
- **Interactive Buttons**: Hover effects, focus states, and disabled states
- **Icons**: SVG icons for better user experience
- **Loading States**: Animated skeleton loading
- **Responsive Design**: Mobile-friendly layout

### Custom Components
- **Loading Skeleton**: Matches the final layout structure

### User Experience
- **Visual Feedback**: Green success state for connected wallet
- **Clean Typography**: Proper heading hierarchy and font weights
- **Accessibility**: Focus states and proper contrast ratios

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Viem Documentation](https://viem.sh/)
- [Celo Documentation](https://docs.celo.org/) 