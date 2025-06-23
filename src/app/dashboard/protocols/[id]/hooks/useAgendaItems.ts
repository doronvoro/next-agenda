import { useState } from "react";
import type { AgendaItem, EditingAgendaItem, NewAgendaItem } from "../types";

export function useAgendaItems(initialAgendaItems: AgendaItem[], setAgendaItems: (items: AgendaItem[]) => void, api: {
  updateAgendaItem: (item: EditingAgendaItem) => Promise<{ error?: any }>,
  createAgendaItem: (protocolId: string, title: string, displayOrder: number) => Promise<{ data: AgendaItem, error?: any }>,
  deleteAgendaItem: (id: string) => Promise<{ error?: any }>,
  reorderAgendaItems: (items: AgendaItem[]) => Promise<void>,
  unlinkFutureTopics?: (agendaItemId: string) => Promise<{ error?: any }>,
}, protocolId: string, toast: any, setError: (err: string | null) => void) {
  const [editingAgendaItem, setEditingAgendaItem] = useState<EditingAgendaItem | null>(null);
  const [isAddingAgendaItem, setIsAddingAgendaItem] = useState(false);
  const [newAgendaItem, setNewAgendaItem] = useState<NewAgendaItem>({ title: "", isEditing: false });
  const [deletingAgendaItemId, setDeletingAgendaItemId] = useState<string | null>(null);

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
      const { error } = await api.updateAgendaItem(editingAgendaItem);
      if (error) throw error;
      const updated = initialAgendaItems.map(item => item.id === editingAgendaItem.id ? { ...item, ...editingAgendaItem } : item);
      setAgendaItems(updated);
      setEditingAgendaItem(null);
      toast({ title: "Success", description: "Agenda item updated successfully" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast({ variant: "destructive", title: "Error", description: "Failed to update agenda item" });
    }
  };

  const handleAddAgendaItem = () => {
    setIsAddingAgendaItem(true);
    setNewAgendaItem({ title: "", isEditing: false });
  };

  const handleCancelAddAgendaItem = () => {
    setIsAddingAgendaItem(false);
    setNewAgendaItem({ title: "", isEditing: false });
  };

  const handleCreateAgendaItem = async (title: string) => {
    if (!title.trim()) return;
    setError(null);
    try {
      const maxOrder = Math.max(...initialAgendaItems.map(item => item.display_order || 0), 0);
      const { data, error } = await api.createAgendaItem(protocolId || '', title, maxOrder + 1);
      if (error) throw error;
      setAgendaItems([...initialAgendaItems, data]);
      setNewAgendaItem({ title: "", isEditing: false });
      toast({ title: "Success", description: "Agenda item added successfully" });
    } catch (err) {
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
      setNewAgendaItem({ title: "", isEditing: false });
    }
  };

  const handleDeleteAgendaItem = async () => {
    if (!deletingAgendaItemId) return;
    setError(null);
    try {
      const { error } = await api.deleteAgendaItem(deletingAgendaItemId);
      if (error) throw error;
      
      // Unlink any future topics that reference this agenda item
      if (api.unlinkFutureTopics) {
        try {
          await api.unlinkFutureTopics(deletingAgendaItemId);
        } catch (unlinkError) {
          console.error("Error unlinking future topics:", unlinkError);
          // Don't fail the deletion if unlinking fails
        }
      }
      
      const filtered = initialAgendaItems.filter(item => item.id !== deletingAgendaItemId);
      setAgendaItems(filtered);
      setDeletingAgendaItemId(null);
      toast({ title: "Success", description: "Agenda item deleted successfully" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast({ variant: "destructive", title: "Error", description: "Failed to delete agenda item" });
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = initialAgendaItems.findIndex((item) => item.id === active.id);
      const newIndex = initialAgendaItems.findIndex((item) => item.id === over.id);
      const newItems = [...initialAgendaItems];
      const [moved] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, moved);
      try {
        await api.reorderAgendaItems(newItems);
        setAgendaItems(newItems.map((item, index) => ({ ...item, display_order: index + 1 })));
        toast({ title: "Success", description: "Agenda items reordered successfully" });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update agenda item order");
      }
    }
  };

  return {
    editingAgendaItem,
    setEditingAgendaItem,
    isAddingAgendaItem,
    setIsAddingAgendaItem,
    newAgendaItem,
    setNewAgendaItem,
    deletingAgendaItemId,
    setDeletingAgendaItemId,
    handleEditAgendaItem,
    handleCancelEditAgendaItem,
    handleUpdateAgendaItem,
    handleAddAgendaItem,
    handleCancelAddAgendaItem,
    handleCreateAgendaItem,
    handleKeyDown,
    handleBlur,
    handleDeleteAgendaItem,
    handleDragEnd,
  };
} 