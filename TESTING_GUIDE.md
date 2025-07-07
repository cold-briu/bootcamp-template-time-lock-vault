# Testing Time-Lock Vault Smart Contracts

A comprehensive guide to testing the TimeLockVaultFactory smart contract using Foundry's testing framework with real-world scenarios.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Testing Environment Setup](#testing-environment-setup)
3. [Basic Test Implementation](#basic-test-implementation)
4. [Advanced Test Scenarios](#advanced-test-scenarios)
5. [Test Execution and Debugging](#test-execution-and-debugging)
6. [Best Practices](#best-practices)

---

## Prerequisites

- Foundry development environment installed
- Basic understanding of Solidity testing
- Familiarity with Foundry's testing framework
- Understanding of time-lock vault concepts
- Knowledge of ERC-20 token standards

---

## Testing Environment Setup

### 1. Create Test Directory Structure

#### Context
Set up the proper directory structure for your test files following Foundry conventions.

```bash
# Create test directory
mkdir -p time-lock-vault/test

# Create the test file
touch time-lock-vault/test/TimeLockVaultFactory.t.sol
```

> **💡 Tip:** Foundry automatically looks for test files in the `test/` directory with the `.t.sol` extension.

### 2. Initialize Test File

#### Context
Create the basic test file structure with necessary imports and contract setup.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/TimeLockVaultFactory.sol";

contract TimeLockVaultFactoryTest is Test {
    TimeLockVaultFactory public factory;
    address public bob = address(0x2);

    function setUp() public {
        factory = new TimeLockVaultFactory(address(0));
        vm.deal(bob, 10 ether);
        vm.deal(address(this), 10 ether);
    }

    receive() external payable {}
}
```

> **⚠️ Important:** The `receive() external payable {}` function is essential for the test contract to receive CELO transfers.

---

## Basic Test Implementation

### 1. CELO Vault Happy Path Test

#### Context
Test the complete lifecycle of a CELO vault from creation to withdrawal.

```solidity
function test_CeloVault_HappyPath() public {
    // Setup: call createVaultCelo sending 1 ether with _unlockTime = block.timestamp + 1 days
    uint256 lockAmount = 1 ether;
    uint256 unlockTime = block.timestamp + 1 days;
    
    uint256 vaultId = factory.createVaultCelo{value: lockAmount}(unlockTime);

    // Verify vault was created correctly
    (address creator, address token, uint256 amount, uint256 vaultUnlockTime, bool withdrawn) = factory.vaults(vaultId);
    assertEq(creator, address(this));
    assertEq(token, address(0)); // CELO is represented as address(0)
    assertEq(amount, lockAmount);
    assertEq(vaultUnlockTime, unlockTime);
    assertEq(withdrawn, false);

    // Advance time: vm.warp(block.timestamp + 1 days + 1)
    uint256 warpTo = block.timestamp + 1 days + 1;
    vm.warp(warpTo);

    // Record balance before withdrawal
    uint256 balanceBefore = address(this).balance;

    // Assert: calling withdraw(vaultId) transfers the 1 ETH back to the creator and marks withdrawn = true
    factory.withdraw(vaultId);

    // Verify withdrawal
    (creator, token, amount, vaultUnlockTime, withdrawn) = factory.vaults(vaultId);
    assertEq(withdrawn, true);

    // Verify received the funds
    uint256 balanceAfter = address(this).balance;
    assertEq(balanceAfter, balanceBefore + lockAmount);
}
```

> **💡 Pro Tip:** Use `vm.warp()` to manipulate block timestamps for testing time-dependent functionality.

### 2. ERC-20 Vault Test

#### Context
Test ERC-20 token vault creation and withdrawal with a mock token.

```solidity
// Mock ERC-20 token for testing
contract MockERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    constructor() {
        balanceOf[msg.sender] = 1000 ether;
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
}

function test_ERC20Vault_HappyPath() public {
    MockERC20 token = new MockERC20();
    uint256 lockAmount = 100 ether;
    uint256 unlockTime = block.timestamp + 1 days;
    
    // Approve tokens
    token.approve(address(factory), lockAmount);
    
    // Create vault
    uint256 vaultId = factory.createVaultERC20(address(token), lockAmount, unlockTime);
    
    // Verify vault creation
    (address creator, address vaultToken, uint256 amount, uint256 vaultUnlockTime, bool withdrawn) = factory.vaults(vaultId);
    assertEq(creator, address(this));
    assertEq(vaultToken, address(token));
    assertEq(amount, lockAmount);
    assertEq(withdrawn, false);
    
    // Advance time and withdraw
    vm.warp(block.timestamp + 1 days + 1);
    factory.withdraw(vaultId);
    
    // Verify withdrawal
    (creator, vaultToken, amount, vaultUnlockTime, withdrawn) = factory.vaults(vaultId);
    assertEq(withdrawn, true);
    assertEq(token.balanceOf(address(this)), 900 ether); // 1000 - 100 = 900
}
```

---

## Advanced Test Scenarios

### 1. Failure Cases and Edge Cases

#### Context
Test various failure scenarios to ensure the contract behaves correctly under invalid conditions.

```solidity
function test_CreateVaultWithZeroAmount() public {
    uint256 unlockTime = block.timestamp + 1 days;
    
    // Should fail when no CELO is sent
    vm.expectRevert("No CELO sent");
    factory.createVaultCelo{value: 0}(unlockTime);
}

function test_CreateVaultWithPastUnlockTime() public {
    uint256 pastTime = block.timestamp - 1 days;
    
    // Should fail when unlock time is in the past
    vm.expectRevert("Unlock time must be in future");
    factory.createVaultCelo{value: 1 ether}(pastTime);
}

function test_WithdrawTooEarly() public {
    uint256 lockAmount = 1 ether;
    uint256 unlockTime = block.timestamp + 1 days;
    
    uint256 vaultId = factory.createVaultCelo{value: lockAmount}(unlockTime);
    
    // Should fail when trying to withdraw before unlock time
    vm.expectRevert("Too early");
    factory.withdraw(vaultId);
}

function test_WithdrawByNonCreator() public {
    uint256 lockAmount = 1 ether;
    uint256 unlockTime = block.timestamp + 1 days;
    
    uint256 vaultId = factory.createVaultCelo{value: lockAmount}(unlockTime);
    vm.warp(block.timestamp + 1 days + 1);
    
    // Should fail when non-creator tries to withdraw
    vm.prank(bob);
    vm.expectRevert("Not vault creator");
    factory.withdraw(vaultId);
}

function test_DoubleWithdrawal() public {
    uint256 lockAmount = 1 ether;
    uint256 unlockTime = block.timestamp + 1 days;
    
    uint256 vaultId = factory.createVaultCelo{value: lockAmount}(unlockTime);
    vm.warp(block.timestamp + 1 days + 1);
    
    // First withdrawal should succeed
    factory.withdraw(vaultId);
    
    // Second withdrawal should fail
    vm.expectRevert("Already withdrawn");
    factory.withdraw(vaultId);
}
```

### 2. Gas Testing

#### Context
Test gas consumption for different operations to ensure efficient contract usage.

```solidity
function test_GasUsage() public {
    uint256 gasBefore = gasleft();
    
    uint256 vaultId = factory.createVaultCelo{value: 1 ether}(block.timestamp + 1 days);
    
    uint256 gasUsed = gasBefore - gasleft();
    emit log_named_uint("Gas used for vault creation", gasUsed);
    
    // Verify gas usage is reasonable (should be under 200k gas)
    assertLt(gasUsed, 200000);
}
```

### 3. Multiple Vaults Test

#### Context
Test creating and managing multiple vaults to ensure the factory pattern works correctly.

```solidity
function test_MultipleVaults() public {
    uint256[] memory vaultIds = new uint256[](3);
    
    // Create 3 vaults
    for (uint256 i = 0; i < 3; i++) {
        vaultIds[i] = factory.createVaultCelo{value: 1 ether}(block.timestamp + 1 days + i);
    }
    
    // Verify all vaults were created
    for (uint256 i = 0; i < 3; i++) {
        (address creator, , , , bool withdrawn) = factory.vaults(vaultIds[i]);
        assertEq(creator, address(this));
        assertEq(withdrawn, false);
    }
    
    // Withdraw from first vault
    vm.warp(block.timestamp + 1 days + 1);
    factory.withdraw(vaultIds[0]);
    
    // Verify only first vault is withdrawn
    (,, , , bool withdrawn0) = factory.vaults(vaultIds[0]);
    (,, , , bool withdrawn1) = factory.vaults(vaultIds[1]);
    assertEq(withdrawn0, true);
    assertEq(withdrawn1, false);
}
```

---

## Test Execution and Debugging

### 1. Running Tests

#### Context
Execute your test suite and interpret the results.

```bash
# Run all tests
forge test

# Run with verbose output
forge test -vvv

# Run specific test
forge test --match-test test_CeloVault_HappyPath

# Run with gas reporting
forge test --gas-report
```

> **💡 Tip:** Use `-vvv` flag to see detailed logs and debug information during test execution.

### 2. Debugging Failed Tests

#### Context
Use Foundry's debugging tools to troubleshoot test failures.

```solidity
function test_DebugWithLogs() public {
    uint256 lockAmount = 1 ether;
    uint256 unlockTime = block.timestamp + 1 days;
    
    emit log_named_uint("Initial balance", address(this).balance);
    emit log_named_uint("Lock amount", lockAmount);
    emit log_named_uint("Unlock time", unlockTime);
    
    uint256 vaultId = factory.createVaultCelo{value: lockAmount}(unlockTime);
    
    emit log_named_uint("Vault ID", vaultId);
    
    (address creator, address token, uint256 amount, uint256 vaultUnlockTime, bool withdrawn) = factory.vaults(vaultId);
    emit log_named_address("Creator", creator);
    emit log_named_address("Token", token);
    emit log_named_uint("Amount", amount);
    emit log_named_uint("Vault unlock time", vaultUnlockTime);
    emit log_named_bool("Withdrawn", withdrawn);
}
```

> **⚠️ Debugging Note:** Use `emit log_named_*` functions to output debug information during test execution.

---

## Best Practices

### 1. Test Organization

#### Context
Organize your tests logically for better maintainability and readability.

- **Group related tests** in separate functions
- **Use descriptive test names** that explain the scenario
- **Test both success and failure cases**
- **Include edge cases and boundary conditions**

### 2. Test Data Management

#### Context
Manage test data effectively to avoid conflicts and ensure reproducibility.

```solidity
// Use constants for common values
uint256 constant LOCK_AMOUNT = 1 ether;
uint256 constant LOCK_DURATION = 1 days;

// Use setUp() for common initialization
function setUp() public {
    factory = new TimeLockVaultFactory(address(0));
    vm.deal(address(this), 100 ether);
    vm.deal(bob, 100 ether);
}
```

### 3. Security Testing

#### Context
Include security-focused tests to ensure the contract is robust against attacks.

- **Test access control** mechanisms
- **Verify reentrancy protection** (if applicable)
- **Test overflow/underflow scenarios**
- **Verify proper error handling**

> **⚠️ Security Note:** Always test failure scenarios and edge cases to ensure your contract is secure.

### 4. Performance Testing

#### Context
Test contract performance to ensure it meets gas efficiency requirements.

- **Monitor gas usage** for key operations
- **Test with realistic data sizes**
- **Verify scalability** with multiple users

---

**✅ Success!** You now have a comprehensive test suite for your TimeLockVaultFactory contract. Run your tests regularly to ensure contract reliability and catch issues early in development.
