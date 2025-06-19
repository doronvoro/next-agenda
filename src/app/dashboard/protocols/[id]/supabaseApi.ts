import { createClient } from "@/lib/supabase/client";
import type { EditingAgendaItem, NewAgendaItem, EditingMember, NewMember } from "./types";

export async function updateProtocol(protocolId: string, updateData: { number: number; committee_id: string; due_date: string }) {
  const supabase = createClient();
  return supabase
    .from("protocols")
    .update(updateData)
    .eq("id", protocolId);
}

export async function updateAgendaItem(editingAgendaItem: EditingAgendaItem) {
  const supabase = createClient();
  return supabase
    .from("agenda_items")
    .update({
      title: editingAgendaItem.title,
      topic_content: editingAgendaItem.topic_content,
      decision_content: editingAgendaItem.decision_content,
    })
    .eq("id", editingAgendaItem.id);
}

export async function createAgendaItem(protocolId: string, title: string, display_order: number) {
  const supabase = createClient();
  return supabase
    .from("agenda_items")
    .insert([
      {
        protocol_id: protocolId,
        title: title.trim(),
        topic_content: "",
        decision_content: "",
        display_order,
      },
    ])
    .select()
    .single();
}

export async function deleteAgendaItem(agendaItemId: string) {
  const supabase = createClient();
  return supabase
    .from("agenda_items")
    .delete()
    .eq("id", agendaItemId);
}

export async function updateMember(editingMember: EditingMember) {
  const supabase = createClient();
  return supabase
    .from("protocol_members")
    .update({
      name: editingMember.name,
      type: editingMember.type,
      status: editingMember.status,
      vote_status: editingMember.vote_status,
    })
    .eq("id", editingMember.id);
}

export async function createMember(protocolId: string, newMember: NewMember) {
  const supabase = createClient();
  return supabase
    .from("protocol_members")
    .insert([
      {
        protocol_id: protocolId,
        name: newMember.name,
        type: newMember.type,
        status: newMember.status,
        vote_status: newMember.vote_status,
      },
    ])
    .select()
    .single();
}

export async function deleteMember(memberId: string) {
  const supabase = createClient();
  return supabase
    .from("protocol_members")
    .delete()
    .eq("id", memberId);
} 