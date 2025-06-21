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

export async function updateAgendaItemById(item: { id: string; title: string; topic_content: string; decision_content: string }) {
  const supabase = createClient();
  return supabase
    .from("agenda_items")
    .update({
      title: item.title,
      topic_content: item.topic_content,
      decision_content: item.decision_content,
    })
    .eq("id", item.id);
}

export async function uploadAttachment(protocolId: string, file: File, userId: string) {
  const supabase = createClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `protocols/${protocolId}/${fileName}`;

  // Upload file to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(filePath, file);
  if (uploadError) throw uploadError;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('attachments')
    .getPublicUrl(filePath);

  // Insert attachment record into database
  const { data: attachmentData, error: insertError } = await supabase
    .from("protocol_attachments")
    .insert({
      protocol_id: protocolId,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: userId,
      storage_object_id: uploadData?.id || null,
    })
    .select()
    .single();
  if (insertError) throw insertError;
  return attachmentData;
}

export async function deleteAttachment(attachmentId: string, filePath: string) {
  const supabase = createClient();
  // Delete file from storage
  const { error: storageError } = await supabase.storage
    .from('attachments')
    .remove([filePath]);
  // Delete record from database
  const { error } = await supabase
    .from("protocol_attachments")
    .delete()
    .eq("id", attachmentId);
  return { storageError, error };
}

export async function reorderAgendaItems(agendaItems: { id: string }[]) {
  const supabase = createClient();
  for (let i = 0; i < agendaItems.length; i++) {
    const { error } = await supabase
      .from("agenda_items")
      .update({ display_order: i + 1 })
      .eq("id", agendaItems[i].id);
    if (error) throw error;
  }
}

export async function sendProtocolMessage(protocolId: string, message: string, userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("protocol_messages")
    .insert({
      id: crypto.randomUUID(),
      protocol_id: protocolId,
      message,
      user_id: userId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProtocol(protocolId: string) {
  const supabase = createClient();
  
  // Delete related records first (due to foreign key constraints)
  const { error: messagesError } = await supabase
    .from("protocol_messages")
    .delete()
    .eq("protocol_id", protocolId);
  if (messagesError) throw messagesError;

  const { error: attachmentsError } = await supabase
    .from("protocol_attachments")
    .delete()
    .eq("protocol_id", protocolId);
  if (attachmentsError) throw attachmentsError;

  const { error: membersError } = await supabase
    .from("protocol_members")
    .delete()
    .eq("protocol_id", protocolId);
  if (membersError) throw membersError;

  const { error: agendaError } = await supabase
    .from("agenda_items")
    .delete()
    .eq("protocol_id", protocolId);
  if (agendaError) throw agendaError;

  // Delete the protocol
  const { error: protocolError } = await supabase
    .from("protocols")
    .delete()
    .eq("id", protocolId);
  if (protocolError) throw protocolError;

  return { success: true };
} 