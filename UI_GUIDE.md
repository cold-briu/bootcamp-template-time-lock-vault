# UI Setup Guide

A step-by-step guide to building a minimal web3 UI for the Time-Lock Vault using Next.js, TypeScript, Tailwind CSS, and Viem.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Scaffolding](#project-scaffolding)
3. [Dependencies Installation](#dependencies-installation)
4. [Template Cleanup](#template-cleanup)
5. [ABI Import](#abi-import)
6. [Viem Client Setup](#viem-client-setup)
7. [Minimal UI Implementation](#minimal-ui-implementation)
8. [Build and Run](#build-and-run)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js & npm
- Deployed TimeLockVaultFactory contract address
- Celo Alfajores testnet account with test CELO
- Browser wallet (MetaMask, Valora, etc.)

---

## 1. Project Scaffolding

Create a new Next.js project with TypeScript, Tailwind CSS, and ESLint:

```bash
npx create-next-app@latest ui-time-lock-vault --ts --tailwind --eslint --yes
cd ui-time-lock-vault
```

---

## 2. Dependencies Installation

Install Viem for blockchain interactions and additional TypeScript types:

```bash
npm install viem
npm install -D @types/node
```

---

## 3. Template Cleanup

Remove default template files to start with a clean slate:

```bash
rm -rf src/app/favicon.ico src/app/globals.css src/app/page.tsx
```

---

## 4. ABI Import

Create the ABI directory and copy the contract ABI from your Foundry build:

```bash
mkdir abi
cp ../time-lock-vault/out/TimeLockVaultFactory.sol/TimeLockVaultFactory.json abi/
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

## 6. Minimal UI Implementation

Create the main UI component with wallet connection, vault creation, and vault fetching:

### Create `src/pages/index.tsx`

```tsx
"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
// Minimal web3 UI: disables 'no-explicit-any' for ABI and contract data rendering.
// Remove this if you want strict typing throughout.
import { useState, useRef, useEffect } from 'react'
import abiJson from '../../abi/TimeLockVaultFactory.json'
import type { Abi } from 'viem'

const FACTORY_ADDRESS = '0xYourFactoryAddress' // Replace with your deployed factory address
const abi = abiJson as unknown as Abi

export default function Home() {
  const [account, setAccount] = useState<string>()
  const [vaultId, setVaultId] = useState<string>('0')
  const [vault, setVault] = useState<unknown>(null)

  // Refs to hold viem clients, only set on client
  const publicClient = useRef<any>(null)
  const walletClient = useRef<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Dynamic import to avoid SSR
      import('../lib/viem').then(({ publicClient: pc, walletClient: wc }) => {
        publicClient.current = pc
        walletClient.current = wc
      })
    }
  }, [])

  // Connect wallet
  async function onConnect() {
    if (!walletClient.current) return
    const addresses = await walletClient.current.requestAddresses()
    setAccount(addresses[0])
  }

  // Create vault (1 CELO locked for 60 seconds)
  async function onCreate() {
    if (!account || !walletClient.current) return
    await walletClient.current.writeContract({
      address: FACTORY_ADDRESS as `0x${string}`,
      abi,
      functionName: 'createVaultCelo',
      args: [Math.floor(Date.now() / 1000 + 60)],
      value: BigInt('1000000000000000000'), // 1 CELO in wei
      account: account as `0x${string}`,
    })
  }

  // Fetch vault by id
  async function onFetch() {
    if (!publicClient.current) return
    const v = await publicClient.current.readContract({
      address: FACTORY_ADDRESS as `0x${string}`,
      abi,
      functionName: 'vaults',
      args: [BigInt(vaultId)],
    })
    setVault(v)
  }

  // No SSR - only render on client
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <div className="p-6 space-y-4">
      <button onClick={onConnect} className="btn">Connect Wallet</button>
      {account && <p>Account: {account}</p>}

      <button onClick={onCreate} className="btn">Lock 1 CELO for 1 min</button>

      <div className="flex space-x-2">
        <input
          type="number"
          value={vaultId}
          onChange={e => setVaultId(e.target.value)}
          className="input"
          placeholder="vault id"
        />
        <button onClick={onFetch} className="btn">Get Vault</button>
      </div>

      {(vault && (
        <pre className="bg-gray-100 p-2">{JSON.stringify(vault, null, 2)}</pre>
      )) as any}
    </div>
  )
}
```

---

## 7. Build and Run

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

## 8. Troubleshooting

### Common Issues and Solutions

#### BigInt Errors
If you see BigInt errors, ensure your `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "target": "ES2020"
  }
}
```

#### ESLint Errors
The code uses `@typescript-eslint/no-explicit-any` disable for minimal web3 UI compatibility. Remove the disable if you want strict typing.

#### SSR Errors
The UI prevents SSR by:
- Using `"use client"` directive
- Checking `typeof window !== 'undefined'`
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

## 9. Customization

### Styling
- Tailwind classes (`btn`, `input`) assume default styles
- Customize in `globals.css` or add custom Tailwind components

### Functionality
- Modify vault creation parameters (amount, lock time)
- Add error handling and loading states
- Implement additional contract functions
- Add transaction status tracking

### Deployment
- Update `FACTORY_ADDRESS` for mainnet deployment
- Configure environment variables for different networks
- Add proper error boundaries and fallbacks

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Viem Documentation](https://viem.sh/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Celo Documentation](https://docs.celo.org/) 