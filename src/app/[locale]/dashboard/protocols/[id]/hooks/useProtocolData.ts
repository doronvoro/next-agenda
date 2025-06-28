import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  Protocol,
  AgendaItem,
  ProtocolMember,
  ProtocolMessage,
  ProtocolAttachment,
  Committee
} from "../types";
import type { Database } from "@/types/supabase";

type Company = Database["public"]["Tables"]["companies"]["Row"];

export function useProtocolData(protocolId: string) {
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [protocolMembers, setProtocolMembers] = useState<ProtocolMember[]>([]);
  const [protocolMessages, setProtocolMessages] = useState<ProtocolMessage[]>([]);
  const [protocolAttachments, setProtocolAttachments] = useState<ProtocolAttachment[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);

  const fetchCommittees = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("committees")
        .select("id, name")
        .order("name");
      if (error) throw error;
      setCommittees(data || []);
    } catch (err) {
      setError("Failed to load committees");
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      // Fetch protocol
      const { data: protocolData, error: protocolError } = await supabase
        .from("protocols")
        .select(`*, committee:committees!committee_id(*)`)
        .eq("id", protocolId)
        .single();
      if (protocolError) throw protocolError;
      setProtocol(protocolData);
      // Fetch company if committee exists
      if (protocolData?.committee?.company_id) {
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .select("*")
          .eq("id", protocolData.committee.company_id)
          .single();
        if (companyError) throw companyError;
        setCompany(companyData);
      } else {
        setCompany(null);
      }
      // Fetch agenda items
      const { data: agendaItemsData, error: agendaItemsError } = await supabase
        .from("agenda_items")
        .select("*")
        .eq("protocol_id", protocolId)
        .order("display_order", { ascending: true });
      if (agendaItemsError) throw agendaItemsError;
      setAgendaItems(agendaItemsData || []);
      // Fetch protocol members
      const { data: membersData, error: membersError } = await supabase
        .from("protocol_members")
        .select("*")
        .eq("protocol_id", protocolId)
        .order("created_at", { ascending: true });
      if (membersError) throw membersError;
      setProtocolMembers(membersData || []);
      // Fetch protocol messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("protocol_messages")
        .select("*")
        .eq("protocol_id", protocolId)
        .order("created_at", { ascending: true });
      if (messagesError) throw messagesError;
      setProtocolMessages(messagesData || []);
      // Fetch protocol attachments
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from("protocol_attachments")
        .select("*")
        .eq("protocol_id", protocolId)
        .order("created_at", { ascending: true });
      if (attachmentsError) throw attachmentsError;
      setProtocolAttachments(attachmentsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [protocolId]);

  useEffect(() => {
    fetchData();
    fetchCommittees();
  }, [fetchData, fetchCommittees]);

  return {
    protocol,
    agendaItems,
    protocolMembers,
    protocolMessages,
    protocolAttachments,
    committees,
    loading,
    error,
    refresh: fetchData,
    setAgendaItems,
    setProtocolMembers,
    setProtocolMessages,
    setProtocolAttachments,
    setProtocol,
    setError,
    company,
  };
} 