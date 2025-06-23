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
  
  // First, create the agenda item
  const { data: agendaItem, error: agendaError } = await supabase
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

  if (agendaError) {
    throw agendaError;
  }

  // Then, automatically create a default task for this agenda item
  try {
    await supabase
      .from("agenda_item_tasks")
      .insert([
        {
          agenda_item_id: agendaItem.id,
          title: `Follow up on: ${title.trim()}`,
          description: `Default task for agenda item: ${title.trim()}`,
          status: 'pending',
          priority: 'medium',
          assigned_to: null,
          due_date: null,
          updated_at: new Date().toISOString(),
        },
      ]);
  } catch (taskError) {
    // If task creation fails, we still return the agenda item
    // but log the error for debugging
    console.warn("Failed to create default task for agenda item:", taskError);
  }

  return { data: agendaItem, error: null };
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

export async function getProtocolViewData(protocolId: string) {
  const supabase = createClient();
  
  // Fetch protocol with committee data
  const { data: protocol, error: protocolError } = await supabase
    .from("protocols")
    .select("*, committees(*)")
    .eq("id", protocolId)
    .single();
  if (protocolError) throw protocolError;

  // Fetch company using committee.company_id
  let company = null;
  if (protocol?.committees?.company_id) {
    const { data: companyData } = await supabase
      .from("companies")
      .select("*")
      .eq("id", protocol.committees.company_id)
      .single();
    company = companyData;
  }

  // Fetch all related data
  const [agendaItemsResult, membersResult, attachmentsResult, messagesResult] = await Promise.all([
    supabase.from("agenda_items").select("*").eq("protocol_id", protocolId).order("display_order"),
    supabase.from("protocol_members").select("*").eq("protocol_id", protocolId),
    supabase.from("protocol_attachments").select("*").eq("protocol_id", protocolId),
    supabase.from("protocol_messages").select("*").eq("protocol_id", protocolId).order("created_at")
  ]);

  return {
    protocol,
    agendaItems: agendaItemsResult.data || [],
    protocolMembers: membersResult.data || [],
    protocolAttachments: attachmentsResult.data || [],
    protocolMessages: messagesResult.data || [],
    company
  };
} 