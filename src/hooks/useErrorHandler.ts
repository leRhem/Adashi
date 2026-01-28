import { ERROR_CODES, type ErrorCode } from '../constants/error-codes';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

export function useErrorHandler() {
  const showToast = useToast();
  const navigate = useNavigate();

  function parseContractError(error: any): {
    code: string | number;
    message: string;
    userMessage: string;
    action: string;
  } {
    // Extract error code from different error formats
    let errorCode: number | undefined;

    // Format 1: { error: { error: "u301" } }
    if (error?.error?.error && typeof error.error.error === 'string') {
      errorCode = parseInt(error.error.error.replace('u', ''));
    }
    
    // Format 2: { error: "transaction aborted: u301" }
    if (error?.error && typeof error.error === 'string') {
      const match = error.error.match(/u(\d+)/);
      if (match) errorCode = parseInt(match[1]);
    }

    // Format 3: error.message contains code
    if (error?.message && typeof error.message === 'string') {
      const match = error.message.match(/u(\d+)/);
      if (match) errorCode = parseInt(match[1]);
    }

    // Format 4: Direct error code
    if (typeof error === 'number') {
      errorCode = error;
    }

    // Get error details
    if (errorCode && (errorCode in ERROR_CODES)) {
      return ERROR_CODES[errorCode as ErrorCode];
    }

    // Default error
    return {
      code: 999,
      message: 'Unknown error',
      userMessage: 'An unexpected error occurred. Please try again or contact support.',
      action: 'retry'
    };
  }

  function handleContractError(error: any, context?: any) {
    const errorInfo = parseContractError(error);
    
    // Replace placeholders in user message
    let message = errorInfo.userMessage;
    if (context) {
      Object.keys(context).forEach(key => {
        message = message.replace(`{${key}}`, context[key]);
      });
    }

    // Show appropriate toast
    const action = getErrorAction(errorInfo.action);

    showToast({
      type: 'error',
      title: errorInfo.message,
      message: message,
      action: action ? {
        label: action.label,
        onClick: action.onClick
      } : undefined,
      duration: 8000 // Longer duration for errors
    });

    // Log to console for debugging
    console.error('Contract Error:', {
      code: errorInfo.code,
      message: message,
      rawError: error,
      context
    });

    return errorInfo;
  }

  function getErrorAction(actionType: string) {
    switch (actionType) {
      case 'contact_creator':
        return {
          label: 'Contact Creator',
          onClick: () => {} // Placeholder: Could open email or DM
        };
      case 'join_group':
        return {
          label: 'Join Group',
          onClick: () => {} // Logic handled by context usually
        };
      case 'check_balance':
        return {
          label: 'Check Balance',
          onClick: () => window.open('https://explorer.hiro.so/sandbox/faucet?chain=testnet', '_blank')
        };
      case 'add_funds':
        return {
          label: 'Get Faucet',
          onClick: () => window.open('https://explorer.hiro.so/sandbox/faucet?chain=testnet', '_blank')
        };
      case 'browse_groups':
        return {
          label: 'Browse Groups',
          onClick: () => navigate('/browse')
        };
      case 'view_vote':
        return {
          label: 'View Vote',
          onClick: () => {} // Reload or scroll to vote section
        };
      case 'retry':
        return {
          label: 'Try Again',
          onClick: () => window.location.reload()
        };
      default:
        return undefined;
    }
  }

  return { handleContractError, parseContractError };
}
