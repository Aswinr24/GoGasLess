"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ArrowRight, Wallet, LinkIcon } from "lucide-react";
import { useState } from "react";
import { ethers } from "ethers";
import { abi } from "@/lib/TokenForwarder_abi";

declare global {
  interface Window {
    ethereum: any;
  }
}

interface TransactionRequest {
  from: string;
  to: string;
  value: bigint;
  gas: number;
  nonce: number;
  data: string;
}

export default function Home() {
  const [transactionType, setTransactionType] = useState("erc20");
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [tokenContract, setTokenContract] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState<BigInt>(BigInt(0));
  const [tokenId, setTokenId] = useState("");
  const [nonce, setNonce] = useState(0); 
  const [signature, setSignature] = useState<string | null>(null);
  const [transactionRequest, setTransactionRequest] = useState<TransactionRequest | null>(null);
  const contractAddress = "0xA36F5D5e88fea6192eDaad2F40345Cfe2cD3761c";

 async function connectWallet(){
  if (typeof window.ethereum !== 'undefined') {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletAddress(accounts[0]);
      setIsWalletConnected(true);
      console.log("Wallet connected:", accounts[0]);
    } catch (error) {
      if (error.code === 4001) {
        console.warn("User rejected the connection request.");
        alert("You declined the wallet connection. Please try again.");
      } else {
        console.error("An unexpected error occurred:", error);
        alert("An error occurred while connecting to the wallet. Please try again.");
      }
    }
  } else {
    alert("MetaMask is not installed. Please install it to use this feature.");
  }
};

const approveTokens = async (amount) => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner();

    const tokenContractInstance = new ethers.Contract(tokenContract, ["function approve(address spender, uint256 amount) public returns (bool)"], signer);

    const tx = await tokenContractInstance.approve(contractAddress, amount);
    await tx.wait();
    console.log("Approval successful!");
  } catch (error) {
    console.error("Error in approval", error);
    alert("Approval failed!");
  }
};



  // Function to create, sign the transaction, and send to backend
  async function signAndSendTransaction() {
    if (!isWalletConnected) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      console.log("Provider:", provider);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner()

      console.log("Wallet signer:", signer);
      
      // Hash the transaction request to be signed
      const encodedData = ethers.solidityPacked(
        ["address", "address", "address", "uint256", "uint256"],
        [walletAddress, tokenContract, recipient, amount, nonce]
      );
      // const messageHash = ethers.keccak256(encodedData);
      // const prefixedMessage = ethers.hashMessage(messageHash);

      const messageHash = ethers.keccak256(encodedData);
      console.log("Message hash:", messageHash);
      
      // Add Ethereum prefix and hash again (signable message)
      const prefixedHash = ethers.hashMessage(messageHash);
      console.log("Prefixed hash:", prefixedHash);
      
      // Sign the prefixed hash
      const userSignature = await signer.signMessage(ethers.getBytes(messageHash));
      console.log("Signature:", userSignature);

      // Recover the address from the raw message and signature
      const recoveredAddress = ethers.verifyMessage(prefixedHash, userSignature);

      console.log("Original wallet address:", walletAddress);
      console.log("Signer address:", await signer.getAddress());
      console.log("Recovered address:", recoveredAddress);


      // Store the signature and transaction request
      setSignature(userSignature);
      setTransactionRequest(transactionRequest);

      const contractABI = abi
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      console.log("Transaction signed:", userSignature);
      // Convert BigInt values to strings before logging


      // Send the signed transaction to the backend for gasless forwarding
    //   const response = await fetch("http://localhost:8080/api/executeGaslessTransaction", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json"
    //     },
    //     body: JSON.stringify({
    //       forwardRequest: {
    //         ...transactionRequest,
    //         value: transactionRequest?.value.toString(), 
    //       },
    //       signature: userSignature
    //     })
    //   });

    //   const result = await response.json();
    //   if (result.status === "success") {
    //     alert("Transaction forwarded successfully.");
    //   } else {
    //     alert("Transaction forwarding failed.");
    //   }
    // } catch (error) {
    //   console.error("Error signing or sending transaction:", error);
    //   alert("An error occurred while signing or sending the transaction.");
    // }

    try {
      if (transactionType === "erc20") {

        await approveTokens(amount);
        // Forward ERC20 transfer
        const tx = await contract.forwardERC20Transfer(
          tokenContract,
          recipient,
          amount,
          nonce,
          userSignature,
        );
        await tx.wait();
      } else if (transactionType === "erc721") {
        const tx = await contract.forwardERC721Transfer(
          tokenContract,
          recipient,
          tokenId,
          nonce,
          signature
        );
        await tx.wait();
      }

      alert("Transaction successful!");
    } catch (error) {
      console.error(error);
      alert("Transaction failed!");
    }
  }
  catch (error) {
    console.error("Error signing or sending transaction:", error);
    alert("An error occurred while signing or sending the transaction.");
  }
}

  return (
    <main className="min-h-screen p-8 bg-[#FFDE59]">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Wallet className="w-10 h-10" />
              <h1 className="text-4xl font-black">Gasless Forwarder</h1>
            </div>
            <Button
              onClick={connectWallet}
              className={`h-12 px-4 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 ${
                isWalletConnected 
                  ? 'bg-green-400 hover:bg-green-500' 
                  : 'bg-blue-400 hover:bg-blue-500'
              }`}
            >
              <LinkIcon className="mr-2 h-5 w-5" />
              {isWalletConnected 
                ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                : "Connect Wallet"
              }
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-lg font-bold mb-2 block">Transaction Type</label>
              <Select value={transactionType} onValueChange={setTransactionType} disabled={!isWalletConnected}>
                <SelectTrigger className="w-full border-2 border-black h-12">
                  <SelectValue placeholder="Select token type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="erc20">ERC-20 Token</SelectItem>
                  <SelectItem value="erc721">ERC-721 NFT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-lg font-bold mb-2 block">Token Contract Address</label>
              <Input 
                value={tokenContract}
                onChange={(e) => setTokenContract(e.target.value)}
                placeholder="0x..." 
                className="border-2 border-black h-12 placeholder:text-gray-500"
                disabled={!isWalletConnected}
              />
            </div>

            <div>
              <label className="text-lg font-bold mb-2 block">Recipient Address</label>
              <Input 
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..." 
                className="border-2 border-black h-12 placeholder:text-gray-500"
                disabled={!isWalletConnected}
              />
            </div>

            {transactionType === "erc20" ? (
              <div>
                <label className="text-lg font-bold mb-2 block">Amount</label>
                <Input 
                  value={amount.toString()}
                  onChange={(e) => setAmount(BigInt(e.target.value))}
                  type="number" 
                  placeholder="0.0" 
                  className="border-2 border-black h-12 placeholder:text-gray-500"
                  disabled={!isWalletConnected}
                />
              </div>
            ) : (
              <div>
                <label className="text-lg font-bold mb-2 block">Token ID</label>
                <Input
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)} 
                  type="number" 
                  placeholder="Token ID" 
                  className="border-2 border-black h-12 placeholder:text-gray-500"
                  disabled={!isWalletConnected}
                />
              </div>
            )}

            <Button 
              className="w-full h-12 text-lg font-bold bg-[#FF3B3B] hover:bg-[#FF5555] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              disabled={!isWalletConnected}
              onClick={signAndSendTransaction}
            >
              Send Transaction
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="mt-6 p-4 bg-[#E8E8E8] border-2 border-black">
            <p className="text-sm font-medium">
              ⚡ Send transactions without holding ETH
              <br />
              🔒 Secure forwarding with signature verification
              <br />
              💨 Fast & reliable transaction processing
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}


