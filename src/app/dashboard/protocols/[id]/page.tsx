"use client";

import { useEffect, useState } from "react";
import { format, isValid } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, FileText } from "lucide-react";
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
import ProtocolAttachments from "./components/ProtocolAttachments";
import ProtocolMessages from "./components/ProtocolMessages";
import { ProtocolDetailsFields } from "./components/ProtocolDetailsFields";
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
import { useAgendaItems } from "./hooks/useAgendaItems";
import { useTextImprovement } from "./hooks/useTextImprovement";
import { useAttachments } from "./hooks/useAttachments";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProtocolPdfView from "./components/ProtocolPdfView";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    company,
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
  const [currentTab, setCurrentTab] = useState("content");
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [isAgendaItemDialogOpen, setIsAgendaItemDialogOpen] = useState(false);
  const [selectedAgendaItem, setSelectedAgendaItem] = useState<AgendaItem | null>(null);
  const [popupEditingAgendaItem, setPopupEditingAgendaItem] = useState<EditingAgendaItem | null>(null);
  const [isPopupEditing, setIsPopupEditing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const agendaApi = {
    updateAgendaItem: async (item: EditingAgendaItem) => {
      const { error } = await updateAgendaItem(item);
      return { error };
    },
    createAgendaItem: async (protocolId: string, title: string, displayOrder: number) => {
      const { data, error } = await apiCreateAgendaItem(protocolId, title, displayOrder);
      return { data, error };
    },
    deleteAgendaItem: async (id: string) => {
      const { error } = await apiDeleteAgendaItem(id);
      return { error };
    },
    reorderAgendaItems: async (items: AgendaItem[]) => {
      await reorderAgendaItems(items);
    },
  };

  const agendaItemsHook = useAgendaItems(
    agendaItems,
    setAgendaItems,
    agendaApi,
    protocolId,
    toast,
    setError
  );

  const {
    isImproving,
    original,
    improved,
    handleImprove,
    handleAccept,
    handleRevert,
  } = useTextImprovement(toast);

  const attachmentsHook = useAttachments({
    protocolId,
    userId,
    uploadAttachment,
    apiDeleteAttachment,
    toast,
    setError,
    protocolAttachments,
    setProtocolAttachments,
  });

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
            <div className="flex items-center gap-2">
              <CardTitle className="text-2xl">
                {isEditing ? "Edit Protocol" : `Protocol #${protocol?.number}`}
              </CardTitle>
              {!isEditing && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setIsPdfModalOpen(true)} className="h-8 w-8">
                        <FileText className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View as PDF</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="content" className="w-full" value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="attachments">Attachments</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
              </TabsList>
              <TabsContent value="content" className="mt-6">
                <div className="grid gap-6">
                  {isEditing ? (
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
                      onCancel={() => setIsEditing(false)}
                    />
                  ) : (
                    <>
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
                      <div className="grid gap-4">
                        <ProtocolDetailsFields protocol={protocol} formatDate={formatDate} company={company ?? undefined} />
                      </div>
                    </>
                  )}
                  <Separator />
                  <div className="grid gap-4">
                    <h3 className="text-lg font-medium">Agenda</h3>
                    <AgendaList
                      agendaItems={agendaItems}
                      newAgendaItem={agendaItemsHook.newAgendaItem}
                      setNewAgendaItem={agendaItemsHook.setNewAgendaItem}
                      handleKeyDown={agendaItemsHook.handleKeyDown}
                      handleBlur={agendaItemsHook.handleBlur}
                      handleCreateAgendaItem={agendaItemsHook.handleCreateAgendaItem}
                      handleDragEnd={agendaItemsHook.handleDragEnd}
                      handleOpenAgendaItemDialog={handleOpenAgendaItemDialog}
                    />
                  </div>
                  <Separator />
                  <div className="grid gap-6">
                    <h3 className="text-lg font-medium">Agenda Items Details</h3>
                    <AgendaDetails
                      agendaItems={agendaItems}
                      editingAgendaItem={agendaItemsHook.editingAgendaItem}
                      handleEditAgendaItem={agendaItemsHook.handleEditAgendaItem}
                      handleCancelEditAgendaItem={agendaItemsHook.handleCancelEditAgendaItem}
                      handleUpdateAgendaItem={agendaItemsHook.handleUpdateAgendaItem}
                      setEditingAgendaItem={agendaItemsHook.setEditingAgendaItem}
                      handleOpenAgendaItemDialog={handleOpenAgendaItemDialog}
                      setDeletingAgendaItemId={agendaItemsHook.setDeletingAgendaItemId}
                      initialLoading={initialLoading}
                    />
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
                  handleUploadAttachment={attachmentsHook.handleUploadAttachment}
                  setDeletingAttachmentId={attachmentsHook.setDeletingAttachmentId}
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
        open={!!agendaItemsHook.deletingAgendaItemId}
        onOpenChange={() => agendaItemsHook.setDeletingAgendaItemId(null)}
        onConfirm={agendaItemsHook.handleDeleteAgendaItem}
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
        open={!!attachmentsHook.deletingAttachmentId}
        onOpenChange={() => attachmentsHook.setDeletingAttachmentId(null)}
        onConfirm={attachmentsHook.handleDeleteAttachment}
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
        onImproveText={handleImprove}
        onAcceptImproved={(field) => handleAccept(field, setPopupEditingAgendaItem)}
        onRevertImproved={handleRevert}
        isImprovingTopic={isImproving.topic_content}
        isImprovingDecision={isImproving.decision_content}
        topicImproved={improved.topic_content}
        topicOriginal={original.topic_content}
        decisionImproved={improved.decision_content}
        decisionOriginal={original.decision_content}
      />

      <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
        <DialogContent className="max-w-5xl w-full h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Protocol PDF View</DialogTitle>
            <Button variant="outline" onClick={() => window.print()} className="ml-4">Print</Button>
          </DialogHeader>
          <ProtocolPdfView
            protocol={protocol}
            agendaItems={agendaItems}
            protocolMembers={protocolMembers}
            protocolAttachments={protocolAttachments}
            protocolMessages={protocolMessages}
            formatDate={formatDate}
            company={company ?? undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 