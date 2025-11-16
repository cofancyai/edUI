import { createClient } from '@supabase/supabase-js';

// Mock Supabase client for development
// Replace with actual Supabase URL and anon key in production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Mock data helper functions
export const mockSupabaseCall = <T>(data: T, delay: number = 500): Promise<{ data: T; error: null }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data, error: null });
    }, delay);
  });
};

export const mockSupabaseError = (message: string, delay: number = 500): Promise<{ data: null; error: Error }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: null, error: new Error(message) });
    }, delay);
  });
};
