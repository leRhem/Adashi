import { useState, useEffect } from 'react';
import { 
  connect, 
  disconnect as stacksDisconnect, 
  isConnected as stacksIsConnected, 
  getLocalStorage,
  AppConfig,
  UserSession
} from '@stacks/connect';

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

// Get network from environment variable, default to testnet
const NETWORK = import.meta.env.VITE_STX_NETWORK || 'testnet';

export function useStacksConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userAddress, setUserAddress] = useState<string>('');
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isOk = stacksIsConnected() || userSession.isUserSignedIn();
        setIsConnected(isOk);
        
        if (isOk) {
          if (userSession.isUserSignedIn()) {
            const data = userSession.loadUserData();
            // Use network from env var to select address
            const address = NETWORK === 'mainnet' 
              ? data.profile.stxAddress.mainnet 
              : data.profile.stxAddress.testnet;
            setUserAddress(address ?? '');
            setUserData(data);
          } else {
            const storage = getLocalStorage();
            if (storage?.addresses?.stx?.[0]) {
              setUserAddress(storage.addresses.stx[0].address ?? '');
            }
          }
        }
      } catch (error) {
        console.error('Error during connection check:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkConnection();
  }, []);

  const connectWallet = async () => {
    try {
      const res = await connect();
      
      // Guard against null/undefined result
      if (!res || !res.addresses || !Array.isArray(res.addresses)) {
        console.error('Invalid response from connect():', res);
        return;
      }
      
      // Safely find STX address
      const stxAddressObj = res.addresses.find(a => a.symbol === 'STX');
      const stxAddress = stxAddressObj?.address ?? res.addresses[0]?.address ?? '';
      
      // Update both states consistently
      setUserAddress(stxAddress);
      setUserData({
        addresses: res.addresses,
        stxAddress: stxAddress
      });
      setIsConnected(true);
    } catch (error) {
      console.error('Wallet connection failed', error);
    }
  };

  const disconnect = () => {
    stacksDisconnect();
    userSession.signUserOut();
    setIsConnected(false);
    setIsLoading(false);
    setUserAddress('');
    setUserData(null);
    window.location.href = '/';
  };

  return { isConnected, isLoading, userAddress, userData, connectWallet, disconnect, userSession };
}
