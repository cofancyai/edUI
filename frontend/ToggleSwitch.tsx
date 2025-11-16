import * as React from 'react';

interface ToggleSwitchProps {
  isOn: boolean;
  onToggle: () => void;
  label: string;
  icon?: React.ReactNode;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ isOn, onToggle, label, icon }) => (
  <div
    style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.5rem',
      padding: '0.5rem 1rem',
      background: 'rgba(255, 215, 0, 0.1)',
      borderRadius: '0.5rem',
      cursor: 'pointer',
    }}
    onClick={onToggle}
  >
    <div style={{
      width: '36px',
      height: '20px',
      borderRadius: '10px',
      background: isOn ? '#FFD700' : '#4a3063',
      position: 'relative',
      transition: 'background 0.3s',
    }}>
      <div style={{
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        background: '#FFFFFF',
        position: 'absolute',
        top: '2px',
        left: isOn ? '18px' : '2px',
        transition: 'left 0.3s',
      }} />
    </div>
    <span style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
      {icon}
      {label}
    </span>
  </div>
);

export default ToggleSwitch;