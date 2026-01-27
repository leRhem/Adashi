import { useState, useEffect } from 'react';
import { AppConfig, UserSession, showConnect } from '@stacks/connect';

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

export function useStacksConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string>('');
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const data = userSession.loadUserData();
      // Use testnet address if available, otherwise mainnet
      const address = data.profile.stxAddress.testnet || data.profile.stxAddress.mainnet;
      setUserAddress(address);
      setUserData(data);
      setIsConnected(true);
    }
  }, []);

  const connectWallet = () => {
    console.log('Connect Wallet button clicked');
    showConnect({
      appDetails: {
        name: 'Adashi',
        icon: window.location.origin + '/Logo.png',
      },
      redirectTo: '/',
      onFinish: () => {
        console.log('Wallet connected successfully');
        const data = userSession.loadUserData();
        const address = data.profile.stxAddress.testnet || data.profile.stxAddress.mainnet;
        setUserAddress(address);
        setUserData(data);
        setIsConnected(true);
      },
      onCancel: () => {
        console.log('Wallet connection cancelled');
      },
      userSession,
    });
  };

  const disconnect = () => {
    userSession.signUserOut();
    setIsConnected(false);
    setUserAddress('');
    setUserData(null);
    window.location.href = '/';
  };

  return { isConnected, userAddress, userData, connectWallet, disconnect, userSession };
}
