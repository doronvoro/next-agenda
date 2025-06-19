"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, isValid } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarIcon, Pencil, Plus, Trash2, X, Check, Paperclip, Eye } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useToast } from "@/components/ui/use-toast";
import AgendaList from "./components/AgendaList";
import AgendaDetails from "./components/AgendaDetails";
import ProtocolMembers from "./components/ProtocolMembers";
import ProtocolAttachments from "./components/ProtocolAttachments";
import ProtocolMessages from "./components/ProtocolMessages";
import type {
  Committee,
  ProtocolMember,
  ProtocolMessage,
  ProtocolAttachment,
  AgendaItem,
  EditingAgendaItem,
  NewAgendaItem,
  EditingMember,
  NewMember,
  Protocol
} from "./types";
import { useProtocolData } from "./hooks/useProtocolData";
import { ConfirmDeleteAgendaItemDialog } from "./components/dialogs/ConfirmDeleteAgendaItemDialog";
import { ConfirmDeleteMemberDialog } from "./components/dialogs/ConfirmDeleteMemberDialog";
import { ConfirmDeleteAttachmentDialog } from "./components/dialogs/ConfirmDeleteAttachmentDialog";
import { AgendaItemDialog } from "./components/dialogs/AgendaItemDialog";
import { RecipientsDialog } from "./components/dialogs/RecipientsDialog";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return isValid(date) ? format(date, "dd/MM/yyyy") : "Invalid date";
};

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="space-y-1">
    <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
    <div className="text-lg">{value}</div>
  </div>
);

declare global {
  interface Window {
    __protocolNumber?: number;
  }
}

export default function ProtocolPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const protocolId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const {
    protocol,
    agendaItems,
    protocolMembers,
    protocolMessages,
    protocolAttachments,
    committees,
    loading: initialLoading,
    error,
    refresh: fetchData,
    setAgendaItems,
    setProtocolMembers,
    setProtocolMessages,
    setProtocolAttachments,
    setProtocol,
    setError,
  } = useProtocolData(protocolId);
  const [newMessage, setNewMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<{
    number: number;
    committee_id: string;
  }>({
    number: 0,
    committee_id: "",
  });
  const [editDate, setEditDate] = useState<Date>();
  const [mounted, setMounted] = useState(false);
  const [editingAgendaItem, setEditingAgendaItem] = useState<EditingAgendaItem | null>(null);
  const [isAddingAgendaItem, setIsAddingAgendaItem] = useState(false);
  const [newAgendaItem, setNewAgendaItem] = useState<NewAgendaItem>({
    title: "",
    isEditing: false,
  });
  const [deletingAgendaItemId, setDeletingAgendaItemId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState("content");
  const [editingMember, setEditingMember] = useState<EditingMember | null>(null);
  const [newMember, setNewMember] = useState<NewMember>({
    name: "",
    type: 1,
    status: 1,
    vote_status: null,
    isEditing: false,
  });
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);
  const [isAgendaItemDialogOpen, setIsAgendaItemDialogOpen] = useState(false);
  const [selectedAgendaItem, setSelectedAgendaItem] = useState<AgendaItem | null>(null);
  const [popupEditingAgendaItem, setPopupEditingAgendaItem] = useState<EditingAgendaItem | null>(null);
  const [isPopupEditing, setIsPopupEditing] = useState(false);
  const [isRecipientsDialogOpen, setIsRecipientsDialogOpen] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [isImprovingTopic, setIsImprovingTopic] = useState(false);
  const [isImprovingDecision, setIsImprovingDecision] = useState(false);
  const [topicOriginal, setTopicOriginal] = useState<string | null>(null);
  const [topicImproved, setTopicImproved] = useState<string | null>(null);
  const [decisionOriginal, setDecisionOriginal] = useState<string | null>(null);
  const [decisionImproved, setDecisionImproved] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [protocolId]);

  useEffect(() => {
    if (protocol && protocol.number) {
      if (typeof window !== 'undefined') {
        (window as any).__protocolNumber = protocol.number;
      }
    }
  }, [protocol]);

  const handleEdit = () => {
    if (protocol) {
      setEditFormData({
        number: protocol.number,
        committee_id: protocol.committee_id || "",
      });
      setEditDate(new Date(protocol.due_date));
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const supabase = createClient();

      // Validate required fields
      if (!editFormData.number || !editDate) {
        throw new Error("Please fill in all required fields");
      }

      const { error } = await supabase
        .from("protocols")
        .update({
          number: editFormData.number,
          committee_id: editFormData.committee_id || null,
          due_date: editDate.toISOString(),
        })
        .eq("id", protocolId);

      if (error) throw error;

      // Refresh the data
      await fetchData();
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating protocol:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleEditAgendaItem = (item: AgendaItem) => {
    setEditingAgendaItem({
      id: item.id,
      title: item.title,
      topic_content: item.topic_content || "",
      decision_content: item.decision_content || "",
    });
  };

  const handleCancelEditAgendaItem = () => {
    setEditingAgendaItem(null);
  };

  const handleUpdateAgendaItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgendaItem) return;

    setError(null);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("agenda_items")
        .update({
          title: editingAgendaItem.title,
          topic_content: editingAgendaItem.topic_content,
          decision_content: editingAgendaItem.decision_content,
        })
        .eq("id", editingAgendaItem.id);

      if (error) throw error;

      // Update the UI
      setAgendaItems(prev => 
        prev.map(item => 
          item.id === editingAgendaItem.id 
            ? { ...item, ...editingAgendaItem }
            : item
        )
      );
      
      setEditingAgendaItem(null);

      toast({
        title: "Success",
        description: "Agenda item updated successfully",
      });
    } catch (err) {
      console.error("Error updating agenda item:", err);
      setError(err instanceof Error ? err.message : "An error occurred");

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update agenda item",
      });
    }
  };

  const handleAddAgendaItem = () => {
    setIsAddingAgendaItem(true);
    setNewAgendaItem({
      title: "",
      isEditing: false,
    });
  };

  const handleCancelAddAgendaItem = () => {
    setIsAddingAgendaItem(false);
    setNewAgendaItem({
      title: "",
      isEditing: false,
    });
  };

  const handleCreateAgendaItem = async (title: string) => {
    if (!title.trim()) return;
    
    setError(null);

    try {
      const supabase = createClient();

      // Get the highest display_order
      const maxOrder = Math.max(...agendaItems.map(item => item.display_order || 0), 0);

      const { data, error } = await supabase
        .from("agenda_items")
        .insert([
          {
            protocol_id: protocolId,
            title: title.trim(),
            topic_content: "",
            decision_content: "",
            display_order: maxOrder + 1,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Add the new item to the UI
      setAgendaItems(prev => [...prev, data]);
      
      // Reset the new item input
      setNewAgendaItem({
        title: "",
        isEditing: false,
      });

      toast({
        title: "Success",
        description: "Agenda item added successfully",
      });
    } catch (err) {
      console.error("Error creating agenda item:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      // Reset the new item input on error
      setNewAgendaItem({
        title: "",
        isEditing: false,
      });

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add agenda item",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateAgendaItem(newAgendaItem.title);
    }
  };

  const handleBlur = () => {
    if (newAgendaItem.title.trim()) {
      handleCreateAgendaItem(newAgendaItem.title);
    } else {
      setNewAgendaItem({
        title: "",
        isEditing: false,
      });
    }
  };

  const handleDeleteAgendaItem = async () => {
    if (!deletingAgendaItemId) return;

    setError(null);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("agenda_items")
        .delete()
        .eq("id", deletingAgendaItemId);

      if (error) throw error;

      // Update the UI
      setAgendaItems(prev => prev.filter(item => item.id !== deletingAgendaItemId));
      setDeletingAgendaItemId(null);

      toast({
        title: "Success",
        description: "Agenda item deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting agenda item:", err);
      setError(err instanceof Error ? err.message : "An error occurred");

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete agenda item",
      });
    }
  };

  const handleOpenAgendaItemDialog = (item: AgendaItem) => {
    setSelectedAgendaItem(item);
    setPopupEditingAgendaItem({
      id: item.id,
      title: item.title,
      topic_content: item.topic_content || "",
      decision_content: item.decision_content || "",
    });
    setIsPopupEditing(false);
    setIsAgendaItemDialogOpen(true);
  };

  const handleCloseAgendaItemDialog = () => {
    setIsAgendaItemDialogOpen(false);
    setSelectedAgendaItem(null);
    setPopupEditingAgendaItem(null);
    setIsPopupEditing(false);
  };

  const handleStartPopupEdit = () => {
    setIsPopupEditing(true);
  };

  const handleCancelPopupEdit = () => {
    if (selectedAgendaItem) {
      setPopupEditingAgendaItem({
        id: selectedAgendaItem.id,
        title: selectedAgendaItem.title,
        topic_content: selectedAgendaItem.topic_content || "",
        decision_content: selectedAgendaItem.decision_content || "",
      });
    }
    setIsPopupEditing(false);
  };

  const handleUpdatePopupAgendaItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!popupEditingAgendaItem) return;

    setError(null);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("agenda_items")
        .update({
          title: popupEditingAgendaItem.title,
          topic_content: popupEditingAgendaItem.topic_content,
          decision_content: popupEditingAgendaItem.decision_content,
        })
        .eq("id", popupEditingAgendaItem.id);

      if (error) throw error;

      // Update the UI
      setAgendaItems(prev => 
        prev.map(item => 
          item.id === popupEditingAgendaItem.id 
            ? { ...item, ...popupEditingAgendaItem }
            : item
        )
      );
      
      // Update selected item for display
      setSelectedAgendaItem(prev => 
        prev && prev.id === popupEditingAgendaItem.id 
          ? { ...prev, ...popupEditingAgendaItem }
          : prev
      );
      
      setIsPopupEditing(false);

      toast({
        title: "Success",
        description: "Agenda item updated successfully",
      });
    } catch (err) {
      console.error("Error updating agenda item:", err);
      setError(err instanceof Error ? err.message : "An error occurred");

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update agenda item",
      });
    }
  };

  // Member management functions
  const handleEditMember = (member: ProtocolMember) => {
    setEditingMember({
      id: member.id,
      name: member.name || "",
      type: member.type,
      status: member.status,
      vote_status: member.vote_status,
    });
  };

  const handleCancelEditMember = () => {
    setEditingMember(null);
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setError(null);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("protocol_members")
        .update({
          name: editingMember.name,
          type: editingMember.type,
          status: editingMember.status,
          vote_status: editingMember.vote_status,
        })
        .eq("id", editingMember.id);

      if (error) throw error;

      // Update the UI
      setProtocolMembers(prev => 
        prev.map(member => 
          member.id === editingMember.id 
            ? { ...member, ...editingMember }
            : member
        )
      );
      
      setEditingMember(null);

      toast({
        title: "Success",
        description: "Member updated successfully",
      });
    } catch (err) {
      console.error("Error updating member:", err);
      setError(err instanceof Error ? err.message : "An error occurred");

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update member",
      });
    }
  };

  const handleAddMember = () => {
    setNewMember({
      name: "",
      type: 1,
      status: 1,
      vote_status: null,
      isEditing: true,
    });
  };

  const handleCancelAddMember = () => {
    setNewMember({
      name: "",
      type: 1,
      status: 1,
      vote_status: null,
      isEditing: false,
    });
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name.trim()) return;
    
    setError(null);

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("protocol_members")
        .insert([
          {
            protocol_id: protocolId,
            name: newMember.name.trim(),
            type: newMember.type,
            status: newMember.status,
            source_type: null,
            vote_status: newMember.vote_status,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Add the new member to the UI
      setProtocolMembers(prev => [...prev, data]);
      
      // Reset the new member input
      setNewMember({
        name: "",
        type: 1,
        status: 1,
        vote_status: null,
        isEditing: false,
      });

      toast({
        title: "Success",
        description: "Member added successfully",
      });
    } catch (err) {
      console.error("Error creating member:", err);
      setError(err instanceof Error ? err.message : "An error occurred");

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add member",
      });
    }
  };

  const handleDeleteMember = async () => {
    if (!deletingMemberId) return;

    setError(null);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("protocol_members")
        .delete()
        .eq("id", deletingMemberId);

      if (error) throw error;

      // Update the UI
      setProtocolMembers(prev => prev.filter(member => member.id !== deletingMemberId));
      setDeletingMemberId(null);

      toast({
        title: "Success",
        description: "Member deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting member:", err);
      setError(err instanceof Error ? err.message : "An error occurred");

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete member",
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = agendaItems.findIndex((item) => item.id === active.id);
      const newIndex = agendaItems.findIndex((item) => item.id === over.id);
      
      // Create new array with updated order
      const newItems = arrayMove(agendaItems, oldIndex, newIndex);
      
      try {
        const supabase = createClient();
        
        // Update display_order for each item individually
        for (let i = 0; i < newItems.length; i++) {
          const { error } = await supabase
            .from("agenda_items")
            .update({ display_order: i + 1 })
            .eq("id", newItems[i].id);

          if (error) {
            console.error("Supabase error:", error);
            throw new Error(error.message);
          }
        }

        // Update the UI with the new order
        setAgendaItems(newItems.map((item, index) => ({
          ...item,
          display_order: index + 1
        })));

        toast({
          title: "Success",
          description: "Agenda items reordered successfully",
        });
      } catch (err) {
        console.error("Error updating agenda item order:", err);
        setError(err instanceof Error ? err.message : "Failed to update agenda item order");
        // Refresh data to ensure consistency
        await fetchData();

        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to reorder agenda items",
        });
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const supabase = createClient();

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await supabase
        .from("protocol_messages")
        .insert({
          id: crypto.randomUUID(),
          protocol_id: protocolId,
          message: newMessage.trim(),
          user_id: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      setProtocolMessages(prev => [...prev, data]);
      setNewMessage("");
      
      toast({
        title: "Success",
        description: "Message sent successfully",
      });
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err instanceof Error ? err.message : "An error occurred");

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message",
      });
    }
  };

  // Attachment management functions
  const handleUploadAttachment = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);

    try {
      const supabase = createClient();

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Generate unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `protocols/${protocolId}/${fileName}`;

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

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
            uploaded_by: user?.id || null,
            storage_object_id: uploadData?.id || null,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting attachment record:', insertError);
          throw new Error(`Failed to save attachment record for ${file.name}: ${insertError.message}`);
        }

        // Add to UI
        setProtocolAttachments(prev => [...prev, attachmentData]);
      }

      toast({
        title: "Success",
        description: `Successfully uploaded ${files.length} file(s)`,
      });
    } catch (err) {
      console.error("Error uploading attachments:", err);
      setError(err instanceof Error ? err.message : "An error occurred");

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload attachments",
      });
    }
  };

  const handleDeleteAttachment = async () => {
    if (!deletingAttachmentId) return;

    setError(null);

    try {
      const supabase = createClient();

      // Get attachment details
      const attachment = protocolAttachments.find(a => a.id === deletingAttachmentId);
      if (!attachment) {
        throw new Error("Attachment not found");
      }

      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('attachments')
        .remove([attachment.file_path]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }

      // Delete record from database
      const { error } = await supabase
        .from("protocol_attachments")
        .delete()
        .eq("id", deletingAttachmentId);

      if (error) throw error;

      // Update the UI
      setProtocolAttachments(prev => prev.filter(attachment => attachment.id !== deletingAttachmentId));
      setDeletingAttachmentId(null);

      toast({
        title: "Success",
        description: "Attachment deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting attachment:", err);
      setError(err instanceof Error ? err.message : "An error occurred");

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete attachment",
      });
    }
  };

  const handleOpenRecipientsDialog = () => {
    setIsRecipientsDialogOpen(true);
  };

  const handleCloseRecipientsDialog = () => {
    setIsRecipientsDialogOpen(false);
  };

  const handleCancelRecipientsDialog = () => {
    setIsRecipientsDialogOpen(false);
    setSelectedRecipients([]);
  };

  const handleRecipientToggle = (memberId: string) => {
    setSelectedRecipients(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSelectAllRecipients = () => {
    setSelectedRecipients(protocolMembers.map(member => member.id));
  };

  const handleClearAllRecipients = () => {
    setSelectedRecipients([]);
  };

  const handleTemplateChange = (template: string) => {
    setSelectedTemplate(template);
    // You can add template-specific message content here if needed
    switch (template) {
      case "select-template":
        setNewMessage("");
        break;
      case "pre-meeting materials":
        setNewMessage("Pre-meeting materials are now available for review.");
        break;
      case "protocol approval":
        setNewMessage("Protocol approval is required. Please review and approve.");
        break;
      case "general message":
        setNewMessage("");
        break;
      default:
        setNewMessage("");
    }
  };

  // Handler for AI improvement
  const handleImprovePopupText = async (
    field: 'topic_content' | 'decision_content',
    text: string
  ) => {
    if (!popupEditingAgendaItem || !text.trim()) return;
    if (field === 'topic_content') setIsImprovingTopic(true);
    if (field === 'decision_content') setIsImprovingDecision(true);
    try {
      const response = await fetch('/api/improve-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (data.improvedText) {
        if (field === 'topic_content') {
          setTopicOriginal(text);
          setTopicImproved(data.improvedText);
        } else {
          setDecisionOriginal(text);
          setDecisionImproved(data.improvedText);
        }
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to improve text",
      });
    } finally {
      if (field === 'topic_content') setIsImprovingTopic(false);
      if (field === 'decision_content') setIsImprovingDecision(false);
    }
  };

  const handleAcceptImproved = (field: 'topic_content' | 'decision_content') => {
    if (!popupEditingAgendaItem) return;
    if (field === 'topic_content' && topicImproved) {
      setPopupEditingAgendaItem(prev => prev ? { ...prev, topic_content: topicImproved } : null);
      setTopicOriginal(null);
      setTopicImproved(null);
    }
    if (field === 'decision_content' && decisionImproved) {
      setPopupEditingAgendaItem(prev => prev ? { ...prev, decision_content: decisionImproved } : null);
      setDecisionOriginal(null);
      setDecisionImproved(null);
    }
  };

  const handleRevertImproved = (field: 'topic_content' | 'decision_content') => {
    if (field === 'topic_content') {
      setTopicOriginal(null);
      setTopicImproved(null);
    }
    if (field === 'decision_content') {
      setDecisionOriginal(null);
      setDecisionImproved(null);
    }
  };

  if (!mounted) {
    return null;
  }

  if (initialLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading protocol...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-500">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!protocol) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Protocol not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/dashboard/protocols">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Protocols
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl">
              {isEditing ? "Edit Protocol" : `Protocol #${protocol?.number}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing && (
              <form onSubmit={handleUpdate} className="space-y-6 mb-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="number">Protocol Number *</Label>
                    <Input
                      id="number"
                      type="number"
                      value={editFormData.number.toString()}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, number: parseInt(e.target.value) || 0 })
                      }
                      placeholder="Enter protocol number"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="committee">Committee</Label>
                    <Select
                      value={editFormData.committee_id}
                      onValueChange={(value) =>
                        setEditFormData({ ...editFormData, committee_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a committee" />
                      </SelectTrigger>
                      <SelectContent>
                        {committees.map((committee) => (
                          <SelectItem key={committee.id} value={committee.id}>
                            {committee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Due Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !editDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editDate ? format(editDate, "dd/MM/yyyy") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={editDate}
                          onSelect={(date: Date | undefined) => setEditDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-red-500">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleCancelEdit}
                    disabled={initialLoading}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button 
                    type="submit" 
                    variant="ghost"
                    size="icon"
                    disabled={initialLoading}
                    className="h-8 w-8"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}

            <Tabs defaultValue="content" className="w-full" value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="attachments">Attachments</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
              </TabsList>
              <TabsContent value="content" className="mt-6">
                <div className="grid gap-6">
                  {!isEditing && (
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleEdit}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Protocol Number" value={protocol.number} />
                      <Field label="Due Date" value={formatDate(protocol.due_date)} />
                      <Field label="Created At" value={formatDate(protocol.created_at)} />
                      <Field label="Last Updated" value={formatDate(protocol.updated_at)} />
                      <Field 
                        label="Committee" 
                        value={
                          <div className="flex items-center gap-2">
                            <span>{protocol.committee?.name || "Not assigned"}</span>
                          </div>
                        } 
                      />
                    </div>

                    <Separator />

                    <div className="grid gap-4">
                     Commit <h3 className="text-lg font-medium">Agenda</h3>
                      <AgendaList
                        agendaItems={agendaItems}
                        newAgendaItem={newAgendaItem}
                        setNewAgendaItem={setNewAgendaItem}
                        handleKeyDown={handleKeyDown}
                        handleBlur={handleBlur}
                        handleCreateAgendaItem={handleCreateAgendaItem}
                        handleDragEnd={handleDragEnd}
                        handleOpenAgendaItemDialog={handleOpenAgendaItemDialog}
                      />
                    </div>

                    <Separator />

                    <div className="grid gap-6">
                      <h3 className="text-lg font-medium">Agenda Items Details</h3>
                      <AgendaDetails
                        agendaItems={agendaItems}
                        editingAgendaItem={editingAgendaItem}
                        handleEditAgendaItem={handleEditAgendaItem}
                        handleCancelEditAgendaItem={handleCancelEditAgendaItem}
                        handleUpdateAgendaItem={handleUpdateAgendaItem}
                        setEditingAgendaItem={setEditingAgendaItem}
                        handleOpenAgendaItemDialog={handleOpenAgendaItemDialog}
                        setDeletingAgendaItemId={setDeletingAgendaItemId}
                        initialLoading={initialLoading}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="members" className="mt-6">
                <ProtocolMembers
                  protocolMembers={protocolMembers}
                  editingMember={editingMember}
                  newMember={newMember}
                  handleAddMember={handleAddMember}
                  handleCancelAddMember={handleCancelAddMember}
                  handleCreateMember={handleCreateMember}
                  setNewMember={setNewMember}
                  handleEditMember={handleEditMember}
                  handleCancelEditMember={handleCancelEditMember}
                  handleUpdateMember={handleUpdateMember}
                  setEditingMember={setEditingMember}
                  setDeletingMemberId={setDeletingMemberId}
                />
              </TabsContent>
              <TabsContent value="attachments" className="mt-6">
                <ProtocolAttachments
                  protocolAttachments={protocolAttachments}
                  handleUploadAttachment={handleUploadAttachment}
                  setDeletingAttachmentId={setDeletingAttachmentId}
                  formatDate={formatDate}
                />
              </TabsContent>
              <TabsContent value="messages" className="mt-6">
                <ProtocolMessages
                  protocolMessages={protocolMessages}
                  newMessage={newMessage}
                  selectedRecipients={selectedRecipients}
                  selectedTemplate={selectedTemplate}
                  handleSendMessage={handleSendMessage}
                  setNewMessage={setNewMessage}
                  handleOpenRecipientsDialog={handleOpenRecipientsDialog}
                  handleTemplateChange={handleTemplateChange}
                  formatDate={formatDate}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <ConfirmDeleteAgendaItemDialog
        open={!!deletingAgendaItemId}
        onOpenChange={() => setDeletingAgendaItemId(null)}
        onConfirm={handleDeleteAgendaItem}
      />

      <ConfirmDeleteMemberDialog
        open={!!deletingMemberId}
        onOpenChange={() => setDeletingMemberId(null)}
        onConfirm={handleDeleteMember}
      />

      <ConfirmDeleteAttachmentDialog
        open={!!deletingAttachmentId}
        onOpenChange={() => setDeletingAttachmentId(null)}
        onConfirm={handleDeleteAttachment}
      />

      <AgendaItemDialog
        open={isAgendaItemDialogOpen}
        onOpenChange={setIsAgendaItemDialogOpen}
        selectedAgendaItem={selectedAgendaItem}
        isPopupEditing={isPopupEditing}
        popupEditingAgendaItem={popupEditingAgendaItem}
        setPopupEditingAgendaItem={setPopupEditingAgendaItem}
        onStartEdit={handleStartPopupEdit}
        onCancelEdit={handleCancelPopupEdit}
        onClose={handleCloseAgendaItemDialog}
        onSubmit={handleUpdatePopupAgendaItem}
        onImproveText={handleImprovePopupText}
        onAcceptImproved={handleAcceptImproved}
        onRevertImproved={handleRevertImproved}
        isImprovingTopic={isImprovingTopic}
        isImprovingDecision={isImprovingDecision}
        topicImproved={topicImproved}
        topicOriginal={topicOriginal}
        decisionImproved={decisionImproved}
        decisionOriginal={decisionOriginal}
      />

      <RecipientsDialog
        open={isRecipientsDialogOpen}
        onOpenChange={setIsRecipientsDialogOpen}
        protocolMembers={protocolMembers}
        selectedRecipients={selectedRecipients}
        onRecipientToggle={handleRecipientToggle}
        onSelectAll={handleSelectAllRecipients}
        onClearAll={handleClearAllRecipients}
        onCancel={handleCancelRecipientsDialog}
        onConfirm={handleCloseRecipientsDialog}
      />
    </div>
  );
} 