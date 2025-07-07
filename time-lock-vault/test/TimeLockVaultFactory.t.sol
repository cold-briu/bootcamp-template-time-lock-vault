// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/TimeLockVaultFactory.sol";

contract TimeLockVaultFactoryTest is Test {
    TimeLockVaultFactory public factory;
    // address public alice = address(0x1); // Not used for CELO test
    address public bob = address(0x2);

    function setUp() public {
        factory = new TimeLockVaultFactory(address(0));
        // vm.deal(alice, 10 ether); // Not needed for CELO test
        vm.deal(bob, 10 ether);
        vm.deal(address(this), 10 ether); // Give this contract ETH
    }

    function test_CeloVault_HappyPath() public {
        // Setup: call createVaultCelo sending 1 ether with _unlockTime = block.timestamp + 1 days
        uint256 lockAmount = 1 ether;
        uint256 unlockTime = block.timestamp + 1 days;

        uint256 vaultId = factory.createVaultCelo{value: lockAmount}(
            unlockTime
        );

        // Verify vault was created correctly
        (
            address creator,
            address token,
            uint256 amount,
            uint256 vaultUnlockTime,
            bool withdrawn
        ) = factory.vaults(vaultId);
        assertEq(creator, address(this));
        assertEq(token, address(0)); // CELO is represented as address(0)
        assertEq(amount, lockAmount);
        assertEq(vaultUnlockTime, unlockTime);
        assertEq(withdrawn, false);

        // Advance time: vm.warp(block.timestamp + 1 days + 1)
        uint256 warpTo = block.timestamp + 1 days + 1;
        vm.warp(warpTo);

        // Debug: log timestamps
        (creator, token, amount, vaultUnlockTime, withdrawn) = factory.vaults(
            vaultId
        );
        emit log_named_uint("block.timestamp", block.timestamp);
        emit log_named_uint("vaultUnlockTime", vaultUnlockTime);

        // Record balance before withdrawal
        uint256 balanceBefore = address(this).balance;

        // Assert: calling withdraw(vaultId) transfers the 1 ETH back to the creator and marks withdrawn = true
        factory.withdraw(vaultId);

        // Verify withdrawal
        (creator, token, amount, vaultUnlockTime, withdrawn) = factory.vaults(
            vaultId
        );
        assertEq(withdrawn, true);

        // Verify received the funds
        uint256 balanceAfter = address(this).balance;
        assertEq(balanceAfter, balanceBefore + lockAmount);
    }

    receive() external payable {}
}
