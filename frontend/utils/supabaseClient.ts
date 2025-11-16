// Mock Supabase client for development
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    signUp: async () => ({ data: null, error: null }),
    signIn: async () => ({ data: null, error: null }),
    signOut: async () => ({ error: null }),
  },
  from: (table: string) => ({
    select: () => ({
      eq: () => ({ data: [], error: null }),
      single: () => ({ data: null, error: null }),
    }),
    insert: () => ({ data: null, error: null }),
    update: () => ({ data: null, error: null }),
    delete: () => ({ data: null, error: null }),
  }),
};

export const getCredential = async () => {
  return null;
};
