import * as React from 'react';
import { RefreshCw } from 'lucide-react';

interface RefreshButtonProps {
  onClick: () => void;
  isLoading: boolean;
  title?: string;
}

const RefreshButton: React.FC<RefreshButtonProps> = ({ onClick, isLoading, title = "Refresh" }) => (
  <button
    onClick={onClick}
    disabled={isLoading}
    style={{
      padding: '0.5rem 1rem',
      background: isLoading ? 'rgba(255, 215, 0, 0.3)' : 'linear-gradient(45deg, #B19CD9, #FFD700)',
      color: '#2E1A47',
      border: 'none',
      borderRadius: '0.5rem',
      cursor: isLoading ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontWeight: '600',
    }}
  >
    <RefreshCw size={16} />
    {title}
  </button>
);

export default RefreshButton;