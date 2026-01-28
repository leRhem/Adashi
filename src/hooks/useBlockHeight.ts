import { useState, useEffect, useRef } from 'react';

// Hook to fetch current block height and update periodically
export function useBlockHeight() {
  const [blockHeight, setBlockHeight] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastFetchRef = useRef<number>(0);

  useEffect(() => {
    const fetchBlockHeight = async () => {
      // Only fetch if we haven't fetched in the last 30 seconds
      if (Date.now() - lastFetchRef.current < 30000) {
        return;
      }
      
      try {
        const response = await fetch('https://api.testnet.hiro.so/v2/info');
        if (!response.ok) throw new Error('Failed to fetch block height');
        
        const data = await response.json();
        setBlockHeight(data.stacks_tip_height);
        lastFetchRef.current = Date.now();
      } catch (err) {
        console.error('Error fetching block height:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlockHeight();
    
    // Refresh every 2 minutes (blocks come every ~10 mins on Stacks)
    const interval = setInterval(fetchBlockHeight, 120000);
    return () => clearInterval(interval);
  }, []);

  return { blockHeight, isLoading };
}

// Calculate blocks remaining until a target block
export function useBlocksRemaining(targetBlock: number | undefined) {
  const { blockHeight, isLoading } = useBlockHeight();
  
  if (isLoading || !blockHeight || !targetBlock) {
    return { blocksRemaining: null, isLoading };
  }
  
  const remaining = targetBlock - blockHeight;
  return { blocksRemaining: Math.max(0, remaining), isLoading: false };
}
