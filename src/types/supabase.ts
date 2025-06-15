// Replace with your own types

export interface Database {
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
      // Add other tables as needed
    };
  };
}
