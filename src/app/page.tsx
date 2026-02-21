"use client";

import { createThirdwebClient, getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { ConnectButton, TransactionButton, useActiveAccount, ThirdwebProvider } from "thirdweb/react";
import { mintTo } from "thirdweb/extensions/erc721";
import { useState } from "react";

// --- CONFIGURATION ---
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "",
});

const chain = defineChain(8453);
const CONTRACT_ADDRESS = "0x65d7245Ab1F2382a6F9fb0e1f14be8cdf1Bb4A69";

const contract = getContract({
  client,
  chain,
  address: CONTRACT_ADDRESS,
});

// --- PART 1: THE MAIN COMPONENT (Logic & UI) ---
function ImmutableQCContent() {
  const account = useActiveAccount();

  // Form State
  const [batchId, setBatchId] = useState("");
  const [phLevel, setPhLevel] = useState("");
  const [temp, setTemp] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-600 rounded flex items-center justify-center text-white font-bold">Q</div>
          <span className="text-xl font-bold text-slate-800">Immutable<span className="text-teal-600">QC</span></span>
        </div>
        <ConnectButton client={client} chain={chain} />
      </nav>

      <div className="max-w-2xl mx-auto mt-12 px-4 pb-20">
        <h1 className="text-3xl font-bold text-center mb-2">Immutable Audit Log</h1>
        <p className="text-center text-slate-500 mb-8">FDA-Grade Integrity on Base Sepolia</p>

        <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Batch ID / Sample #</label>
              <input 
                type="text" 
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition"
                placeholder="Ex: LOT-2025-X99"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">pH Level</label>
                <input 
                  type="number" 
                  value={phLevel}
                  onChange={(e) => setPhLevel(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition"
                  placeholder="7.00"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Temperature (°C)</label>
                <input 
                  type="number" 
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition"
                  placeholder="25.0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Notes / Observations</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none h-24 resize-none transition"
                placeholder="Enter any observations..."
              />
            </div>

            <div className="pt-2">
            {!account ? (
                <div className="text-center p-4 bg-orange-50 text-orange-800 rounded-lg border border-orange-200">
                  Please connect wallet to submit data.
                </div>
              ) : (
                <TransactionButton
                  transaction={() => {
                    return mintTo({
                      contract,
                      to: account.address,
                      nft: {
                        name: `Audit Log: ${batchId}`,
                        description: `pH: ${phLevel} | Temp: ${temp}°C | Notes: ${notes}`,
                        image: "https://placehold.co/400x400/0d9488/ffffff?text=Verified", 
                      },
                    });
                  }}
                  onTransactionConfirmed={(receipt) => {
                    alert("✅ Success! Log permanently written to Base Blockchain.");
                    setBatchId("");
                    setPhLevel("");
                    setTemp("");
                    setNotes("");
                  }}
                  onError={(error) => {
                    alert(`❌ Error: ${error.message}`);
                  }}
                  className="w-full" 
                >
                  Sign & Submit to Blockchain
                </TransactionButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// --- PART 2: THE WRAPPER (Fixes the Error) ---
export default function Home() {
  return (
    <ThirdwebProvider>
      <ImmutableQCContent />
    </ThirdwebProvider>
  );
}