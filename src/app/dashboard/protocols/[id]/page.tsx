"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";
import { format, isValid } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarIcon, Pencil, Plus, Trash2 } from "lucide-react";
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
  created_at: string;
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
};

function SortableAgendaItem({ item }: SortableAgendaItemProps) {
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
      <span>{item.title}</span>
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
        {!isEditing && (
          <Button onClick={handleEdit} className="gap-2">
            <Pencil className="h-4 w-4" />
            Edit Protocol
          </Button>
        )}
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {isEditing ? "Edit Protocol" : `Protocol #${protocol?.number}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form onSubmit={handleUpdate} className="space-y-6">
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
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={initialLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={initialLoading}>
                    Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="members">Members</TabsTrigger>
                </TabsList>
                <TabsContent value="content" className="mt-6">
                  <div className="grid gap-6">
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
                                          variant="outline"
                                          onClick={handleCancelEditAgendaItem}
                                          disabled={initialLoading}
                                        >
                                          Cancel
                                        </Button>
                                        <Button type="submit" disabled={initialLoading}>
                                          Save Changes
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
                            <TableHead>Source Type</TableHead>
                            <TableHead>Created At</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {protocolMembers.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell>{member.name || "Unnamed"}</TableCell>
                              <TableCell>{member.type}</TableCell>
                              <TableCell>{member.status}</TableCell>
                              <TableCell>{member.source_type || "N/A"}</TableCell>
                              <TableCell>{formatDate(member.created_at)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
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
    </div>
  );
} 