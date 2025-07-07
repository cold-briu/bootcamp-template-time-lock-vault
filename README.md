# Time-Lock Vault on Celo

A step-by-step guide to building, testing, and deploying a time-lock vault smart contract on Celo using Foundry and Celo CLI.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Initialization](#project-initialization)
3. [Smart Contract Development](#smart-contract-development)
4. [Testing](#testing)
5. [Deployment Script Creation](#deployment-script-creation)
6. [Deployment](#deployment)
7. [Contract Interaction Examples](#contract-interaction-examples)
8. [CELO Vault Cast Interaction Examples](#celo-vault-cast-interaction-examples)
9. [Examples](#examples)
10. [Additional Resources](#additional-resources)
11. [Contributing & License](#contributing--license)

---

## Prerequisites

- Foundry CLI (forge, cast, anvil, chisel)
- Node.js & npm
- Celo CLI (`celocli`)
- Celo Alfajores testnet account (with test CELO)
- Access to https://alfajores-forno.celo-testnet.org

---

## 1. Project Initialization

#### Context
Set up a new Foundry project for your time-lock vault contract.

```bash
forge init time-lock-vault
cd time-lock-vault
rm -rf src test script
mkdir src test script
```

> **Pro Tip:** Clean up default directories to start with a fresh structure.

---

## 2. Install and Configure Tools

### 2.1 Install Foundry

#### Context
Install and configure Foundry CLI tools for contract development.

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
foundryup -i nightly
```

### 2.2 Install Celo CLI

#### Context
Install Celo command-line interface for interacting with the network.

```bash
npm install -g @celo/celocli
```

### 2.3 Configure Celo CLI

#### Context
Set your CLI node URL to Alfajores.

```bash
celocli config:set --node=https://alfajores-forno.celo-testnet.org
celocli config:get
```

### 2.4 Wallet Setup

#### Context
Create your wallet and set environment variables.

```bash
celocli account:new
```

Export your private key and address:

```bash
export YOUR_PRIVATE_KEY=<your_private_key>
export YOUR_ADDRESS=<your_address>
```

Encrypt and import your private key into Foundry's keystore:

```bash
cast wallet import my-wallet-time-lock --private-key $YOUR_PRIVATE_KEY
```

> **⚠️ Important:** Choose a secure password; Foundry will decrypt at runtime.

Create your `.env` file for public config:

```bash
# .env
CELO_ACCOUNT_ADDRESS=$YOUR_ADDRESS
CELO_NODE_URL=https://alfajores-forno.celo-testnet.org
RPC_URL=$CELO_NODE_URL
```

> **⚠️ Warning:** Never commit `.env`. Add `.env` to your `.gitignore`.

---

## 3. Smart Contract Development

#### Context
Develop the TimeLockVaultFactory smart contract. For detailed instructions, see the [Smart Contract Guide](SMART_CONTRACT_GUIDE.md).

- Step-by-step contract creation
- Complete contract code
- Function explanations
- Security features
- Data structures overview

---

## 4. Testing

#### Context
Test your contract using Foundry. For comprehensive testing instructions and examples, see the [Testing Guide](TESTING_GUIDE.md).

- Test environment setup
- Mock ERC-20 token creation
- Complete test suite with positive and negative test cases
- Foundry testing features explanation
- Gas testing and fuzzing examples
- Troubleshooting common test issues

To run the tests:

```bash
forge test
```

---

## 5. Deployment Script Creation

#### Context
Generate a Solidity deploy script to automate contract deployment.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/TimeLockVaultFactory.sol";

contract DeployFactoryScript is Script {
    function run() external {
        vm.startBroadcast();
        // Deploy the TimeLockVaultFactory contract, owner = msg.sender
        new TimeLockVaultFactory(address(0));
        vm.stopBroadcast();
    }
}
```

---

## 6. Deployment

#### Context
Deploy your contract to the Celo Alfajores testnet using Foundry.

```bash
forge script script/DeployFactory.s.sol:DeployFactoryScript \
  --rpc-url $RPC_URL \
  --broadcast \
  --private-key $PRIVATE_KEY
```

#### Verify Deployment

```bash
# Get deployment address
cast run script/DeployFactory.s.sol:DeployFactoryScript --rpc-url $RPC_URL --private-key $PRIVATE_KEY

# Interact with deployed contract
cast call $FACTORY_CONTRACT_ADDRESS "owner()" --rpc-url $RPC_URL
```

> **💡 Tip:** Make sure your account is funded with test CELO from the Alfajores faucet.

---

## 7. Contract Interaction Examples

### 7.1 Create CELO Vault

#### Context
Create a vault with 1 CELO locked for 1 day.

```bash
cast send $FACTORY_CONTRACT_ADDRESS "createVaultCelo(uint256)" $(($(date +%s) + 86400)) --value 1ether --rpc-url $RPC_URL --private-key $PRIVATE_KEY
```

### 7.2 Create ERC-20 Vault

#### Context
Approve tokens and create a vault with ERC-20 tokens.

```bash
# First approve tokens
cast send $TOKEN_ADDRESS "approve(address,uint256)" $FACTORY_CONTRACT_ADDRESS 1000000000000000000000 --rpc-url $RPC_URL --private-key $PRIVATE_KEY

# Create vault
cast send $FACTORY_CONTRACT_ADDRESS "createVaultERC20(address,uint256,uint256)" $TOKEN_ADDRESS 1000000000000000000000 $(($(date +%s) + 86400)) --rpc-url $RPC_URL --private-key $PRIVATE_KEY
```

### 7.3 Withdraw from Vault

#### Context
Withdraw from a vault after the unlock time.

```bash
cast send $FACTORY_CONTRACT_ADDRESS "withdraw(uint256)" 0 --rpc-url $RPC_URL --private-key $PRIVATE_KEY
```

---

## 8. CELO Vault Cast Interaction Examples

### 8.1 Create a CELO Vault

#### Context
Create a vault with 0.01 CELO locked for 1 day.

```bash
cast send $FACTORY_CONTRACT_ADDRESS "createVaultCelo(uint256)" $(($(date +%s) + 86400)) --value 0.01ether --rpc-url $RPC_URL --private-key $PRIVATE_KEY
```

### 8.2 Check Vault Details

#### Context
Get and parse vault information for readability.

```bash
# Get vault information (creator, token, amount, unlock time, withdrawn status)
cast call $FACTORY_CONTRACT_ADDRESS "vaults(uint256)" 0 --rpc-url $RPC_URL

# Parse vault data for readability
echo "Vault 0 Details:" && \
echo "Creator: 0x$(cast call $FACTORY_CONTRACT_ADDRESS "vaults(uint256)" 0 --rpc-url $RPC_URL | cut -c3-66)" && \
echo "Token: 0x$(cast call $FACTORY_CONTRACT_ADDRESS "vaults(uint256)" 0 --rpc-url $RPC_URL | cut -c67-130)" && \
echo "Amount: $(cast call $FACTORY_CONTRACT_ADDRESS "vaults(uint256)" 0 --rpc-url $RPC_URL | cut -c131-194 | cast --from-wei)" && \
echo "Unlock Time: $(cast call $FACTORY_CONTRACT_ADDRESS "vaults(uint256)" 0 --rpc-url $RPC_URL | cut -c195-258 | cast --to-dec)" && \
echo "Withdrawn: $(cast call $FACTORY_CONTRACT_ADDRESS "vaults(uint256)" 0 --rpc-url $RPC_URL | cut -c259-322 | cast --to-dec)"
```

### 8.3 Check Current Block Timestamp

#### Context
Get the current block timestamp to see if the vault is ready for withdrawal.

```bash
cast block latest --rpc-url $RPC_URL | grep timestamp
```

### 8.4 Withdraw from Vault (after unlock time)

#### Context
Withdraw from vault ID 0 (only works after unlock time).

```bash
cast send $FACTORY_CONTRACT_ADDRESS "withdraw(uint256)" 0 --rpc-url $RPC_URL --private-key $PRIVATE_KEY
```

### 8.5 Check Account Balance

#### Context
Check your account balance before and after operations.

```bash
cast balance $CELO_ACCOUNT_ADDRESS --rpc-url $RPC_URL
```

#### Example Output

When you create a vault and check its details, you'll see output like:

```
Vault 0 Details:
Creator: 0x000000000000000000000000ddbd4fdac83194a09eaeebeb3dad6fae4e88573e
Token: 0x0000000000000000000000000000000000000000000000000000000000000000
Amount: 0.010000000000000000
Unlock Time: 1752016037
Withdrawn: 0000000000000000000000000000000000000000000000000000000000000000
```

> **📝 Note:**
> - **Creator**: Your account address (padded to 32 bytes)
> - **Token**: Zero address (0x0000...) indicates CELO
> - **Amount**: 0.01 CELO in wei format
> - **Unlock Time**: Unix timestamp when withdrawal becomes possible
> - **Withdrawn**: 0 = false (not yet withdrawn)

---


```bash
#!/bin/bash

# Set environment variables
export FACTORY_ADDRESS="0xa8C5B6f5f330E34e33F3d22B3Fe834e2bEFEa095"
export RPC_URL="https://alfajores-forno.celo-testnet.org"
export PRIVATE_KEY="your_private_key_here"

# Create vault
echo "Creating vault..."
VAULT_ID=$(cast send $FACTORY_ADDRESS "createVaultCelo(uint256)" $(($(date +%s) + 86400)) \
    --value 0.01ether --rpc-url $RPC_URL --private-key $PRIVATE_KEY --json | jq -r '.logs[0].topics[1]')

echo "Vault created with ID: $VAULT_ID"

# Check vault details
echo "Vault details:"
cast call $FACTORY_ADDRESS "vaults(uint256)" 0 --rpc-url $RPC_URL

# Wait for unlock time (in real scenario)
echo "Waiting for unlock time..."
sleep 86400

# Withdraw
echo "Withdrawing from vault..."
cast send $FACTORY_ADDRESS "withdraw(uint256)" 0 --rpc-url $RPC_URL --private-key $PRIVATE_KEY
```

---

## 10. Additional Resources

### Official Documentation
- [Celo Documentation](https://docs.celo.org/) - Official Celo developer docs
- [Foundry Book](https://book.getfoundry.sh/) - Complete Foundry reference
- [Solidity Documentation](https://docs.soliditylang.org/) - Solidity language reference

### SDKs and Tools
- [Celo SDK](https://docs.celo.org/sdk) - JavaScript/TypeScript SDK
- [Celo CLI](https://docs.celo.org/command-line-interface/introduction) - Command line interface
- [Celo ContractKit](https://docs.celo.org/developer-resources/contractkit) - Contract interaction library

### Block Explorers
- [Alfajores Block Explorer](https://explorer.celo.org/alfajores) - Testnet explorer
- [Celo Mainnet Explorer](https://explorer.celo.org/) - Mainnet explorer

### Community Resources
- [Celo Forum](https://forum.celo.org/) - Community discussions
- [Celo Discord](https://chat.celo.org/) - Real-time support
- [Celo GitHub](https://github.com/celo-org) - Open source repositories

### Related Projects
- [Celo DAppKit](https://docs.celo.org/developer-resources/dappkit) - Mobile DApp development
- [Celo Valora](https://valoraapp.com/) - Mobile wallet
- [Celo Forno](https://docs.celo.org/developer-resources/forno) - RPC endpoints

---

## 🤝 Contributing

This is a template project for the Celo Colombia Bootcamp. Feel free to modify and extend it for your own projects.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.










