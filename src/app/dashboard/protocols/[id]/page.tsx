"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";
import { format, isValid } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarIcon, Pencil, Plus, Trash2, X, Check, Paperclip, Eye } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogTrigger,
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
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type Committee = {
  id: string;
  name: string;
};

type ProtocolMember = {
  id: string;
  name: string | null;
  type: number;
  status: number;
  source_type: number | null;
  vote_status: number | null;
  created_at: string;
};

type ProtocolMessage = {
  id: string;
  protocol_id: string;
  message: string;
  user_id: string | null;
  created_at: string;
};

type ProtocolAttachment = {
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

type AgendaItem = {
  id: string;
  protocol_id: string | null;
  title: string;
  topic_content: string | null;
  decision_content: string | null;
  display_order: number | null;
  created_at: string;
};

type EditingAgendaItem = {
  id: string;
  title: string;
  topic_content: string;
  decision_content: string;
};

type NewAgendaItem = {
  title: string;
  isEditing: boolean;
};

type EditingMember = {
  id: string;
  name: string;
  type: number;
  status: number;
  vote_status: number | null;
};

type NewMember = {
  name: string;
  type: number;
  status: number;
  vote_status: number | null;
  isEditing: boolean;
};

type Protocol = Database["public"]["Tables"]["protocols"]["Row"] & {
  committee: Database["public"]["Tables"]["committees"]["Row"] | null;
};

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

type SortableAgendaItemProps = {
  item: AgendaItem;
  onViewClick?: (item: AgendaItem) => void;
};

function SortableAgendaItem({ item, onViewClick }: SortableAgendaItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2"
    >
      <button
        className="cursor-grab touch-none p-1 hover:bg-accent rounded-md"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <span className="text-muted-foreground">
        {item.display_order ? `${item.display_order}.` : '•'}
      </span>
      <span 
        className={onViewClick ? "cursor-pointer hover:text-primary hover:underline" : ""}
        onClick={onViewClick ? () => onViewClick(item) : undefined}
      >
        {item.title}
      </span>
    </div>
  );
}

export default function ProtocolPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [protocolMembers, setProtocolMembers] = useState<ProtocolMember[]>([]);
  const [protocolMessages, setProtocolMessages] = useState<ProtocolMessage[]>([]);
  const [protocolAttachments, setProtocolAttachments] = useState<ProtocolAttachment[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<{
    number: number;
    committee_id: string;
  }>({
    number: 0,
    committee_id: "",
  });
  const [editDate, setEditDate] = useState<Date>();
  const [committees, setCommittees] = useState<Committee[]>([]);
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setMounted(true);
    fetchData();
    fetchCommittees();
  }, [params.id]);

  const fetchCommittees = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("committees")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setCommittees(data || []);
    } catch (err) {
      console.error("Error fetching committees:", err);
      setError("Failed to load committees");
    }
  };

  const fetchData = async () => {
    try {
      const supabase = createClient();
      
      // Fetch protocol
      const { data: protocolData, error: protocolError } = await supabase
        .from("protocols")
        .select(`
          *,
          committee:committees!committee_id(*)
        `)
        .eq("id", params.id)
        .single();

      if (protocolError) {
        console.error("Error fetching protocol:", protocolError);
        setError(protocolError.message);
        return;
      }

      setProtocol(protocolData);

      // Fetch agenda items
      const { data: agendaItemsData, error: agendaItemsError } = await supabase
        .from("agenda_items")
        .select("*")
        .eq("protocol_id", params.id)
        .order("display_order", { ascending: true });

      if (agendaItemsError) {
        console.error("Error fetching agenda items:", agendaItemsError);
        setError(agendaItemsError.message);
        return;
      }

      setAgendaItems(agendaItemsData || []);

      // Fetch protocol members
      const { data: membersData, error: membersError } = await supabase
        .from("protocol_members")
        .select("*")
        .eq("protocol_id", params.id)
        .order("created_at", { ascending: true });

      if (membersError) {
        console.error("Error fetching protocol members:", membersError);
        setError(membersError.message);
        return;
      }

      setProtocolMembers(membersData || []);

      // Set all members as selected by default
      setSelectedRecipients(membersData?.map(member => member.id) || []);

      // Fetch protocol messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("protocol_messages")
        .select("*")
        .eq("protocol_id", params.id)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error("Error fetching protocol messages:", messagesError);
        setError(messagesError.message);
        return;
      }

      setProtocolMessages(messagesData || []);

      // Fetch protocol attachments
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from("protocol_attachments")
        .select("*")
        .eq("protocol_id", params.id)
        .order("created_at", { ascending: true });

      if (attachmentsError) {
        console.error("Error fetching protocol attachments:", attachmentsError);
        setError(attachmentsError.message);
        return;
      }

      setProtocolAttachments(attachmentsData || []);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setInitialLoading(false);
    }
  };

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
        .eq("id", params.id);

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
            protocol_id: params.id,
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
            protocol_id: params.id,
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
          protocol_id: params.id,
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
        const filePath = `protocols/${params.id}/${fileName}`;

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
            protocol_id: params.id,
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
                            {protocol.committee && (
                              <span className="text-sm text-muted-foreground">
                                (ID: {protocol.committee.id})
                              </span>
                            )}
                          </div>
                        } 
                      />
                    </div>

                    <Separator />

                    <div className="grid gap-4">
                      <h3 className="text-lg font-medium">Agenda</h3>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={agendaItems.map((item) => item.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2">
                            {agendaItems.length === 0 ? (
                              <div className="text-center text-muted-foreground py-4">
                                No agenda items found
                              </div>
                            ) : (
                              agendaItems.map((item) => (
                                <SortableAgendaItem
                                  key={item.id}
                                  item={item}
                                  onViewClick={handleOpenAgendaItemDialog}
                                />
                              ))
                            )}
                            {newAgendaItem.isEditing ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={newAgendaItem.title}
                                  onChange={(e) => setNewAgendaItem(prev => ({ ...prev, title: e.target.value }))}
                                  onKeyDown={handleKeyDown}
                                  onBlur={handleBlur}
                                  placeholder="Enter new agenda item title"
                                  autoFocus
                                  className="flex-1"
                                />
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setNewAgendaItem({ title: "", isEditing: true })}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add New Agenda Item
                              </Button>
                            )}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>

                    <Separator />

                    <div className="grid gap-6">
                      <h3 className="text-lg font-medium">Agenda Items Details</h3>
                      {agendaItems.length === 0 ? (
                        <div className="text-center text-muted-foreground py-4">
                          No agenda items found
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {agendaItems
                            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                            .map((item) => (
                              <div key={item.id} className="space-y-4">
                                {editingAgendaItem?.id === item.id ? (
                                  <form onSubmit={handleUpdateAgendaItem} className="space-y-4">
                                    <div className="space-y-2">
                                      <Label htmlFor={`title-${item.id}`}>Title</Label>
                                      <Input
                                        id={`title-${item.id}`}
                                        value={editingAgendaItem.title}
                                        onChange={(e) =>
                                          setEditingAgendaItem({
                                            ...editingAgendaItem,
                                            title: e.target.value,
                                          })
                                        }
                                        placeholder="Enter agenda item title"
                                        required
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor={`topic-${item.id}`}>Topic Content</Label>
                                      <textarea
                                        id={`topic-${item.id}`}
                                        value={editingAgendaItem.topic_content}
                                        onChange={(e) =>
                                          setEditingAgendaItem({
                                            ...editingAgendaItem,
                                            topic_content: e.target.value,
                                          })
                                        }
                                        className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Enter topic content"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor={`decision-${item.id}`}>Decision Content</Label>
                                      <textarea
                                        id={`decision-${item.id}`}
                                        value={editingAgendaItem.decision_content}
                                        onChange={(e) =>
                                          setEditingAgendaItem({
                                            ...editingAgendaItem,
                                            decision_content: e.target.value,
                                          })
                                        }
                                        className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Enter decision content"
                                      />
                                    </div>

                                    <div className="flex justify-end gap-4">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleCancelEditAgendaItem}
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
                                ) : (
                                  <>
                                    <div className="flex items-center justify-between">
                                      <span className="text-lg font-medium">
                                        {item.display_order ? `${item.display_order}.` : '•'} {item.title}
                                      </span>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleOpenAgendaItemDialog(item)}
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEditAgendaItem(item)}
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setDeletingAgendaItemId(item.id)}
                                          className="text-destructive hover:text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-muted-foreground">
                                        Topic Content
                                      </label>
                                      <div className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                        {item.topic_content || "No topic content"}
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-muted-foreground">
                                        Decision Content
                                      </label>
                                      <div className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                        {item.decision_content || "No decision content"}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="members" className="mt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Protocol Members</h3>
                    <Button
                      onClick={handleAddMember}
                      className="gap-2"
                      disabled={newMember.isEditing}
                    >
                      <Plus className="h-4 w-4" />
                      Add Member
                    </Button>
                  </div>

                  {newMember.isEditing && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Add New Member</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleCreateMember} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="member-name">Name *</Label>
                            <Input
                              id="member-name"
                              value={newMember.name}
                              onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Enter member name"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="member-type">Type</Label>
                              <Select
                                value={newMember.type.toString()}
                                onValueChange={(value) => setNewMember(prev => ({ ...prev, type: parseInt(value) }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">Committee Member</SelectItem>
                                  <SelectItem value="2">External</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="member-status">Status</Label>
                              <Select
                                value={newMember.status.toString()}
                                onValueChange={(value) => setNewMember(prev => ({ ...prev, status: parseInt(value) }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">Absent</SelectItem>
                                  <SelectItem value="2">Present</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="member-vote-status">Vote Status</Label>
                            <div className="flex gap-2">
                              <Select
                                value={newMember.vote_status?.toString() || ""}
                                onValueChange={(value) => setNewMember(prev => ({ 
                                  ...prev, 
                                  vote_status: parseInt(value) 
                                }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="No vote" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">For</SelectItem>
                                  <SelectItem value="2">Against</SelectItem>
                                  <SelectItem value="3">Abstain</SelectItem>
                                </SelectContent>
                              </Select>
                              {newMember.vote_status && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setNewMember(prev => ({ ...prev, vote_status: null }))}
                                  className="text-destructive hover:text-destructive"
                                >
                                  Clear
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-end gap-4">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={handleCancelAddMember}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={!newMember.name.trim()}>
                              Add Member
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {protocolMembers.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No members found for this protocol
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Vote Status</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {protocolMembers.map((member) => (
                            <TableRow key={member.id}>
                              {editingMember?.id === member.id ? (
                                <>
                                  <TableCell>
                                    <Input
                                      value={editingMember.name}
                                      onChange={(e) => setEditingMember(prev => prev ? { ...prev, name: e.target.value } : null)}
                                      placeholder="Enter member name"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={editingMember.type.toString()}
                                      onValueChange={(value) => setEditingMember(prev => prev ? { ...prev, type: parseInt(value) } : null)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="1">Committee Member</SelectItem>
                                        <SelectItem value="2">External</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={editingMember.status.toString()}
                                      onValueChange={(value) => setEditingMember(prev => prev ? { ...prev, status: parseInt(value) } : null)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="1">Absent</SelectItem>
                                        <SelectItem value="2">Present</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      <Select
                                        value={editingMember.vote_status?.toString() || ""}
                                        onValueChange={(value) => setEditingMember(prev => prev ? { ...prev, vote_status: parseInt(value) } : null)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="No vote" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="1">For</SelectItem>
                                          <SelectItem value="2">Against</SelectItem>
                                          <SelectItem value="3">Abstain</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      {editingMember.vote_status && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setEditingMember(prev => prev ? { ...prev, vote_status: null } : null)}
                                          className="text-destructive hover:text-destructive"
                                        >
                                          Clear
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleUpdateMember}
                                        disabled={!editingMember.name.trim()}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCancelEditMember}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </>
                              ) : (
                                <>
                                  <TableCell>{member.name || "Unnamed"}</TableCell>
                                  <TableCell>
                                    {member.type === 1 ? "Committee Member" : "External"}
                                  </TableCell>
                                  <TableCell>
                                    <span className={cn(
                                      "px-2 py-1 rounded-full text-xs font-medium",
                                      member.status === 2 
                                        ? "bg-green-100 text-green-800" 
                                        : "bg-red-100 text-red-800"
                                    )}>
                                      {member.status === 2 ? "Present" : "Absent"}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <span className={cn(
                                      "px-2 py-1 rounded-full text-xs font-medium",
                                      member.vote_status === 1 
                                        ? "bg-green-100 text-green-800"
                                        : member.vote_status === 2
                                        ? "bg-red-100 text-red-800"
                                        : member.vote_status === 3
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                                    )}>
                                      {member.vote_status === 1 ? "For" : member.vote_status === 2 ? "Against" : member.vote_status === 3 ? "Abstain" : "No vote"}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditMember(member)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDeletingMemberId(member.id)}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="attachments" className="mt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Protocol Attachments</h3>
                    <Button
                      onClick={() => {
                        const fileInput = document.getElementById('file-upload');
                        if (fileInput) {
                          fileInput.click();
                        }
                      }}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Upload Attachment
                    </Button>
                  </div>

                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleUploadAttachment(e.target.files)}
                  />

                  {protocolAttachments.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Paperclip className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>No attachments found for this protocol</p>
                      <p className="text-sm">Upload files to share with protocol members</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>File Name</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Uploaded</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {protocolAttachments.map((attachment) => (
                            <TableRow key={attachment.id}>
                              <TableCell className="font-medium">
                                {attachment.file_name}
                              </TableCell>
                              <TableCell>
                                {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
                              </TableCell>
                              <TableCell>
                                {attachment.mime_type}
                              </TableCell>
                              <TableCell>
                                {formatDate(attachment.created_at)}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const supabase = createClient();
                                      const { data } = supabase.storage
                                        .from('attachments')
                                        .getPublicUrl(attachment.file_path);
                                      window.open(data.publicUrl, '_blank');
                                    }}
                                  >
                                    Download
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeletingAttachmentId(attachment.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="messages" className="mt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Messages</h3>
                  </div>

                  <div className="h-[500px] flex flex-col">
                    <div className="flex-1 overflow-y-auto space-y-4 p-4">
                      {protocolMessages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          No messages found for this protocol
                        </div>
                      ) : (
                        protocolMessages.map((message) => (
                          <div
                            key={message.id}
                            className="flex flex-col space-y-2"
                          >
                            <div className="flex items-start space-x-2">
                              <div className="flex-1 bg-muted rounded-lg p-3">
                                <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDate(message.created_at)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="border-t p-4">
                      <form onSubmit={handleSendMessage} className="flex flex-col space-y-2">
                        <textarea
                          id="new-message-textarea"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <button
                              type="button"
                              onClick={handleOpenRecipientsDialog}
                              className="text-sm text-primary hover:underline"
                            >
                              Select Recipients ({selectedRecipients.length} selected)
                            </button>
                            <div className="flex items-center space-x-2">
                              <Select
                                value={selectedTemplate}
                                onValueChange={handleTemplateChange}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Choose template" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="select-template">Select template</SelectItem>
                                  <SelectItem value="pre-meeting materials">Pre-meeting materials</SelectItem>
                                  <SelectItem value="protocol approval">Protocol approval</SelectItem>
                                  <SelectItem value="general message">General message</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setNewMessage("")}
                              disabled={!newMessage.trim()}
                            >
                              Clear
                            </Button>
                            <Button type="submit" disabled={!newMessage.trim()}>
                              Send Message
                            </Button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deletingAgendaItemId} onOpenChange={() => setDeletingAgendaItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the agenda item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAgendaItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingMemberId} onOpenChange={() => setDeletingMemberId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the member from this protocol.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingAttachmentId} onOpenChange={() => setDeletingAttachmentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the attachment from this protocol.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAttachment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isAgendaItemDialogOpen} onOpenChange={setIsAgendaItemDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAgendaItem && (
                <span>
                  {selectedAgendaItem.display_order ? `${selectedAgendaItem.display_order}.` : '•'} {selectedAgendaItem.title}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              View and edit agenda item details
            </DialogDescription>
          </DialogHeader>

          {selectedAgendaItem && (
            <div className="space-y-6">
              {isPopupEditing ? (
                <form onSubmit={handleUpdatePopupAgendaItem} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="popup-title">Title</Label>
                    <Input
                      id="popup-title"
                      value={popupEditingAgendaItem?.title || ""}
                      onChange={(e) =>
                        setPopupEditingAgendaItem(prev =>
                          prev ? { ...prev, title: e.target.value } : null
                        )
                      }
                      placeholder="Enter agenda item title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="popup-topic">Topic Content</Label>
                    <textarea
                      id="popup-topic"
                      value={popupEditingAgendaItem?.topic_content || ""}
                      onChange={(e) =>
                        setPopupEditingAgendaItem(prev =>
                          prev ? { ...prev, topic_content: e.target.value } : null
                        )
                      }
                      className="min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Enter topic content"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="popup-decision">Decision Content</Label>
                    <textarea
                      id="popup-decision"
                      value={popupEditingAgendaItem?.decision_content || ""}
                      onChange={(e) =>
                        setPopupEditingAgendaItem(prev =>
                          prev ? { ...prev, decision_content: e.target.value } : null
                        )
                      }
                      className="min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Enter decision content"
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelPopupEdit}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      Save Changes
                    </Button>
                  </DialogFooter>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Topic Content
                    </label>
                    <div className="min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      {selectedAgendaItem.topic_content || "No topic content"}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Decision Content
                    </label>
                    <div className="min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      {selectedAgendaItem.decision_content || "No decision content"}
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseAgendaItemDialog}
                    >
                      Close
                    </Button>
                    <Button
                      type="button"
                      onClick={handleStartPopupEdit}
                    >
                      Edit
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isRecipientsDialogOpen} onOpenChange={setIsRecipientsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Message Recipients</DialogTitle>
            <DialogDescription>
              Choose which protocol members should receive this message
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {selectedRecipients.length} of {protocolMembers.length} selected
              </span>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllRecipients}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllRecipients}
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {protocolMembers.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  No protocol members found
                </div>
              ) : (
                protocolMembers.map((member) => (
                  <div key={member.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`recipient-${member.id}`}
                      checked={selectedRecipients.includes(member.id)}
                      onCheckedChange={() => handleRecipientToggle(member.id)}
                    />
                    <Label
                      htmlFor={`recipient-${member.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {member.name || `Member ${member.id}`}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelRecipientsDialog}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCloseRecipientsDialog}
            >
              Confirm Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 