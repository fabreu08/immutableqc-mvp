     'use client';                                                                                                                                                                                                                                   

      import { useState } from 'react';
      import { TransactionButton } from 'thirdweb/react';
      import { useActiveAccount, useSendUserOperation } from 'thirdweb/react';
      import { useWriteContract } from 'wagmi';
      import { client, chain, contract, paymasterConfig, getWalletBalance, estimateGas } from '../app/client';                                                                                                                                      

      interface MeasurementData {                                                                                                                                                                                                                     
        hash: string;                                                                                                                                                                                                                                 
        timestamp: number;                                                                                                                                                                                                                            
        value: string;                                                                                                                                                                                                                                
        metadataUri: string;                                                                                                                                                                                                                          
      }                                                                                                                                                                                                                                               

      export default function QCForm() {                                                                                                                                                                                                              
        const [data, setData] = useState<MeasurementData>({                                                                                                                                                                                           
          hash: '',                                                                                                                                                                                                                                   
          timestamp: Date.now(),                                                                                                                                                                                                                      
          value: '',                                                                                                                                                                                                                                  
          metadataUri: ''                                                                                                                                                                                                                             
        });                                                                                                                                                                                                                                           
        const [error, setError] = useState('');                                                                                                                                                                                                       
        const [loading, setLoading] = useState(false);                                                                                                                                                                                                
        const [txnHash, setTxnHash] = useState('');                                                                                                                                                                                                   
        const account = useActiveAccount(client);                                                                                                                                                                                                     
        const { sendUserOperation } = useSendUserOperation({ client, chain });                                                                                                                                                                        

        // Header: FDA-Grade on Mainnet                                                                                                                                                                                                               
        const headerTitle = 'FDA-Grade Integrity on Base Mainnet'; // FIXED: No Sepolia                                                                                                                                                               

        const prepareAndMint = async () => {                                                                                                                                                                                                          
          console.log('[MAINNET FIX] Starting mainnet mintTo on Base 8453');                                                                                                                                                                          
          if (!account) {                                                                                                                                                                                                                             
            const err = 'Wallet connect required for mainnet';                                                                                                                                                                                        
            console.error('[MAINNET FIX ERROR]', err);                                                                                                                                                                                                
            setError(err);                                                                                                                                                                                                                            
            return;                                                                                                                                                                                                                                   
          }                                                                                                                                                                                                                                           
          if (!data.hash || !data.value) {                                                                                                                                                                                                            
            const err = 'Complete form for QC record';                                                                                                                                                                                                
            console.error('[MAINNET FIX ERROR]', err);                                                                                                                                                                                                
            setError(err);                                                                                                                                                                                                                            
            return;                                                                                                                                                                                                                                   
          }                                                                                                                                                                                                                                           

        setLoading(true);
        setError('');

        try {
          console.log('[MAINNET FIX] Step 1: Signing payload on mainnet');
          const payload = { ...data, signer: account.address, chainId: 8453 };
          const signature = await account.signMessage({ message: JSON.stringify(payload) });
          console.log('[MAINNET FIX] Signature OK:', signature.slice(0, 10) + '...');

          console.log('[MAINNET FIX] Step 2: Balance check on mainnet');
          const balance = await getWalletBalance(account.address);
          if (balance < 0.001) {
            const err = 'Low ETH — bridge to Base mainnet (8453)';
            console.error('[MAINNET FIX ERROR]', err);
            throw new Error(err);
          }

          const uri = data.metadataUri || `ipfs://QmMainnet${data.hash.slice(0, 8)}`;
          console.log('[MAINNET FIX] URI:', uri);

          console.log('[MAINNET FIX] Step 3: Gas estimate on mainnet');
          const gasEstimate = await estimateGas({
            method: 'mintTo',
            params: [account.address, uri, data.value, signature, data.timestamp],
          });
          if (Number(gasEstimate) > 500000n) {
            const err = 'High gas — retry on calmer network';
            console.error('[MAINNET FIX ERROR]', err);
            throw new Error(err);
          }

          console.log('[MAINNET FIX] Step 4: Paymaster auth attempt');
          let txn;
          try {
            if (!paymasterConfig.policyId) {
              console.warn('[MAINNET FIX] No paymaster policy — falling back to EOA gas payment');
            }

            console.log('[MAINNET FIX] Sending user op to mainnet with paymaster');
            txn = await sendUserOperation({
              account,
              chain, // Base mainnet 8453
              paymaster: paymasterConfig.policyId ? {
                policyId: paymasterConfig.policyId
              } : undefined,
              calls: [{
                contract: contract.address, // 0x65d7245Ab1F2382a6F9fb0e1f14be8cdf1Bb4A69 mainnet
                method: 'mintTo',
                params: [account.address, uri, data.value, signature, data.timestamp],
              }],
            });
          } catch (paymasterErr: any) {
            console.error('[MAINNET FIX] Paymaster/Unauthorized failed:', paymasterErr.message);
            if (paymasterErr.message.includes('Unauthorized') || !paymasterConfig.policyId) {
              console.log('[MAINNET FIX] Retrying as pure EOA (user pays gas)');
              // EOA fallback: Direct writeContract via wagmi/thirdweb
              const { writeContract } = useWriteContract();
              txn = await writeContract({
                address: contract.address,
                abi: contract.abi, // Assume imported or static
                functionName: 'mintTo',
                args: [account.address, uri, data.value, signature, data.timestamp],
                chainId: 8453,
              });
            } else {
              throw paymasterErr;
            }
          }

          setTxnHash(txn.hash || txn);
          console.log('[MAINNET FIX SUCCESS] Txn hash:', txn.hash || txn);
          alert(`QC Minted on Mainnet! https://basescan.org/tx/${txn.hash || txn}`);

          // Audit
          console.log(`[AUDIT 21 CFR 11] Mainnet commit: ${new Date().toISOString()}, Hash: ${data.hash}, Tx: ${txn.hash || txn}`);
        } catch (err: any) {
          const msg = err.message || 'Mainnet mint failed';
          console.error('[MAINNET FIX ERROR Full]', err, { chain: chain.id, address: account?.address });
          setError(`Mainnet Error: ${msg} — Check console for auth/gas logs. If Unauthorized, ensure Replit URL whitelisted in Thirdweb dashboard.`);
        } finally {
          setLoading(false);
        }                                                                                                                                                                                                                                             

        };                                                                                                                                                                                                                                            

        const onError = (err: any) => {
          console.error('[MAINNET FIX TransactionButton Error]', err);
          const errMsg = err.message || err.toString();
          if (errMsg.includes('Unauthorized')) {
            setError('Unauthorized: Paymaster policy failed. EOA fallback attempted—check wallet gas on Base. Whitelist domain in Thirdweb dashboard if persistent.');
          } else {
            setError(errMsg);
          }
        };                                                                                                                                                                                                                                            

        const onSuccess = (result: any) => {                                                                                                                                                                                                          
          console.log('[MAINNET FIX Success]', result);                                                                                                                                                                                               
          setTxnHash(result.hash || result.receipt?.transactionHash || '');                                                                                                                                                                           
        };                                                                                                                                                                                                                                            

        const viewTxn = () => txnHash && window.open(https://basescan.or g/tx/${txnHash}, '_blank');                                                                                                                                                  

        return (                                                                                                                                                                                                                                      
          <div style={{ maxWidth: '400px', margin: 'auto', padding: '20px' }}>                                                                                                                                                                        
            <h2>{headerTitle}</h2> {/* FIXED: Base Mainnet */}                                                                                                                                                                                        
            <p>Sign & mint QC record as NFT on Base mainnet (8453). Paymaster logging active.</p>                                                                                                                                                     
            {!account ? (                                                                                                                                                                                                                             
              <p>Connect MetaMask to Base mainnet (8453).</p>                                                                                                                                                                                         
            ) : (                                                                                                                                                                                                                                     
              <form onSubmit={(e) => { e.preventDefault(); prepareAndMint(); }}>                                                                                                                                                                      
                <input                                                                                                                                                                                                                                
                  type="text"                                                                                                                                                                                                                         
                  placeholder="Data Hash (SHA256)"                                                                                                                                                                                                    
                  value={data.hash}                                                                                                                                                                                                                   
                  onChange={(e) => setData({ ...data, hash: e.target.value })}                                                                                                                                                                        
                  required                                                                                                                                                                                                                            
                  disabled={loading}                                                                                                                                                                                                                  
                  style={{ width: '100%', marginBottom: '10px', padding: '8px' }}                                                                                                                                                                     
                />                                                                                                                                                                                                                                    
                <input                                                                                                                                                                                                                                
                  type="text"                                                                                                                                                                                                                         
                  placeholder="Value (e.g., pH 7.2)"                                                                                                                                                                                                  
                  value={data.value}                                                                                                                                                                                                                  
                  onChange={(e) => setData({ ...data, value: e.target.value })}                                                                                                                                                                       
                  required                                                                                                                                                                                                                            
                  disabled={loading}                                                                                                                                                                                                                  
                  style={{ width: '100%', marginBottom: '10px', padding: '8px' }}                                                                                                                                                                     
                />                                                                                                                                                                                                                                    
                <input                                                                                                                                                                                                                                
                  type="text"                                                                                                                                                                                                                         
                  placeholder="IPFS URI (optional)"                                                                                                                                                                                                   
                  value={data.metadataUri}                                                                                                                                                                                                            
                  onChange={(e) => setData({ ...data, metadataUri: e.target.value })}                                                                                                                                                                 
                  disabled={loading}                                                                                                                                                                                                                  
                  style={{ width: '100%', marginBottom: '10px', padding: '8px' }}                                                                                                                                                                     
                />                                                                                                                                                                                                                                    
                <TransactionButton                                                                                                                                                                                                                    
                  transaction={prepareAndMint}                                                                                                                                                                                                        
                  onError={onError}                                                                                                                                                                                                                   
                  onSuccess={onSuccess}                                                                                                                                                                                                               
                  disabled={loading || !data.hash || !data.value}                                                                                                                                                                                     
                  style={{ width: '100%', padding: '10px', background: '#0070f3', color: 'white', border: 'none' }}                                                                                                                                   
                >                                                                                                                                                                                                                                     
                  {loading ? 'Committing to Mainnet...' : 'Sign & Submit to Base Mainnet'}                                                                                                                                                            
                </TransactionButton>                                                                                                                                                                                                                  
                {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}                                                                                                                                                                 
                {txnHash && (
                  <div style={{ marginTop: '10px' }}>
                    <p>Mainnet Txn: {typeof txnHash === 'string' ? txnHash.slice(0, 20) + '...' : JSON.stringify(txnHash).slice(0, 20) + '...'}</p>
                    <button onClick={viewTxn} style={{ padding: '5px 10px' }}>Basescan</button>
                  </div>
                )}
                <p style={{ fontSize: '0.8em', marginTop: '20px' }}>
                  <em>Contract: 0x65d7245Ab1F2382a6F9fb0e1f14be8cdf1Bb4A69 | Base Mainnet 8453 | EOA Fallback Enabled</em>
                </p>
              </form>
            )}
          </div>
        );
      }                    