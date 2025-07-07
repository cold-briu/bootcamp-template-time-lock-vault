# Building a Time-Lock Vault Smart Contract

A comprehensive guide to creating a secure time-lock vault smart contract using Solidity and Foundry.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Contract Overview](#contract-overview)
3. [Step-by-Step Contract Development](#step-by-step-contract-development)
4. [Complete Contract Implementation](#complete-contract-implementation)
5. [Contract Features Explained](#contract-features-explained)

---

## Prerequisites

- Solidity knowledge (basic to intermediate)
- Foundry development environment
- Understanding of ERC-20 tokens
- Familiarity with smart contract security concepts
- Basic knowledge of time-lock mechanisms

---

## Contract Overview

#### Context
The TimeLockVaultFactory is a factory contract that allows users to create time-locked vaults for both native CELO and ERC-20 tokens. Each vault locks funds until a specified unlock time.

**Key Features:**
- Create time-locked vaults for CELO and ERC-20 tokens
- Secure withdrawal mechanism with time validation
- Factory pattern for multiple vault management
- Access control and security measures

---

## Step-by-Step Contract Development

### 1. SPDX License and Interface

#### Context
Start with the license identifier and define the ERC-20 interface for token interactions.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}
```

> **💡 Tip:** The IERC20 interface includes only the functions we need for this contract, keeping it minimal and focused.

### 2. Contract State Variables and Structs

#### Context
Define the contract's state variables and data structures for storing vault information.

```solidity
contract TimeLockVaultFactory {
    /// @notice The deployer (could be used for admin actions)
    address public immutable owner;

    /// @notice Auto-incrementing vault ID
    uint256 private nextVaultId;

    /// @notice A single time-locked vault (CELO or ERC-20)
    struct Vault {
        address creator;
        address token;       // zero = CELO, otherwise ERC-20 contract
        uint256 amount;      // amount of CELO or tokens locked
        uint256 unlockTime;  // timestamp when withdrawal allowed
        bool withdrawn;
    }

    /// @dev vaultId => Vault
    mapping(uint256 => Vault) public vaults;

    /// @dev creator => list of vaultIds
    mapping(address => uint256[]) public userVaults;
```

> **⚠️ Important:** The `owner` is immutable to prevent changes after deployment, ensuring contract security.

### 3. Constructor

#### Context
Initialize the contract with an optional owner parameter for flexibility in deployment.

```solidity
    /// @param _owner Optional override (pass zero to use msg.sender)
    constructor(address _owner) {
        owner = _owner == address(0) ? msg.sender : _owner;
    }
```

> **📝 Note:** Passing `address(0)` as `_owner` uses `msg.sender` as the owner, providing deployment flexibility.

### 4. CELO Vault Creation

#### Context
Implement the function to create time-locked vaults for native CELO tokens.

```solidity
    /// @notice Lock CELO until `_unlockTime`
    function createVaultCelo(uint256 _unlockTime)
        external
        payable
        returns (uint256 vaultId)
    {
        require(msg.value > 0, "No CELO sent");
        require(_unlockTime > block.timestamp, "Unlock time must be in future");

        vaultId = _storeVault(msg.sender, address(0), msg.value, _unlockTime);
    }
```

> **💡 Pro Tip:** Using `address(0)` to represent CELO tokens is a common pattern that distinguishes native tokens from ERC-20 tokens.

### 5. ERC-20 Vault Creation

#### Context
Create time-locked vaults for ERC-20 tokens with proper approval checks.

```solidity
    /// @notice Lock ERC-20 `token` until `_unlockTime`
    /// @dev caller must `approve` this contract for at least `_amount` first
    function createVaultERC20(address token, uint256 amount, uint256 _unlockTime)
        external
        returns (uint256 vaultId)
    {
        require(amount > 0, "Amount must be >0");
        require(_unlockTime > block.timestamp, "Unlock time must be in future");
        require(token != address(0), "Invalid token address");

        // pull tokens in
        bool ok = IERC20(token).transferFrom(msg.sender, address(this), amount);
        require(ok, "Token transfer failed");

        vaultId = _storeVault(msg.sender, token, amount, _unlockTime);
    }
```

> **⚠️ Warning:** Users must approve the contract to spend their tokens before calling this function. Always check approval status in your frontend.

### 6. Internal Helper Function

#### Context
Create a private helper function to store vault data and maintain consistency across vault creation.

```solidity
    /// @dev internal helper to record the vault
    function _storeVault(
        address creator,
        address token,
        uint256 amount,
        uint256 _unlockTime
    ) private returns (uint256 vaultId) {
        vaultId = nextVaultId++;
        vaults[vaultId] = Vault({
            creator:   creator,
            token:     token,
            amount:    amount,
            unlockTime:_unlockTime,
            withdrawn: false
        });
        userVaults[creator].push(vaultId);
    }
```

> **💡 Tip:** Using a private helper function ensures consistent vault storage logic and reduces code duplication.

### 7. Withdrawal Function

#### Context
Implement secure withdrawal mechanism with multiple validation checks.

```solidity
    /// @notice Withdraw funds after unlock time
    function withdraw(uint256 vaultId) external {
        Vault storage v = vaults[vaultId];

        require(v.creator != address(0), "Vault does not exist");
        require(msg.sender == v.creator, "Not vault creator");
        require(block.timestamp >= v.unlockTime, "Too early");
        require(!v.withdrawn, "Already withdrawn");

        v.withdrawn = true;
        if (v.token == address(0)) {
            // CELO
            payable(v.creator).transfer(v.amount);
        } else {
            // ERC-20
            bool ok = IERC20(v.token).transfer(v.creator, v.amount);
            require(ok, "Token transfer failed");
        }
    }
```

> **⚠️ Security Note:** The withdrawal function includes multiple checks to prevent unauthorized access and double withdrawals.

### 8. Receive Function

#### Context
Prevent accidental CELO transfers to the contract by implementing a receive function.

```solidity
    /// @notice Prevent accidental CELO sends
    receive() external payable {
        revert("Use createVaultCelo()");
    }
}
```

> **💡 Pro Tip:** This prevents users from accidentally sending CELO directly to the contract without creating a vault.

---

## Complete Contract Implementation

#### Context
Here's the complete TimeLockVaultFactory contract ready for deployment.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract TimeLockVaultFactory {
    /// @notice The deployer (could be used for admin actions)
    address public immutable owner;

    /// @notice Auto-incrementing vault ID
    uint256 private nextVaultId;

    /// @notice A single time-locked vault (CELO or ERC-20)
    struct Vault {
        address creator;
        address token;       // zero = CELO, otherwise ERC-20 contract
        uint256 amount;      // amount of CELO or tokens locked
        uint256 unlockTime;  // timestamp when withdrawal allowed
        bool withdrawn;
    }

    /// @dev vaultId => Vault
    mapping(uint256 => Vault) public vaults;

    /// @dev creator => list of vaultIds
    mapping(address => uint256[]) public userVaults;

    /// @param _owner Optional override (pass zero to use msg.sender)
    constructor(address _owner) {
        owner = _owner == address(0) ? msg.sender : _owner;
    }

    /// @notice Lock CELO until `_unlockTime`
    function createVaultCelo(uint256 _unlockTime)
        external
        payable
        returns (uint256 vaultId)
    {
        require(msg.value > 0, "No CELO sent");
        require(_unlockTime > block.timestamp, "Unlock time must be in future");

        vaultId = _storeVault(msg.sender, address(0), msg.value, _unlockTime);
    }

    /// @notice Lock ERC-20 `token` until `_unlockTime`
    /// @dev caller must `approve` this contract for at least `_amount` first
    function createVaultERC20(address token, uint256 amount, uint256 _unlockTime)
        external
        returns (uint256 vaultId)
    {
        require(amount > 0, "Amount must be >0");
        require(_unlockTime > block.timestamp, "Unlock time must be in future");
        require(token != address(0), "Invalid token address");

        // pull tokens in
        bool ok = IERC20(token).transferFrom(msg.sender, address(this), amount);
        require(ok, "Token transfer failed");

        vaultId = _storeVault(msg.sender, token, amount, _unlockTime);
    }

    /// @dev internal helper to record the vault
    function _storeVault(
        address creator,
        address token,
        uint256 amount,
        uint256 _unlockTime
    ) private returns (uint256 vaultId) {
        vaultId = nextVaultId++;
        vaults[vaultId] = Vault({
            creator:   creator,
            token:     token,
            amount:    amount,
            unlockTime:_unlockTime,
            withdrawn: false
        });
        userVaults[creator].push(vaultId);
    }

    /// @notice Withdraw funds after unlock time
    function withdraw(uint256 vaultId) external {
        Vault storage v = vaults[vaultId];

        require(v.creator != address(0), "Vault does not exist");
        require(msg.sender == v.creator, "Not vault creator");
        require(block.timestamp >= v.unlockTime, "Too early");
        require(!v.withdrawn, "Already withdrawn");

        v.withdrawn = true;
        if (v.token == address(0)) {
            // CELO
            payable(v.creator).transfer(v.amount);
        } else {
            // ERC-20
            bool ok = IERC20(v.token).transfer(v.creator, v.amount);
            require(ok, "Token transfer failed");
        }
    }

    /// @notice Prevent accidental CELO sends
    receive() external payable {
        revert("Use createVaultCelo()");
    }
}
```

> **✅ Success!** Your TimeLockVaultFactory contract is now complete and ready for testing and deployment.

---

## Contract Features Explained

### **Core Functionality**

#### Context
The contract provides essential time-lock vault functionality with support for multiple token types.

- **CELO Vaults**: Lock native CELO for a specified time period
- **ERC-20 Vaults**: Lock any ERC-20 token for a specified time period
- **Time-based Withdrawals**: Funds can only be withdrawn after the unlock time
- **Factory Pattern**: Create multiple vaults from a single contract

### **Security Features**

#### Context
Multiple security measures ensure the safety of locked funds and prevent common attack vectors.

- **Access Control**: Only vault creators can withdraw their funds
- **Time Validation**: Prevents creating vaults with past unlock times
- **Amount Validation**: Ensures positive amounts are locked
- **Withdrawal Prevention**: Prevents double withdrawals
- **Accidental CELO Protection**: Prevents direct CELO transfers to contract

> **⚠️ Security Note:** Always conduct thorough security audits before deploying to mainnet.

### **Data Structures**

#### Context
Efficient data structures organize vault information and enable quick lookups.

- **Vault Struct**: Stores all vault information (creator, token, amount, unlock time, withdrawal status)
- **Vault Mapping**: Maps vault IDs to vault data
- **User Vaults**: Tracks all vaults created by each user

### **Key Functions**

#### Context
The contract's main functions provide the complete vault lifecycle management.

1. **`createVaultCelo()`**: Creates a time-locked CELO vault
2. **`createVaultERC20()`**: Creates a time-locked ERC-20 token vault
3. **`withdraw()`**: Withdraws funds after lock period expires
4. **`_storeVault()`**: Internal helper to store vault data
5. **`receive()`**: Prevents accidental CELO transfers

> **💡 Pro Tip:** The factory pattern allows for easy extension and additional features like vault management interfaces.

---

**🎉 Congratulations!** You've successfully built a secure time-lock vault smart contract. The next steps are testing, deployment, and integration with your application. 