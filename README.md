# GoGasLess

## Overview
A decentralized meta-transaction platform enabling gasless ERC20 and ERC721 token transfers with signature-based authentication.

## Features
- Gasless token transfers
- ERC20 and ERC721 support
- Signature-based meta-transactions
- Nonce-based replay protection
- Owner-controlled gas fund management

## Prerequisites
- Solidity ^0.8.20
- OpenZeppelin Contracts
- MetaMask or Web3 wallet
- React frontend

## Smart Contract Highlights
- Signature verification
- Gas cost reimbursement
- Secure nonce tracking

## Setup
1. Install dependencies
```bash
npm install ethers @openzeppelin/contracts
```


## Deployment Guide

### Smart Contract Deployment
1. Prepare Environment
```bash
npm install hardhat @openzeppelin/contracts
npx hardhat compile
```

2. Deployment Script (deploy.js)
```javascript
async function main() {
  const TokenForwarder = await ethers.getContractFactory("TokenForwarder");
  const forwarder = await TokenForwarder.deploy();
  await forwarder.deployed();
  console.log("TokenForwarder deployed to:", forwarder.address);
}
```

3. Network Configuration
- Update `hardhat.config.js` with:
  - Sepolia testnet
  - Mainnet deployment details
  - Private key management

## Usage
1. Connect wallet
2. Approve token spending
3. Sign meta-transaction
4. Execute gasless transfer

## Security Considerations
- Maximum transfer limits
- Signature validation
- Gas cost caps
- Nonce management

## Contributing
- Fork repository
- Create feature branch
- Submit pull request

## License
MIT License


