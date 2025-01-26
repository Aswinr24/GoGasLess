// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract TokenForwarder is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    mapping(address => uint256) public nonces;

    event TokenTransferred(
        address indexed sender, 
        address indexed recipient, 
        address tokenContract, 
        uint256 amount
    );

    constructor() Ownable(msg.sender) {}

    function depositGasFunds() external payable onlyOwner {}

    function withdrawGasFunds(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        payable(owner()).transfer(amount);
    }

    function _verifyMetaTransaction(
        address tokenContract,
        address recipient,
        uint256 amount,
        uint256 nonce,
        bytes memory signature
    ) internal view returns (bool) {
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                msg.sender, // Derive userAddress from msg.sender
                tokenContract,
                recipient,
                amount,
                nonce
            )
        );

        address signer = messageHash.toEthSignedMessageHash().recover(signature);
        return signer == msg.sender;
    }

    function forwardERC20Transfer(
        address tokenContract,
        address recipient,
        uint256 amount,
        uint256 nonce,
        bytes memory signature
    ) external {
        require(
            _verifyMetaTransaction(tokenContract, recipient, amount, nonce, signature),
            "Invalid signature"
        );
        require(nonces[msg.sender]++ == nonce, "Invalid nonce");

        IERC20 token = IERC20(tokenContract);

        // Explicitly check token allowance
        require(token.allowance(msg.sender, address(this)) >= amount, "Insufficient allowance");
        require(token.balanceOf(msg.sender) >= amount, "Insufficient token balance");

        // Fixed gas stipend instead of dynamic calculation
        uint256 gasCost = 50000 * tx.gasprice;
        require(address(this).balance >= gasCost, "Insufficient contract gas balance");

        token.transferFrom(msg.sender, recipient, amount);

        payable(owner()).transfer(gasCost);

        emit TokenTransferred(msg.sender, recipient, tokenContract, amount);

    }

    function forwardERC721Transfer(
        address tokenContract,
        address recipient,
        uint256 tokenId,
        uint256 nonce,
        bytes memory signature
    ) external {
        require(
            _verifyMetaTransaction(tokenContract, recipient, tokenId, nonce, signature),
            "Invalid signature"
        );
        require(nonces[msg.sender]++ == nonce, "Invalid nonce");

        IERC721 token = IERC721(tokenContract);
        uint256 initialGas = gasleft();

        require(token.ownerOf(tokenId) == msg.sender, "Not token owner");

        token.transferFrom(msg.sender, recipient, tokenId);

        uint256 gasUsed = initialGas - gasleft();
        uint256 gasCost = gasUsed * tx.gasprice;

        require(address(this).balance >= gasCost, "Insufficient gas funds");

        payable(owner()).transfer(gasCost);

        emit TokenTransferred(msg.sender, recipient, tokenContract, tokenId);
    }

    receive() external payable {}
}
