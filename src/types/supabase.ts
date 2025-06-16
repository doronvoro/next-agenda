// Replace with your own types

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          created_at: string;
          // Add other fields as needed
        };
        Insert: {
          id: string;
          created_at?: string;
          // Add other fields as needed
        };
        Update: {
          id?: string;
          created_at?: string;
          // Add other fields as needed
        };
      };
      committees: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      protocols: {
        Row: {
          id: string;
          number: number;
          due_date: string;
          committee_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          number: number;
          due_date: string;
          committee_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          number?: number;
          due_date?: string;
          committee_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Add other tables as needed
    };
  };
};
