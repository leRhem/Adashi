import { 
  Cl,
  fetchCallReadOnlyFunction,
  cvToValue
} from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';
import { openContractCall } from '@stacks/connect';
import { useStacksConnect } from './useStacksConnect';

const CONTRACT_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const CONTRACT_NAME = 'cooperative-savings-v2-1';
const network = STACKS_TESTNET;

export function useContract() {
  const { userSession, userAddress } = useStacksConnect();

  // Read functions
  const getPublicGroupCount = async () => {
    try {
      const result = await fetchCallReadOnlyFunction({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'get-public-group-count',
        functionArgs: [],
        network,
        senderAddress: userAddress || CONTRACT_ADDRESS,
      });
      return cvToValue(result);
    } catch (error) {
      console.error('Error fetching group count:', error);
      return 0;
    }
  };

  const getGroup = async (groupId: string) => {
    try {
      const result = await fetchCallReadOnlyFunction({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'get-group',
        functionArgs: [Cl.stringUtf8(groupId)],
        network,
        senderAddress: userAddress || CONTRACT_ADDRESS,
      });
      return cvToValue(result);
    } catch (error) {
      console.error('Error fetching group:', error);
      return null;
    }
  };

  // Write functions
  const joinPublicGroup = async (
    groupId: string,
    memberName: string,
    onFinish: (data: any) => void
  ) => {
    const txOptions = {
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'join-public-group',
      functionArgs: [
        Cl.stringUtf8(groupId),
        Cl.stringUtf8(memberName)
      ],
      network,
      userSession,
      onFinish,
      appDetails: {
        name: 'CoopSave',
        icon: window.location.origin + '/logo.png',
      },
    };
    
    await openContractCall(txOptions as any);
  };

  const deposit = async (
    groupId: string,
    onFinish: (data: any) => void
  ) => {
    const txOptions = {
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'deposit',
      functionArgs: [Cl.stringUtf8(groupId)],
      network,
      userSession,
      onFinish,
      appDetails: {
        name: 'CoopSave',
        icon: window.location.origin + '/logo.png',
      },
    };
    
    await openContractCall(txOptions as any);
  };

  return { getPublicGroupCount, getGroup, joinPublicGroup, deposit };
}
