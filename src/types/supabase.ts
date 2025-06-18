// Replace with your own types

export type Database = {
  auth: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          email_confirmed_at: string | null;
          created_at: string;
          updated_at: string;
          last_sign_in_at: string | null;
          raw_app_meta_data: Record<string, any>;
          raw_user_meta_data: Record<string, any>;
          is_super_admin: boolean | null;
          role: string | null;
          confirmed_at: string | null;
          invited_at: string | null;
          confirmation_token: string | null;
          confirmation_sent_at: string | null;
          recovery_token: string | null;
          recovery_sent_at: string | null;
          email_change_token_new: string | null;
          email_change: string | null;
          email_change_sent_at: string | null;
          last_sign_in_with_password: string | null;
          last_sign_in_with_sso: string | null;
          banned_until: string | null;
          reauthentication_token: string | null;
          reauthentication_sent_at: string | null;
          phone: string | null;
          phone_confirmed_at: string | null;
          phone_change: string | null;
          phone_change_token: string | null;
          phone_change_sent_at: string | null;
          email_change_confirm_status: number | null;
          is_sso_user: boolean | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          email?: string;
          email_confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          last_sign_in_at?: string | null;
          raw_app_meta_data?: Record<string, any>;
          raw_user_meta_data?: Record<string, any>;
          is_super_admin?: boolean | null;
          role?: string | null;
          confirmed_at?: string | null;
          invited_at?: string | null;
          confirmation_token?: string | null;
          confirmation_sent_at?: string | null;
          recovery_token?: string | null;
          recovery_sent_at?: string | null;
          email_change_token_new?: string | null;
          email_change?: string | null;
          email_change_sent_at?: string | null;
          last_sign_in_with_password?: string | null;
          last_sign_in_with_sso?: string | null;
          banned_until?: string | null;
          reauthentication_token?: string | null;
          reauthentication_sent_at?: string | null;
          phone?: string | null;
          phone_confirmed_at?: string | null;
          phone_change?: string | null;
          phone_change_token?: string | null;
          phone_change_sent_at?: string | null;
          email_change_confirm_status?: number | null;
          is_sso_user?: boolean | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          email_confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          last_sign_in_at?: string | null;
          raw_app_meta_data?: Record<string, any>;
          raw_user_meta_data?: Record<string, any>;
          is_super_admin?: boolean | null;
          role?: string | null;
          confirmed_at?: string | null;
          invited_at?: string | null;
          confirmation_token?: string | null;
          confirmation_sent_at?: string | null;
          recovery_token?: string | null;
          recovery_sent_at?: string | null;
          email_change_token_new?: string | null;
          email_change?: string | null;
          email_change_sent_at?: string | null;
          last_sign_in_with_password?: string | null;
          last_sign_in_with_sso?: string | null;
          banned_until?: string | null;
          reauthentication_token?: string | null;
          reauthentication_sent_at?: string | null;
          phone?: string | null;
          phone_confirmed_at?: string | null;
          phone_change?: string | null;
          phone_change_token?: string | null;
          phone_change_sent_at?: string | null;
          email_change_confirm_status?: number | null;
          is_sso_user?: boolean | null;
          deleted_at?: string | null;
        };
      };
    };
  };
  public: {
    Tables: {
      committees: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
          company_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
          company_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
          company_id?: string | null;
        };
      };
      committees_members: {
        Row: {
          id: string;
          committee_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          committee_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          committee_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      companies: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          address: string | null;
          number: string | null;
          organization_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          address?: string | null;
          number?: string | null;
          organization_id?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          address?: string | null;
          number?: string | null;
          organization_id?: string;
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
      protocol_members: {
        Row: {
          id: string;
          protocol_id: string;
          name: string | null;
          type: number;
          status: number;
          source_type: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          protocol_id: string;
          name?: string | null;
          type?: number;
          status?: number;
          source_type?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          protocol_id?: string;
          name?: string | null;
          type?: number;
          status?: number;
          source_type?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      roles: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};
