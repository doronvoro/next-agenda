"use client";

import { useEffect, useState } from "react";
import { format, isValid } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import AgendaList from "./components/AgendaList";
import AgendaDetails from "./components/AgendaDetails";
import ProtocolMembers from "./components/ProtocolMembers";
import type {
  Committee,
  ProtocolMember,
  ProtocolAttachment,
  AgendaItem,
  EditingAgendaItem,
  NewAgendaItem,
  Protocol
} from "./types";
import { useProtocolData } from "./hooks/useProtocolData";
import { ConfirmDeleteAgendaItemDialog } from "./components/dialogs/ConfirmDeleteAgendaItemDialog";
import { ConfirmDeleteMemberDialog } from "./components/dialogs/ConfirmDeleteMemberDialog";
import { ConfirmDeleteAttachmentDialog } from "./components/dialogs/ConfirmDeleteAttachmentDialog";
import { AgendaItemDialog } from "./components/dialogs/AgendaItemDialog";
import { ProtocolEditForm } from "./components/ProtocolEditForm";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import ProtocolAttachments from "./components/ProtocolAttachments";
import ProtocolMessages from "./components/ProtocolMessages";
import { ProtocolDetailsFields } from "./components/ProtocolDetailsFields";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import {
  updateProtocol,
  updateAgendaItem,
  createAgendaItem as apiCreateAgendaItem,
  deleteAgendaItem as apiDeleteAgendaItem,
  updateAgendaItemById,
  uploadAttachment,
  deleteAttachment as apiDeleteAttachment,
  reorderAgendaItems,
  sendProtocolMessage,
  deleteMember as apiDeleteMember,
} from "./supabaseApi";
import { createClient } from "@/lib/supabase/client";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return isValid(date) ? format(date, "dd/MM/yyyy") : "Invalid date";
};

declare global {
  interface Window {
    __protocolNumber?: number;
  }
}

export default function ProtocolPage() {
  const params = useParams();
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
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);
  const [isAgendaItemDialogOpen, setIsAgendaItemDialogOpen] = useState(false);
  const [selectedAgendaItem, setSelectedAgendaItem] = useState<AgendaItem | null>(null);
  const [popupEditingAgendaItem, setPopupEditingAgendaItem] = useState<EditingAgendaItem | null>(null);
  const [isPopupEditing, setIsPopupEditing] = useState(false);
  const [isImprovingTopic, setIsImprovingTopic] = useState(false);
  const [isImprovingDecision, setIsImprovingDecision] = useState(false);
  const [topicOriginal, setTopicOriginal] = useState<string | null>(null);
  const [topicImproved, setTopicImproved] = useState<string | null>(null);
  const [decisionOriginal, setDecisionOriginal] = useState<string | null>(null);
  const [decisionImproved, setDecisionImproved] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    };
    fetchUser();
  }, []);

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
      // Validate required fields
      if (!editFormData.number || !editDate) {
        throw new Error("Please fill in all required fields");
      }
      if (!editFormData.committee_id) {
        setError("Please select a committee.");
        return;
      }
      const { error } = await updateProtocol(protocolId || '', {
        number: editFormData.number,
        committee_id: editFormData.committee_id,
        due_date: editDate.toISOString(),
      });
      if (error) throw error;
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
      const { error } = await updateAgendaItem(editingAgendaItem);
      if (error) throw error;
      setAgendaItems(prev => prev.map(item => item.id === editingAgendaItem.id ? { ...item, ...editingAgendaItem } : item));
      setEditingAgendaItem(null);
      toast({ title: "Success", description: "Agenda item updated successfully" });
    } catch (err) {
      console.error("Error updating agenda item:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      toast({ variant: "destructive", title: "Error", description: "Failed to update agenda item" });
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
      const maxOrder = Math.max(...agendaItems.map(item => item.display_order || 0), 0);
      const { data, error } = await apiCreateAgendaItem(protocolId || '', title, maxOrder + 1);
      if (error) throw error;
      setAgendaItems(prev => [...prev, data]);
      setNewAgendaItem({ title: "", isEditing: false });
      toast({ title: "Success", description: "Agenda item added successfully" });
    } catch (err) {
      console.error("Error creating agenda item:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setNewAgendaItem({ title: "", isEditing: false });
      toast({ variant: "destructive", title: "Error", description: "Failed to add agenda item" });
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
      const { error } = await apiDeleteAgendaItem(deletingAgendaItemId);
      if (error) throw error;
      setAgendaItems(prev => prev.filter(item => item.id !== deletingAgendaItemId));
      setDeletingAgendaItemId(null);
      toast({ title: "Success", description: "Agenda item deleted successfully" });
    } catch (err) {
      console.error("Error deleting agenda item:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      toast({ variant: "destructive", title: "Error", description: "Failed to delete agenda item" });
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
      const { error } = await updateAgendaItemById(popupEditingAgendaItem);
      if (error) throw error;
      setAgendaItems(prev => prev.map(item => item.id === popupEditingAgendaItem.id ? { ...item, ...popupEditingAgendaItem } : item));
      setSelectedAgendaItem(prev => prev && prev.id === popupEditingAgendaItem.id ? { ...prev, ...popupEditingAgendaItem } : prev);
      setIsPopupEditing(false);
      toast({ title: "Success", description: "Agenda item updated successfully" });
    } catch (err) {
      console.error("Error updating agenda item:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      toast({ variant: "destructive", title: "Error", description: "Failed to update agenda item" });
    }
  };

  // Member management functions
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = agendaItems.findIndex((item) => item.id === active.id);
      const newIndex = agendaItems.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(agendaItems, oldIndex, newIndex);
      try {
        await reorderAgendaItems(newItems);
        setAgendaItems(newItems.map((item, index) => ({ ...item, display_order: index + 1 })));
        toast({ title: "Success", description: "Agenda items reordered successfully" });
      } catch (err) {
        console.error("Error updating agenda item order:", err);
        setError(err instanceof Error ? err.message : "Failed to update agenda item order");
        await fetchData();
      }
    }
  };

  // Attachment management functions
  const handleUploadAttachment = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    try {
      if (!userId) throw new Error("No user ID");
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const attachmentData = await uploadAttachment(protocolId || '', file, userId);
        setProtocolAttachments(prev => [...prev, attachmentData]);
      }
      toast({ title: "Success", description: `Successfully uploaded ${files.length} file(s)` });
    } catch (err) {
      console.error("Error uploading attachments:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      toast({ variant: "destructive", title: "Error", description: "Failed to upload attachments" });
    }
  };

  const handleDeleteAttachment = async () => {
    if (!deletingAttachmentId) return;
    setError(null);
    try {
      const attachment = protocolAttachments.find(a => a.id === deletingAttachmentId);
      if (!attachment) throw new Error("Attachment not found");
      const { error } = await apiDeleteAttachment(deletingAttachmentId, attachment.file_path);
      if (error) throw error;
      setProtocolAttachments(prev => prev.filter(a => a.id !== deletingAttachmentId));
      setDeletingAttachmentId(null);
      toast({ title: "Success", description: "Attachment deleted successfully" });
    } catch (err) {
      console.error("Error deleting attachment:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      toast({ variant: "destructive", title: "Error", description: "Failed to delete attachment" });
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
              <ProtocolEditForm
                editFormData={editFormData}
                setEditFormData={setEditFormData}
                editDate={editDate}
                setEditDate={setEditDate}
                committees={committees}
                initialLoading={initialLoading}
                updateProtocol={updateProtocol}
                protocolId={protocolId}
                fetchData={fetchData}
              />
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
                    <ProtocolDetailsFields protocol={protocol} formatDate={formatDate} />

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
                  setProtocolMembers={setProtocolMembers}
                  setDeletingMemberId={setDeletingMemberId}
                  protocolId={protocolId}
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
                  formatDate={formatDate}
                  protocolId={protocolId}
                  protocolMembers={protocolMembers}
                  onMessageSent={msg => setProtocolMessages(prev => [...prev, msg])}
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
        onConfirm={async () => {
          if (!deletingMemberId) return;
          const { error } = await apiDeleteMember(deletingMemberId);
          if (!error) {
            setProtocolMembers(prev => prev.filter(m => m.id !== deletingMemberId));
            setDeletingMemberId(null);
          }
          // Optionally handle error (toast, etc.)
        }}
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
    </div>
  );
} 