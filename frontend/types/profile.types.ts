export interface StudentProfile {
  id: string;
  phone: string;
  email?: string;
  full_name?: string;
  date_of_birth?: string;
  gender?: string;
  education_level?: string;
  current_status?: string;
  location_state?: string;
  created_at: string;
  updated_at?: string;
}

export interface EducationLevel {
  id: string;
  level_name: string;
  description?: string;
  order: number;
}

export interface UserPreferences {
  language: string;
  theme: 'light' | 'dark';
  notifications_enabled: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
}

export interface StudentStats {
  total_tests_taken: number;
  average_score: number;
  total_study_hours: number;
  subjects_studied: number;
  current_streak: number;
  longest_streak: number;
}
