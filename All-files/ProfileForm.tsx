import * as React from 'react';
import { StudentProfile, EducationLevel } from '../../../types/profile.types';
import LoadingIndicator from '../shared/LoadingIndicator';
import ErrorMessage from '../shared/ErrorMessage';

interface ProfileFormProps {
  profile: StudentProfile | null;
  email: string;
  setEmail: (email: string) => void;
  dateOfBirth: string;
  setDateOfBirth: (date: string) => void;
  gender: string;
  setGender: (gender: string) => void;
  educationLevel: string;
  setEducationLevel: (level: string) => void;
  currentStatus: string;
  setCurrentStatus: (status: string) => void;
  locationState: string;
  setLocationState: (state: string) => void;
  educationLevels: EducationLevel[];
  indianStates: string[];
  profileLoading: boolean;
  profileError: string | null;
  profileSuccess: string | null;
  handleProfileUpdate: (e: React.FormEvent) => Promise<void>;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  profile,
  email,
  setEmail,
  dateOfBirth,
  setDateOfBirth,
  gender,
  setGender,
  educationLevel,
  setEducationLevel,
  currentStatus,
  setCurrentStatus,
  locationState,
  setLocationState,
  educationLevels,
  indianStates,
  profileLoading,
  profileError,
  profileSuccess,
  handleProfileUpdate
}) => {
  if (profileLoading) {
    return (
      <LoadingIndicator 
        message="Loading profile data..." 
      />
    );
  }

  if (profileError && !profile) {
    return (
      <ErrorMessage 
        message={profileError} 
      />
    );
  }

  return (
    <form onSubmit={handleProfileUpdate}>
      {profileError && (
        <div
          style={{
            padding: '1rem',
            background: 'rgba(255, 0, 0, 0.1)',
            borderRadius: '0.5rem',
            color: '#FFA500',
            textAlign: 'center',
            marginBottom: '1rem',
            border: '1px solid rgba(255, 0, 0, 0.3)'
          }}
        >
          {profileError}
        </div>
      )}
      
      {profileSuccess && (
        <div
          style={{
            padding: '1rem',
            background: 'rgba(0, 255, 0, 0.1)',
            borderRadius: '0.5rem',
            color: '#00FF00',
            textAlign: 'center',
            marginBottom: '1rem',
            border: '1px solid rgba(0, 255, 0, 0.3)'
          }}
        >
          {profileSuccess}
        </div>
      )}
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '1.5rem', 
        marginBottom: '2rem',
      }}>
        <div>
          <label style={{ 
            display: 'block', 
            color: '#e5e7eb', 
            marginBottom: '0.5rem', 
            fontSize: '0.9rem',
            fontWeight: '500',
          }}>
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              backgroundColor: '#111827',
              color: '#f9fafb',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              fontSize: '0.9rem',
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#60a5fa';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(96, 165, 250, 0.2)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#374151';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
        <div>
          <label style={{ 
            display: 'block', 
            color: '#e5e7eb', 
            marginBottom: '0.5rem', 
            fontSize: '0.9rem',
            fontWeight: '500',
          }}>
            Date of Birth
          </label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              backgroundColor: '#111827',
              color: '#f9fafb',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              fontSize: '0.9rem',
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#60a5fa';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(96, 165, 250, 0.2)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#374151';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
        <div>
          <label style={{ 
            display: 'block', 
            color: '#e5e7eb', 
            marginBottom: '0.5rem', 
            fontSize: '0.9rem',
            fontWeight: '500',
          }}>
            Gender
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              backgroundColor: '#111827',
              color: '#f9fafb',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              fontSize: '0.9rem',
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#60a5fa';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(96, 165, 250, 0.2)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#374151';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <option value="" style={{ color: '#9ca3af' }}>Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label style={{ 
            display: 'block', 
            color: '#e5e7eb', 
            marginBottom: '0.5rem', 
            fontSize: '0.9rem',
            fontWeight: '500',
          }}>
            Current Status
          </label>
          <select
            value={currentStatus}
            onChange={(e) => setCurrentStatus(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              backgroundColor: '#111827',
              color: '#f9fafb',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              fontSize: '0.9rem',
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#60a5fa';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(96, 165, 250, 0.2)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#374151';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <option value="" style={{ color: '#9ca3af' }}>Select Status</option>
            <option value="student">Student</option>
            <option value="working">Working Professional</option>
            <option value="unemployed">Unemployed</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label style={{ 
            display: 'block', 
            color: '#e5e7eb', 
            marginBottom: '0.5rem', 
            fontSize: '0.9rem',
            fontWeight: '500',
          }}>
            Education Level
          </label>
          <select
            value={educationLevel}
            onChange={(e) => setEducationLevel(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              backgroundColor: '#111827',
              color: '#f9fafb',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              fontSize: '0.9rem',
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#60a5fa';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(96, 165, 250, 0.2)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#374151';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <option value="" style={{ color: '#9ca3af' }}>Select Education Level</option>
            {educationLevels.map(level => (
              <option key={level.id} value={level.id}>
                {level.level_name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ 
            display: 'block', 
            color: '#e5e7eb', 
            marginBottom: '0.5rem', 
            fontSize: '0.9rem',
            fontWeight: '500',
          }}>
            Location (State)
          </label>
          <select
            value={locationState}
            onChange={(e) => setLocationState(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              backgroundColor: '#111827',
              color: '#f9fafb',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              fontSize: '0.9rem',
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#60a5fa';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(96, 165, 250, 0.2)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#374151';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <option value="" style={{ color: '#9ca3af' }}>Select State</option>
            {indianStates.map((state, index) => (
              <option key={index} value={state}>{state}</option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="submit"
        disabled={profileLoading}
        style={{
          width: '100%',
          padding: '1rem',
          background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: profileLoading ? 'not-allowed' : 'pointer',
          opacity: profileLoading ? 0.7 : 1,
          transition: 'transform 0.2s ease, box-shadow 0.3s ease',
          boxShadow: '0 5px 15px rgba(59, 130, 246, 0.3)',
        }}
        onMouseEnter={(e) => {
          if (!profileLoading) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.5)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 5px 15px rgba(59, 130, 246, 0.3)';
        }}
      >
        {profileLoading ? 'Updating Profile...' : 'Save Changes'}
      </button>
    </form>
  );
};

export default ProfileForm;