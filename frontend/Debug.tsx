import React, { useEffect, useState } from 'react';

const Debug: React.FC = () => {
  const [studentPhone, setStudentPhone] = useState<string | null>(null);
  const [adminLoggedIn, setAdminLoggedIn] = useState<string | null>(null);

  useEffect(() => {
    // Update state values
    const updateValues = () => {
      setStudentPhone(localStorage.getItem('studentPhone'));
      setAdminLoggedIn(sessionStorage.getItem('adminLoggedIn'));
    };

    // Initial check
    updateValues();

    // Set up interval to check periodically
    const interval = setInterval(updateValues, 1000);

    return () => clearInterval(interval);
  }, []);

  const clearStudentPhone = () => {
    localStorage.removeItem('studentPhone');
    setStudentPhone(null);
  };

  const clearAdminLogin = () => {
    sessionStorage.removeItem('adminLoggedIn');
    setAdminLoggedIn(null);
  };

  const setDummyValues = () => {
    localStorage.setItem('studentPhone', '+911234567890');
    sessionStorage.setItem('adminLoggedIn', 'true');
    setStudentPhone(localStorage.getItem('studentPhone'));
    setAdminLoggedIn(sessionStorage.getItem('adminLoggedIn'));
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: '10px',
      borderRadius: '5px',
      color: 'white',
      zIndex: 9999,
      fontSize: '12px',
      maxWidth: '300px'
    }}>
      <h4 style={{ margin: '0 0 5px 0' }}>Auth Debug</h4>
      <div style={{ marginBottom: '5px' }}>
        <strong>studentPhone:</strong> {studentPhone || 'null'}
      </div>
      <div style={{ marginBottom: '10px' }}>
        <strong>adminLoggedIn:</strong> {adminLoggedIn || 'null'}
      </div>
      <div style={{ display: 'flex', gap: '5px' }}>
        <button 
          onClick={clearStudentPhone} 
          style={{ 
            padding: '3px 5px', 
            backgroundColor: '#ff4d4f', 
            border: 'none', 
            borderRadius: '3px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Clear Student
        </button>
        <button 
          onClick={clearAdminLogin}
          style={{ 
            padding: '3px 5px', 
            backgroundColor: '#ff4d4f', 
            border: 'none', 
            borderRadius: '3px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Clear Admin
        </button>
        <button 
          onClick={setDummyValues}
          style={{ 
            padding: '3px 5px', 
            backgroundColor: '#52c41a', 
            border: 'none', 
            borderRadius: '3px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Set Dummy
        </button>
      </div>
    </div>
  );
};

export default Debug;