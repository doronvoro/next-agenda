export type Committee = {
  id: string;
  name: string;
};

export type ProtocolMember = {
  id: string;
  name: string | null;
  type: number;
  status: number;
  source_type: number | null;
  vote_status: number | null;
  created_at: string;
};

export type ProtocolMessage = {
  id: string;
  protocol_id: string;
  message: string;
  user_id: string | null;
  created_at: string;
};

export type ProtocolAttachment = {
  id: string;
  protocol_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string | null;
  storage_object_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AgendaItem = {
  id: string;
  protocol_id: string | null;
  title: string;
  topic_content: string | null;
  decision_content: string | null;
  display_order: number | null;
  created_at: string;
};

export type EditingAgendaItem = {
  id: string;
  title: string;
  topic_content: string;
  decision_content: string;
};

export type NewAgendaItem = {
  title: string;
  isEditing: boolean;
};

export type EditingMember = {
  id: string;
  name: string;
  type: number;
  status: number;
  vote_status: number | null;
};

export type NewMember = {
  name: string;
  type: number;
  status: number;
  vote_status: number | null;
  isEditing: boolean;
};

import type { Database } from "@/types/supabase";
export type Protocol = Database["public"]["Tables"]["protocols"]["Row"] & {
  committee: Database["public"]["Tables"]["committees"]["Row"] | null;
}; 