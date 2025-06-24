import { createClient } from "@/lib/supabase/client";
import type { EditingAgendaItem, NewAgendaItem, EditingMember, NewMember } from "./types";
import type { Task } from '@/components/KanbanBoard';
import type { Protocol, AgendaItem } from './types';

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

export async function createAgendaItem(protocolId: string, title: string, display_order: number, topic_content?: string) {
  const supabase = createClient();
  
  // First, create the agenda item
  const { data: agendaItem, error: agendaError } = await supabase
    .from("agenda_items")
    .insert([
      {
        protocol_id: protocolId,
        title: title.trim(),
        topic_content: topic_content || "",
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

// --- Protocol Task Tracking API ---

export async function fetchProtocol(protocolId: string): Promise<Protocol | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('protocols')
    .select('id, number, due_date')
    .eq('id', protocolId)
    .single();
  if (error) {
    console.error('Error fetching protocol:', error);
    return null;
  }
  return data as Protocol;
}

export async function fetchAgendaItemsByProtocol(protocolId: string): Promise<AgendaItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('agenda_items')
    .select('id, title')
    .eq('protocol_id', protocolId);
  if (error) {
    console.error('Error fetching agenda items:', error);
    return [];
  }
  return data as AgendaItem[];
}

export async function fetchTasksByAgendaItemIds(agendaItemIds: string[]): Promise<Task[]> {
  if (!agendaItemIds.length) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from('agenda_item_tasks')
    .select('*')
    .in('agenda_item_id', agendaItemIds)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
  return (data || []) as Task[];
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<boolean> {
  const supabase = createClient();
  const updateData: any = { ...updates };
  if (updates.status || updates.priority || updates.title || updates.description) {
    updateData.updated_at = new Date().toISOString();
  }
  const { error } = await supabase
    .from('agenda_item_tasks')
    .update(updateData)
    .eq('id', taskId);
  if (error) {
    console.error('Error updating task:', error);
    return false;
  }
  return true;
}

export async function createTask(taskData: {
  agenda_item_id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigned_to?: string | null;
  due_date?: string | null;
}): Promise<Task | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('agenda_item_tasks')
    .insert([{
      ...taskData,
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating task:', error);
    return null;
  }
  
  return data as Task;
}

// --- Task Tracking API ---

export interface TaskWithDetails extends Task {
  agenda_item: {
    id: string;
    title: string;
    protocol_id: string;
  };
  protocol: {
    id: string;
    number: number;
    committee: {
      id: string;
      name: string;
    } | null;
  };
}

export async function fetchAllTasks(): Promise<TaskWithDetails[]> {
  const supabase = createClient();
  
  const { data: tasksData, error: tasksError } = await supabase
    .from("agenda_item_tasks")
    .select(`
      *,
      agenda_item:agenda_items!agenda_item_id(
        id,
        title,
        protocol_id
      ),
      protocol:agenda_items!agenda_item_id(
        protocols!protocol_id(
          id,
          number,
          committee:committees!committee_id(
            id,
            name
          )
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (tasksError) {
    console.error("Error fetching tasks:", tasksError);
    throw tasksError;
  }

  // Transform the data to flatten the nested structure
  const transformedTasks: TaskWithDetails[] = (tasksData || []).map((task: any) => ({
    ...task,
    protocol: task.protocol?.protocols || null,
  }));

  return transformedTasks;
}

export async function deleteTask(taskId: string): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("agenda_item_tasks")
    .delete()
    .eq("id", taskId);

  if (error) {
    console.error("Error deleting task:", error);
    throw error;
  }

  return true;
}

// --- Cascading Filter API ---

export interface Company {
  id: string;
  name: string;
}

export interface Committee {
  id: string;
  name: string;
  company_id: string;
}

export interface ProtocolForFilter {
  id: string;
  number: number;
  committee_id: string;
}

export async function fetchCompanies(): Promise<Company[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("companies")
    .select("id, name")
    .order("name");

  if (error) {
    console.error("Error fetching companies:", error);
    throw error;
  }

  return data || [];
}

export async function fetchCommitteesByCompany(companyId: string): Promise<Committee[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("committees")
    .select("id, name, company_id")
    .eq("company_id", companyId)
    .order("name");

  if (error) {
    console.error("Error fetching committees:", error);
    throw error;
  }

  return data || [];
}

export async function fetchProtocolsByCommittee(committeeId: string): Promise<ProtocolForFilter[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("protocols")
    .select("id, number, committee_id")
    .eq("committee_id", committeeId)
    .order("number", { ascending: false });

  if (error) {
    console.error("Error fetching protocols:", error);
    throw error;
  }

  return data || [];
}

export async function fetchTasksWithCascadingFilters(filters: {
  search?: string;
  status?: string;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
  companyId?: string | null;
  committeeId?: string | null;
  protocolId?: string | null;
}): Promise<TaskWithDetails[]> {
  const supabase = createClient();
  
  let query = supabase
    .from("agenda_item_tasks")
    .select(`
      *,
      agenda_items (
        id,
        title,
        protocols (
          id,
          number,
          committees (
            id,
            name,
            companies (
              id,
              name
            )
          )
        )
      )
    `);

  // Apply search filter
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  // Apply status filter
  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  // Apply priority filter
  if (filters.priority) {
    query = query.eq("priority", filters.priority);
  }

  // Apply date range filters
  if (filters.dateFrom) {
    query = query.gte("due_date", filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte("due_date", filters.dateTo);
  }

  // Apply cascading filters
  if (filters.protocolId) {
    query = query.eq("agenda_items.protocols.id", filters.protocolId);
  } else if (filters.committeeId) {
    query = query.eq("agenda_items.protocols.committees.id", filters.committeeId);
  } else if (filters.companyId) {
    query = query.eq("agenda_items.protocols.committees.companies.id", filters.companyId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tasks with cascading filters:", error);
    throw error;
  }

  // Transform the data to match TaskWithDetails interface
  const transformedData: TaskWithDetails[] = (data || []).map((task: any) => ({
    ...task,
    agenda_item: {
      id: task.agenda_items.id,
      title: task.agenda_items.title,
      protocol_id: task.agenda_items.protocols?.id || "",
    },
    protocol: task.agenda_items.protocols ? {
      id: task.agenda_items.protocols.id,
      number: task.agenda_items.protocols.number,
      committee: task.agenda_items.protocols.committees ? {
        id: task.agenda_items.protocols.committees.id,
        name: task.agenda_items.protocols.committees.name,
      } : null,
    } : null,
  }));

  return transformedData;
}

export async function updateFutureTopic(topicId: string, relatedAgendaItemId: string | null) {
  const supabase = createClient();
  return supabase
    .from("future_topics")
    .update({
      related_agenda_item_id: relatedAgendaItemId,
    })
    .eq("id", topicId);
}

export async function unlinkFutureTopicsFromAgendaItem(agendaItemId: string) {
  const supabase = createClient();
  return supabase
    .from("future_topics")
    .update({
      related_agenda_item_id: null,
    })
    .eq("related_agenda_item_id", agendaItemId);
}

export async function fetchFutureTopicsWithoutAgendaItem() {
  const supabase = createClient();
  return supabase
    .from("future_topics")
    .select("*")
    .is("related_agenda_item_id", null)
    .order("created_at", { ascending: false });
}

export async function addCommitteeMembersToProtocol(committeeId: string, protocolId: string) {
  const supabase = createClient();

  // Fetch committee members
  const { data: committeeMembers, error: membersError } = await supabase
    .from("committees_members")
    .select("name")
    .eq("committee_id", committeeId);

  if (membersError) {
    console.error("Error fetching committee members:", membersError);
    return { error: membersError };
  }

  if (committeeMembers && committeeMembers.length > 0) {
    // Create protocol members from committee members
    const protocolMembersData = committeeMembers.map(member => ({
      protocol_id: protocolId,
      name: member.name,
      type: 1, // Default type
      status: 2, // Default status changed from 1 to 2
      source_type: 1, // Committee member source type
    }));

    const { error: insertMembersError } = await supabase
      .from("protocol_members")
      .insert(protocolMembersData);

    if (insertMembersError) {
      console.error("Error inserting protocol members:", insertMembersError);
      return { error: insertMembersError };
    }
  }

  return { error: null };
} 