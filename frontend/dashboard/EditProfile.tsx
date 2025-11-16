import * as React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import ProfileForm from '../ProfileForm';
import { StudentProfile, EducationLevel } from '../../types/profile.types';

interface EditProfileProps {
  studentPhone: string | null;
}

const EditProfile: React.FC<EditProfileProps> = ({ studentPhone }) => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [email, setEmail] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [educationLevel, setEducationLevel] = useState<string>('');
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [locationState, setLocationState] = useState<string>('');
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
    'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
    'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
  ];

  useEffect(() => {
    fetchProfileData();
    fetchDropdownData();
  }, []);

  // Clear profile success message
  useEffect(() => {
    if (profileSuccess) {
      const timer = setTimeout(() => setProfileSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [profileSuccess]);

  const fetchProfileData = async () => {
    if (!studentPhone) {
      setProfileError('No phone number found. Please log in again.');
      return;
    }
    setProfileLoading(true);
    setProfileError(null);
    try {
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('phone', studentPhone)
        .single();
      if (studentError) throw studentError;
      if (!student) throw new Error('Student not found.');
      const { data: profileData, error: profileError } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('student_id', student.id)
        .single();
      if (profileError) throw profileError;
      if (!profileData) throw new Error('Profile not found.');
      setProfile(profileData);
      setEmail(profileData.email || '');
      setDateOfBirth(profileData.date_of_birth || '');
      setGender(profileData.gender || '');
      setEducationLevel(profileData.education_level || '');
      setCurrentStatus(profileData.current_status || '');
      setLocationState(profileData.location_state || '');
    } catch (err) {
      setProfileError(`Failed to fetch profile data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const { data: levelsData, error: levelsError } = await supabase
        .from('education_levels')
        .select('*')
        .order('display_order');
      if (levelsError) throw levelsError;
      if (levelsData) setEducationLevels(levelsData);
    } catch (err) {
      setProfileError(`Error fetching dropdown data: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !dateOfBirth || !gender || !educationLevel || !currentStatus || !locationState) {
      setProfileError('Please fill all required fields');
      return;
    }
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('phone', studentPhone)
        .single();
      if (studentError) throw studentError;
      if (!student) throw new Error('Student not found.');
      const { error: profileError } = await supabase
        .from('student_profiles')
        .update({
          email,
          date_of_birth: dateOfBirth,
          gender,
          education_level: educationLevel,
          current_status: currentStatus,
          location_state: locationState
        })
        .eq('student_id', student.id);
      if (profileError) throw profileError;
      setProfileSuccess('Profile Updated Successfully');
      await fetchProfileData();
    } catch (err) {
      setProfileError(`Failed to update profile: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
        borderRadius: '0.5rem',
        padding: '2rem',
        color: '#EDEDED',
        maxWidth: '700px',
        margin: '0 auto',
      }}
    >
      <h2 style={{ 
        color: '#f9fafb', 
        fontSize: '2rem', 
        fontWeight: '700', 
        marginBottom: '2rem',
        textAlign: 'center',
        letterSpacing: '0.5px',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      }}>
        Edit Profile
      </h2>
      
      <ProfileForm
        profile={profile}
        email={email}
        setEmail={setEmail}
        dateOfBirth={dateOfBirth}
        setDateOfBirth={setDateOfBirth}
        gender={gender}
        setGender={setGender}
        educationLevel={educationLevel}
        setEducationLevel={setEducationLevel}
        currentStatus={currentStatus}
        setCurrentStatus={setCurrentStatus}
        locationState={locationState}
        setLocationState={setLocationState}
        educationLevels={educationLevels}
        indianStates={indianStates}
        profileLoading={profileLoading}
        profileError={profileError}
        profileSuccess={profileSuccess}
        handleProfileUpdate={handleProfileUpdate}
      />
    </div>
  );
};

export default EditProfile;