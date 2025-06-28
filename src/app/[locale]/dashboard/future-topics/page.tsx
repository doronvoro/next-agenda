"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, ChevronUp, ChevronDown, ArrowUpDown, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { VoiceMagicTextarea } from "@/app/[locale]/dashboard/protocols/[id]/components/dialogs/VoiceMagicTextarea";
import { useToast } from "@/components/ui/use-toast";
import { useSpeechToText } from "@/lib/hooks/useSpeechToText";
import { useTranslations } from "next-intl";

export default function FutureTopicsPage() {
  const t = useTranslations("dashboard.futureTopics");
  const [topics, setTopics] = useState<Database["public"]["Tables"]["future_topics"]["Row"][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Database["public"]["Tables"]["future_topics"]["Row"] | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "medium",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();
  const {
    listening,
    transcript,
    startListening,
    stopListening,
    isSupported,
    setTranscript,
  } = useSpeechToText();
  const [isImprovingContent, setIsImprovingContent] = useState(false);
  const [contentImproved, setContentImproved] = useState<string | null>(null);
  const [contentOriginal, setContentOriginal] = useState<string | null>(null);
  const [dictatingContent, setDictatingContent] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("future_topics")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) {
          setError(error.message);
          return;
        }
        setTopics(data || []);
      } catch (err) {
        setError("Unexpected error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredTopics = useMemo(() => {
    let filtered = topics.filter((topic) =>
      (priorityFilter === "all" || topic.priority === priorityFilter) &&
      (topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (topic.content || "").toLowerCase().includes(searchTerm.toLowerCase()))
    );
    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof typeof a];
      let bValue: any = b[sortField as keyof typeof b];
      if (sortField === "created_at") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else {
        aValue = aValue?.toString().toLowerCase();
        bValue = bValue?.toString().toLowerCase();
      }
      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [topics, searchTerm, priorityFilter, sortField, sortOrder]);

  const handleDialogOpen = useCallback(() => {
    setFormData({ title: "", content: "", priority: "medium" });
    setIsEditing(false);
    setEditingTopic(null);
    setIsDialogOpen(true);
  }, []);

  const handleEditTopic = useCallback((topic: Database["public"]["Tables"]["future_topics"]["Row"]) => {
    setFormData({
      title: topic.title,
      content: topic.content || "",
      priority: topic.priority,
    });
    setIsEditing(true);
    setEditingTopic(topic);
    setIsDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false);
    setIsEditing(false);
    setEditingTopic(null);
  }, []);

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      if (isEditing && editingTopic) {
        // Update existing topic
        const { data, error } = await supabase
          .from("future_topics")
          .update({
            title: formData.title,
            content: formData.content,
            priority: formData.priority,
          })
          .eq("id", editingTopic.id)
          .select();
        if (!error && data && data[0]) {
          setTopics((prev) => prev.map(topic => topic.id === editingTopic.id ? data[0] : topic));
          setIsDialogOpen(false);
        }
      } else {
        // Create new topic
        const { data, error } = await supabase.from("future_topics").insert([
          {
            title: formData.title,
            content: formData.content,
            priority: formData.priority,
          },
        ]).select();
        if (!error && data && data[0]) {
          setTopics((prev) => [data[0], ...prev]);
          setIsDialogOpen(false);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-medium hover:bg-transparent"
    >
      {children}
      {sortField === field ? (
        sortOrder === "asc" ? (
          <ChevronUp className="ml-1 h-4 w-4" />
        ) : (
          <ChevronDown className="ml-1 h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="ml-1 h-4 w-4" />
      )}
    </Button>
  );

  const getPriorityBadge = (priority: "low" | "medium" | "high") => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">{t("priorities.high")}</Badge>;
      case "medium":
        return <Badge variant="secondary">{t("priorities.medium")}</Badge>;
      case "low":
        return <Badge variant="outline">{t("priorities.low")}</Badge>;
      default:
        return <Badge variant="outline">{t("priorities.low")}</Badge>;
    }
  };

  // Handle AI improve for content
  const handleImproveContent = async () => {
    if (!formData.content.trim()) return;
    setIsImprovingContent(true);
    try {
      const response = await fetch("/api/improve-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: formData.content }),
      });
      const data = await response.json();
      if (data.improvedText) {
        setContentOriginal(formData.content);
        setContentImproved(data.improvedText);
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to improve text",
      });
    } finally {
      setIsImprovingContent(false);
    }
  };

  // Accept or revert improved content
  const handleAcceptImprovedContent = () => {
    if (contentImproved) {
      setFormData((prev) => ({ ...prev, content: contentImproved }));
      setContentOriginal(null);
      setContentImproved(null);
    }
  };
  const handleRevertImprovedContent = () => {
    setContentOriginal(null);
    setContentImproved(null);
  };

  // Handle voice dictation for content
  useEffect(() => {
    if (!dictatingContent || !transcript) return;
    setFormData((prev) => ({ ...prev, content: prev.content ? prev.content + " " + transcript : transcript }));
    setTranscript("");
  }, [transcript, dictatingContent, setTranscript]);

  if (loading) {
    return <div className="container mx-auto p-6 text-center">{t("loading")}</div>;
  }
  if (error) {
    return <div className="container mx-auto p-6 text-center text-red-500">{t("error", { error })}</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Button className="gap-2" onClick={handleDialogOpen}>
          <Plus className="h-4 w-4" />
          {t("createTopic")}
        </Button>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {t("filtersAndSearch")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">{t("search")}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder={t("searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {/* Priority Filter */}
            <div className="space-y-2">
              <Label htmlFor="priority-filter">{t("priority")}</Label>
              <Select
                value={priorityFilter}
                onValueChange={setPriorityFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("allPriorities")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allPriorities")}</SelectItem>
                  <SelectItem value="low">{t("priorities.low")}</SelectItem>
                  <SelectItem value="medium">{t("priorities.medium")}</SelectItem>
                  <SelectItem value="high">{t("priorities.high")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><SortableHeader field="title">{t("tableHeaders.title")}</SortableHeader></TableHead>
                  <TableHead><SortableHeader field="priority">{t("tableHeaders.priority")}</SortableHeader></TableHead>
                  <TableHead>{t("tableHeaders.status")}</TableHead>
                  <TableHead><SortableHeader field="created_at">{t("tableHeaders.created")}</SortableHeader></TableHead>
                  <TableHead>{t("tableHeaders.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTopics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      {t("noTopicsFound")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTopics.map((topic) => (
                    <TableRow key={topic.id}>
                      <TableCell className="font-medium">
                        <Link href={`/dashboard/future-topics/${topic.id}`} className="text-primary hover:underline">
                          {topic.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(topic.priority as "low" | "medium" | "high")}
                      </TableCell>
                      <TableCell>
                        {topic.related_agenda_item_id ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {t("statuses.linkedToAgenda")}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            {t("statuses.available")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{new Date(topic.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleEditTopic(topic)}>
                          {t("dialog.editTitle")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl w-full max-h-[95vh] overflow-y-auto p-8 shadow-2xl border border-border rounded-2xl bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              {isEditing ? t("dialog.editTitle") : t("dialog.createTitle")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">{t("dialog.title")}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleFormChange("title", e.target.value)}
                placeholder={t("dialog.titlePlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">{t("dialog.content")}</Label>
              <VoiceMagicTextarea
                value={formData.content}
                onChange={e => handleFormChange("content", e.target.value)}
                onImprove={handleImproveContent}
                onMic={() => {
                  if (dictatingContent && listening) {
                    stopListening();
                    setDictatingContent(false);
                  } else {
                    setDictatingContent(true);
                    startListening();
                  }
                }}
                isImproving={isImprovingContent}
                isSupported={isSupported}
                dictating={dictatingContent}
                listening={listening}
                disabled={!!contentImproved}
                placeholder={t("dialog.contentPlaceholder")}
                ariaLabel={t("dialog.content")}
              />
              {contentImproved && (
                <div className="mt-4 p-4 border-2 border-primary/30 rounded-xl bg-muted">
                  <div className="font-bold mb-2 text-primary">{t("compareVersions.title")}</div>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground mb-1">{t("compareVersions.original")}</div>
                      <div className="p-3 border rounded-lg bg-background whitespace-pre-wrap text-base shadow-inner">{contentOriginal}</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground mb-1">{t("compareVersions.improvedSuggestion")}</div>
                      <div className="p-3 border rounded-lg bg-background whitespace-pre-wrap text-base shadow-inner">{contentImproved}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 justify-end">
                    <Button size="lg" className="px-6" onClick={handleAcceptImprovedContent}>{t("compareVersions.accept")}</Button>
                    <Button size="lg" variant="outline" className="px-6" onClick={handleRevertImprovedContent}>{t("compareVersions.revert")}</Button>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">{t("dialog.priority")}</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleFormChange("priority", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("dialog.priorityPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t("priorities.low")}</SelectItem>
                  <SelectItem value="medium">{t("priorities.medium")}</SelectItem>
                  <SelectItem value="high">{t("priorities.high")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="flex gap-2 justify-end mt-8">
              <Button type="button" variant="outline" onClick={handleDialogClose} disabled={isSubmitting}>
                {t("dialog.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.title.trim()}>
                {isSubmitting ? (isEditing ? t("dialog.updating") : t("dialog.creating")) : (isEditing ? t("dialog.update") : t("dialog.create"))}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 