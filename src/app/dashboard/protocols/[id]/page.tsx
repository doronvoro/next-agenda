"use client";

import { useEffect, useState } from "react";
import { format, isValid } from "date-fns";
import { he } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Pencil, FileText, X, Printer, CheckSquare, Download, Save, Edit3, Eye, Plus, Link as LinkIcon } from "lucide-react";
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
import type { Database } from "@/types/supabase";
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
  updateFutureTopic,
  fetchFutureTopicsWithoutAgendaItem,
  unlinkFutureTopicsFromAgendaItem,
} from "./supabaseApi";
import { createClient } from "@/lib/supabase/client";
import { useAgendaItems } from "./hooks/useAgendaItems";
import { useTextImprovement } from "./hooks/useTextImprovement";
import { useAttachments } from "./hooks/useAttachments";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import ProtocolPdfView from "./components/ProtocolPdfView";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import ProtocolPdfModal from "../components/ProtocolPdfModal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ProtocolQuickNav } from "./components/ProtocolQuickNav";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return isValid(date) ? format(date, "dd/MM/yyyy", { locale: he }) : "תאריך שגוי";
};

declare global {
  interface Window {
    __protocolNumber?: string;
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
    number: string;
    committee_id: string;
  }>({
    number: "",
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
  const [futureTopics, setFutureTopics] = useState<Database["public"]["Tables"]["future_topics"]["Row"][]>([]);
  const [loadingFutureTopics, setLoadingFutureTopics] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("protocol-details");
  const [showStickyNav, setShowStickyNav] = useState(false);
  const [showAgendaQuickNav, setShowAgendaQuickNav] = useState(false);
  const [activeAgendaItem, setActiveAgendaItem] = useState<string | null>(null);
  const router = useRouter();

  // Add state for anchor link feedback
  const [copiedAnchor, setCopiedAnchor] = useState<string | null>(null);

  const handleAnchorClick = (anchor: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${anchor}`;
    navigator.clipboard.writeText(url);
    setCopiedAnchor(anchor);
    window.location.hash = anchor;
    setTimeout(() => setCopiedAnchor(null), 1200);
  };

  const agendaApi = {
    updateAgendaItem: async (item: EditingAgendaItem) => {
      const { error } = await updateAgendaItem(item);
      return { error };
    },
    createAgendaItem: async (protocolId: string, title: string, displayOrder: number, topic_content?: string) => {
      const { data, error } = await apiCreateAgendaItem(protocolId, title, displayOrder, topic_content);
      return { data, error };
    },
    deleteAgendaItem: async (id: string) => {
      const { error } = await apiDeleteAgendaItem(id);
      return { error };
    },
    reorderAgendaItems: async (items: AgendaItem[]) => {
      await reorderAgendaItems(items);
    },
    unlinkFutureTopics: async (agendaItemId: string) => {
      const { error } = await unlinkFutureTopicsFromAgendaItem(agendaItemId);
      if (!error) {
        // Refresh future topics to show newly available ones
        await fetchFutureTopics();
      }
      return { error };
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
    fetchFutureTopics();
  }, [protocolId]);

  // Use scroll container logic
  const getScrollContainer = () => document.getElementById("protocol-scroll-container");

  // Update scroll detection for sticky nav and agenda quick nav
  useEffect(() => {
    const container = getScrollContainer();
    if (!container) return;

    const handleScroll = () => {
      if (currentTab !== "content") {
        setShowStickyNav(false);
        return;
      }
      setShowStickyNav(true); // Always show sticky nav on content tab
      const scrollY = container.scrollTop;
      const protocolDetailsSection = document.getElementById("protocol-details");
      const agendaListSection = document.getElementById("agenda-list");
      const agendaDetailsSection = document.getElementById("agenda-details");
      if (!protocolDetailsSection || !agendaListSection || !agendaDetailsSection) return;
      const protocolDetailsTop = protocolDetailsSection.offsetTop - 150;
      const agendaListTop = agendaListSection.offsetTop - 150;
      const agendaDetailsTop = agendaDetailsSection.offsetTop - 150;
      if (scrollY < agendaListTop) {
        setActiveSection("protocol-details");
        setActiveAgendaItem(null);
      } else if (scrollY < agendaDetailsTop) {
        setActiveSection("agenda-list");
        setActiveAgendaItem(null);
      } else {
        setActiveSection("agenda-details");
        const agendaItemElements = agendaItems.map(item => ({
          id: item.id,
          element: document.getElementById(`agenda-item-${item.id}`)
        })).filter(item => item.element);
        let currentItem = null;
        for (const item of agendaItemElements) {
          if (item.element) {
            const rect = item.element.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            if (rect.top - containerRect.top <= 200 && rect.bottom - containerRect.top >= 200) {
              currentItem = item.id;
              break;
            }
          }
        }
        setActiveAgendaItem(currentItem);
      }
    };
    container.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => container.removeEventListener("scroll", handleScroll);
  }, [currentTab, agendaItems.length]);

  // Ensure sticky nav is visible immediately when content tab is active
  useEffect(() => {
    if (currentTab === "content") {
      setShowStickyNav(true);
    }
  }, [currentTab]);

  // Update scrollToSection and scrollToAgendaItem to use the container
  const scrollToSection = (sectionId: string) => {
    const container = getScrollContainer();
    const element = document.getElementById(sectionId);
    if (element && container) {
      container.scrollTo({
        top: element.offsetTop - 24,
        behavior: "smooth"
      });
    }
  };
  const scrollToAgendaItem = (itemId: string) => {
    const container = getScrollContainer();
    const element = document.getElementById(`agenda-item-${itemId}`);
    if (element && container) {
      container.scrollTo({
        top: element.offsetTop - 24,
        behavior: "smooth"
      });
    }
  };

  // Set protocol number immediately when protocol data is available
  useEffect(() => {
    if (protocol && protocol.number && typeof window !== 'undefined') {
      (window as any).__protocolNumber = protocol.number;
    }
  }, [protocol?.number]);

  useEffect(() => {
    if (protocol && protocol.number) {
      if (typeof window !== 'undefined') {
        (window as any).__protocolNumber = protocol.number;
      }
    }
    
    // Cleanup when component unmounts
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__protocolNumber;
      }
    };
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
        number: protocol.number.toString(),
        committee_id: protocol.committee_id || "",
      });
      setEditDate(new Date(protocol.due_date));
      setIsEditing(true);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      // Validate required fields
      if (!editFormData.number.trim() || !editDate) {
        throw new Error("אנא מלא את כל השדות הנדרשים");
      }
      if (!editFormData.committee_id) {
        setError("אנא בחר מועדיה");
        return;
      }

      // Store original data for rollback in case of error
      const originalProtocol = protocol;

      // Optimistic update - update local state immediately
      if (protocol) {
        const updatedProtocol = {
          ...protocol,
          number: editFormData.number.trim(),
          committee_id: editFormData.committee_id,
          due_date: editDate.toISOString(),
        };
        setProtocol(updatedProtocol);
        
        // Update the window protocol number for breadcrumb
        if (typeof window !== 'undefined') {
          (window as any).__protocolNumber = editFormData.number.trim();
        }
      }

      const { error } = await updateProtocol(protocolId || '', {
        number: editFormData.number.trim(),
        committee_id: editFormData.committee_id,
        due_date: editDate.toISOString(),
      });
      
      if (error) {
        // Rollback on error
        if (originalProtocol) {
          setProtocol(originalProtocol);
        }
        throw error;
      }
      
      setIsEditing(false);
      toast({ title: "הצלחה", description: "פרוטוקול עודכן בהצלחה" });
    } catch (err) {
      console.error("Error updating protocol:", err);
      setError(err instanceof Error ? err.message : "התרחשה שגיאה");
    } finally {
      setIsSaving(false);
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
    setIsAgendaItemDialogOpen(false);
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
      setIsAgendaItemDialogOpen(false);
      toast({ title: "הצלחה", description: "סעיף האג'נדה עודכן בהצלחה" });
    } catch (err) {
      console.error("Error updating agenda item:", err);
      setError(err instanceof Error ? err.message : "התרחשה שגיאה");
      toast({ variant: "destructive", title: "שגיאה", description: "נכשל עדכון סעיף האג'נדה" });
    }
  };

  const fetchFutureTopics = async () => {
    setLoadingFutureTopics(true);
    try {
      const { data, error } = await fetchFutureTopicsWithoutAgendaItem();
      if (error) {
        console.error("Error fetching future topics:", error);
        return;
      }
      setFutureTopics(data || []);
    } catch (err) {
      console.error("Error fetching future topics:", err);
    } finally {
      setLoadingFutureTopics(false);
    }
  };

  const handleCreateFromFutureTopic = async (topicId: string) => {
    const selectedTopic = futureTopics.find(topic => topic.id === topicId);
    if (!selectedTopic) return;

    try {
      // Create the agenda item with the topic's title and content
      const displayOrder = agendaItems.length + 1;
      const { data: newAgendaItem, error } = await agendaApi.createAgendaItem(
        protocolId,
        selectedTopic.title,
        displayOrder,
        selectedTopic.content || ""
      );

      if (error) {
        toast({ variant: "destructive", title: "שגיאה", description: "נכשל יצירת סעיף סדר היום" });
        return;
      }

      if (newAgendaItem) {
        // Update the future topic with the new agenda item ID
        const { error: updateError } = await updateFutureTopic(topicId, newAgendaItem.id);
        if (updateError) {
          console.error("Error updating future topic:", updateError);
        }

        // Update state directly instead of refetching
        setAgendaItems(prev => [...prev, newAgendaItem]);
        setFutureTopics(prev => prev.filter(topic => topic.id !== topicId));

        toast({ title: "הצלחה", description: "סעיף האג'נדה נוצר מסעיף עתידי" });
      }
    } catch (err) {
      console.error("Error creating agenda item from future topic:", err);
      toast({ variant: "destructive", title: "שגיאה", description: "נכשל יצירת סעיף האג'נדה מסעיף עתידי" });
    }
  };

  const handleEditAgendaItemTitle = async (itemId: string, newTitle: string) => {
    try {
      const item = agendaItems.find(item => item.id === itemId);
      if (!item) {
        toast({ variant: "destructive", title: "שגיאה", description: "סעיף האג'נדה לא נמצא" });
        return;
      }

      const { error } = await updateAgendaItemById({
        id: itemId,
        title: newTitle,
        topic_content: item.topic_content || "",
        decision_content: item.decision_content || ""
      });
      if (error) {
        toast({ variant: "destructive", title: "שגיאה", description: "נכשל עדכון כותרת סעיף סדר היום" });
        return;
      }

      // Update local state
      setAgendaItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, title: newTitle } : item
      ));

      toast({ title: "הצלחה", description: "כותרת סעיף סדר היום עודכנה" });
    } catch (err) {
      console.error("Error updating agenda item title:", err);
      toast({ variant: "destructive", title: "שגיאה", description: "נכשל עדכון כותרת סעיף סדר היום" });
      throw err;
    }
  };

  const handleDeleteAgendaItem = async (itemId: string) => {
    try {
      const { error } = await apiDeleteAgendaItem(itemId);
      if (error) {
        toast({ variant: "destructive", title: "שגיאה", description: "נכשל מחיקת סעיף סדר היום" });
        return;
      }

      // Update local state
      setAgendaItems(prev => prev.filter(item => item.id !== itemId));

      toast({ title: "הצלחה", description: "הסעיף נמחק בהצלחה" });
    } catch (err) {
      console.error("Error deleting agenda item:", err);
      toast({ variant: "destructive", title: "שגיאה", description: "נכשל מחיקת סעיף סדר היום" });
    }
  };

  if (!mounted) {
    return null;
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
              <div className="h-4 bg-muted rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-destructive text-lg mb-2">שגיאה בטעינת הפרוטוקול</div>
          <div className="text-muted-foreground">{error}</div>
        </div>
      </div>
    );
  }

  if (!protocol) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground text-lg">הפרוטוקול לא נמצא</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Document Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/protocols">
                <Button variant="ghost" size="sm" className="gap-2">
                  חזרה
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <div className="h-6 w-px bg-border"></div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  פרוטוקול #{protocol.number}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {formatDate(protocol.due_date)} • {protocolMembers.length} חברים
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isSaving && (
                <Badge variant="secondary" className="gap-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                  שמירה...
                </Badge>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsPdfModalOpen(true)}
                      className="gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      צפה
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>צפייה כ-PDF</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/dashboard/protocols/protocol-task-tracking?protocolId=${protocolId}&returnTo=protocol`)}
                      className="gap-2"
                    >
                      <CheckSquare className="h-4 w-4" />
                      משימות
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>מעקב משימות</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsExportModalOpen(true)}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      ייצוא
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>ייצוא</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Section Navigation */}
      <ProtocolQuickNav
        showStickyNav={showStickyNav}
        agendaItems={agendaItems}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        activeAgendaItem={activeAgendaItem}
        setActiveAgendaItem={setActiveAgendaItem}
        scrollToSection={scrollToSection}
        scrollToAgendaItem={scrollToAgendaItem}
      />

      {/* Document Content */}
      <div id="protocol-scroll-container" className="px-8 py-8 h-[calc(100vh-72px)] overflow-y-auto relative protocol-scrollbar">
        <div className="protocol-content-rtl">
          <div className="bg-card rounded-lg shadow-sm border border-border">
            {/* Document Tabs */}
            <div className="border-b border-border rtl">
              <Tabs defaultValue="content" className="w-full rtl" value={currentTab} onValueChange={setCurrentTab}>
                <TabsList className="grid w-full grid-cols-4 h-12 rounded-none border-b-0 bg-transparent rtl">
                  <TabsTrigger value="content" className="relative data-[state=active]:text-primary data-[state=active]:bg-transparent rounded-none border-0 hover:bg-muted/50 transition-colors rtl">
                    מסמך
                    {currentTab === "content" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="members" className="relative data-[state=active]:text-primary data-[state=active]:bg-transparent rounded-none border-0 hover:bg-muted/50 transition-colors rtl">
                    חברים
                    {currentTab === "members" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="attachments" className="relative data-[state=active]:text-primary data-[state=active]:bg-transparent rounded-none border-0 hover:bg-muted/50 transition-colors rtl">
                    קבצים מצורפים
                    {currentTab === "attachments" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="relative data-[state=active]:text-primary data-[state=active]:bg-transparent rounded-none border-0 hover:bg-muted/50 transition-colors rtl">
                    הודעות
                    {currentTab === "messages" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                    )}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="content" className="mt-0 p-8">
                  <div className="space-y-8">
                    {/* Protocol Details Section */}
                    <section id="protocol-details">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-semibold text-foreground" id="protocol-details-anchor">פרטי פרוטוקול</h2>
                          <TooltipProvider>
                            <Tooltip open={copiedAnchor === "protocol-details"}>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  aria-label="העתק קישור"
                                  onClick={() => handleAnchorClick("protocol-details")}
                                  className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                  <LinkIcon className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>{copiedAnchor === "protocol-details" ? "הועתק!" : "העתק קישור"}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        {!isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleEdit}
                            className="gap-2 text-muted-foreground hover:text-foreground"
                          >
                            <Edit3 className="h-4 w-4" />
                            עריכה
                          </Button>
                        )}
                      </div>
                      
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
                          onCancel={() => setIsEditing(false)}
                          onUpdate={handleUpdate}
                        />
                      ) : (
                        <div className="bg-muted/50 rounded-lg p-6">
                          <ProtocolDetailsFields protocol={protocol} formatDate={formatDate} company={company ?? undefined} />
                        </div>
                      )}
                    </section>

                    <Separator />

                    {/* Agenda Section */}
                    <section id="agenda-list">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-semibold text-foreground" id="agenda-list-anchor">סדר יום</h2>
                          <TooltipProvider>
                            <Tooltip open={copiedAnchor === "agenda-list"}>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  aria-label="העתק קישור"
                                  onClick={() => handleAnchorClick("agenda-list")}
                                  className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                  <LinkIcon className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>{copiedAnchor === "agenda-list" ? "הועתק!" : "העתק קישור"}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      <div className="bg-card border border-border rounded-lg">
                        <AgendaList
                          agendaItems={agendaItems}
                          newAgendaItem={agendaItemsHook.newAgendaItem}
                          setNewAgendaItem={agendaItemsHook.setNewAgendaItem}
                          handleKeyDown={agendaItemsHook.handleKeyDown}
                          handleBlur={agendaItemsHook.handleBlur}
                          handleCreateAgendaItem={agendaItemsHook.handleCreateAgendaItem}
                          handleCreateFromFutureTopic={handleCreateFromFutureTopic}
                          handleDragEnd={agendaItemsHook.handleDragEnd}
                          handleOpenAgendaItemDialog={handleOpenAgendaItemDialog}
                          futureTopics={futureTopics}
                          loadingFutureTopics={loadingFutureTopics}
                          handleEditAgendaItemTitle={handleEditAgendaItemTitle}
                          handleDeleteAgendaItem={handleDeleteAgendaItem}
                        />
                      </div>
                    </section>

                    <Separator />

                    {/* Agenda Details Section */}
                    <section id="agenda-details">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-semibold text-foreground" id="agenda-details-anchor">פרטי סדר יום</h2>
                          <TooltipProvider>
                            <Tooltip open={copiedAnchor === "agenda-details"}>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  aria-label="העתק קישור"
                                  onClick={() => handleAnchorClick("agenda-details")}
                                  className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                  <LinkIcon className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>{copiedAnchor === "agenda-details" ? "הועתק!" : "העתק קישור"}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {agendaItems.length} סעיפים
                        </div>
                      </div>
                      
                      <div className="space-y-6">
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
                    </section>
                  </div>
                </TabsContent>
                
                <TabsContent value="members" className="mt-0 p-8">
                  <ProtocolMembers
                    protocolMembers={protocolMembers}
                    setProtocolMembers={setProtocolMembers}
                    setDeletingMemberId={setDeletingMemberId}
                    protocolId={protocolId}
                  />
                </TabsContent>
                
                <TabsContent value="attachments" className="mt-0 p-8">
                  <ProtocolAttachments
                    protocolAttachments={protocolAttachments}
                    handleUploadAttachment={attachmentsHook.handleUploadAttachment}
                    setDeletingAttachmentId={attachmentsHook.setDeletingAttachmentId}
                    formatDate={formatDate}
                  />
                </TabsContent>
                
                <TabsContent value="messages" className="mt-0 p-8">
                  <ProtocolMessages
                    protocolMessages={protocolMessages}
                    formatDate={formatDate}
                    protocolId={protocolId}
                    protocolMembers={protocolMembers}
                    onMessageSent={msg => setProtocolMessages(prev => [...prev, msg])}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
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
        <DialogContent className="max-w-5xl w-full max-h-[80vh] bg-card flex flex-col p-0" style={{ borderRadius: 0 }}>
          <DialogHeader className="sticky top-0 z-10 bg-card text-foreground flex flex-row items-center justify-between p-6 border-b shadow">
            <div className="flex items-center gap-2">
              <DialogTitle>צפה ב-PDF של הפרוטוקול</DialogTitle>
            </div>
            <DialogClose
              onClick={() => setIsPdfModalOpen(false)}
              className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 left-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
              aria-label="Close PDF view"
            >
              <X />
              <span className="sr-only">סגירה</span>
            </DialogClose>
          </DialogHeader>
          <div className="overflow-auto p-12 pt-6" style={{ maxHeight: "calc(80vh - 80px)" }}>
            <ProtocolPdfView
              protocol={protocol}
              agendaItems={agendaItems}
              protocolMembers={protocolMembers}
              protocolAttachments={protocolAttachments}
              protocolMessages={protocolMessages}
              formatDate={formatDate}
              company={company ?? undefined}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Export PDF Modal */}
      {protocol && (
        <ProtocolPdfModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          protocolId={protocolId}
          protocolNumber={protocol.number.toString()}
        />
      )}
    </div>
  );
} 