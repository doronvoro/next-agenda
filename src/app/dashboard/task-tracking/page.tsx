"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  ChevronDown, 
  ChevronUp,
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  X,
  Check,
  CheckSquare,
  Clock,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
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
import type { Database } from "@/types/supabase";
import { useRouter } from "next/navigation";

type Task = Database["public"]["Tables"]["agenda_item_tasks"]["Row"];

type SortField = "title" | "status" | "priority" | "due_date" | "created_at";
type SortOrder = "asc" | "desc";

export default function TaskTrackingPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    due_date: "",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const itemsPerPage = 10;

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("agenda_item_tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setError("שגיאה בטעינת המשימות");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      toast({
        title: "שגיאה",
        description: "כותרת המשימה לא יכולה להיות ריקה",
        variant: "destructive",
      });
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("agenda_item_tasks")
        .insert([{
          title: newTask.title.trim(),
          description: newTask.description.trim() || null,
          priority: newTask.priority,
          due_date: newTask.due_date || null,
          status: "pending"
        }]);

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: "המשימה נוספה בהצלחה",
      });

      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        due_date: "",
      });
      setIsAdding(false);
      fetchTasks();
    } catch (error) {
      console.error("Error adding task:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה בהוספת המשימה",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("agenda_item_tasks")
        .delete()
        .eq("id", taskToDelete.id);

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: "המשימה נמחקה בהצלחה",
      });

      setDeleteDialogOpen(false);
      setTaskToDelete(null);
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה במחיקת המשימה",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("agenda_item_tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: "סטטוס המשימה עודכן בהצלחה",
      });

      fetchTasks();
    } catch (error) {
      console.error("Error updating task status:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה בעדכון סטטוס המשימה",
        variant: "destructive",
      });
    }
  };

  const filteredAndSortedTasks = tasks
    .filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (task.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      let aValue: string | Date;
      let bValue: string | Date;

      switch (sortField) {
        case "title":
          aValue = a.title;
          bValue = b.title;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "priority":
          aValue = a.priority;
          bValue = b.priority;
          break;
        case "due_date":
          aValue = a.due_date ? new Date(a.due_date) : new Date(0);
          bValue = b.due_date ? new Date(b.due_date) : new Date(0);
          break;
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const totalPages = Math.ceil(filteredAndSortedTasks.length / itemsPerPage);
  const paginatedTasks = filteredAndSortedTasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">הושלם</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">בביצוע</Badge>;
      case 'overdue':
        return <Badge variant="destructive">באיחור</Badge>;
      default:
        return <Badge variant="outline">ממתין</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">גבוה</Badge>;
      case 'medium':
        return <Badge variant="secondary">בינוני</Badge>;
      default:
        return <Badge variant="outline">נמוך</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckSquare className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">טוען משימות...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-500">
          שגיאה: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">מעקב משימות</h1>
        <Button onClick={() => router.push("/dashboard")}>
          חזרה ללוח בקרה
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            חיפוש וסינון
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 rtl">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">חיפוש</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground rtl" />
                <Input
                  id="search"
                  placeholder="חפש משימות..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pr-10 rtl"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status">סטטוס</Label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">כל הסטטוסים</option>
                <option value="pending">ממתין</option>
                <option value="in_progress">בביצוע</option>
                <option value="completed">הושלם</option>
                <option value="overdue">באיחור</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="space-y-2">
              <Label htmlFor="priority">עדיפות</Label>
              <select
                id="priority"
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">כל העדיפויות</option>
                <option value="low">נמוכה</option>
                <option value="medium">בינונית</option>
                <option value="high">גבוהה</option>
              </select>
            </div>
          </div>
          {/* Clear Filters */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              מציג {filteredAndSortedTasks.length} מתוך {tasks.length} משימות
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              disabled={!searchTerm && statusFilter === "all" && priorityFilter === "all"}
            >
              נקה סינון
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isAdding && (
            <div className="mb-6 p-4 border rounded-lg">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-task-title">כותרת המשימה *</Label>
                    <Input
                      id="new-task-title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="הכנס כותרת משימה"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-task-priority">עדיפות</Label>
                    <select
                      id="new-task-priority"
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="low">נמוכה</option>
                      <option value="medium">בינונית</option>
                      <option value="high">גבוהה</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-task-description">תיאור</Label>
                  <Input
                    id="new-task-description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="הכנס תיאור משימה (אופציונלי)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-task-due-date">תאריך יעד</Label>
                  <Input
                    id="new-task-due-date"
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setIsAdding(false)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    ביטול
                  </Button>
                  <Button
                    onClick={handleAddTask}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    הוסף משימה
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">רשימת משימות</h2>
            <Button onClick={() => setIsAdding(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              הוסף משימה
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>סטטוס</TableHead>
                <TableHead>
                  <SortableHeader field="title">כותרת</SortableHeader>
                </TableHead>
                <TableHead>תיאור</TableHead>
                <TableHead>
                  <SortableHeader field="priority">עדיפות</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader field="due_date">תאריך יעד</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader field="created_at">תאריך יצירה</SortableHeader>
                </TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    {searchTerm || statusFilter !== "all" || priorityFilter !== "all" 
                      ? "לא נמצאו משימות" 
                      : "אין משימות"}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        {getStatusBadge(task.status)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      {task.description ? (
                        <span className="text-sm text-muted-foreground">
                          {task.description.length > 50 
                            ? `${task.description.substring(0, 50)}...` 
                            : task.description}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">אין תיאור</span>
                      )}
                    </TableCell>
                    <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                    <TableCell>
                      {task.due_date ? (
                        new Date(task.due_date).toLocaleDateString("he-IL")
                      ) : (
                        <span className="text-sm text-muted-foreground">אין תאריך יעד</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(task.created_at).toLocaleDateString("he-IL")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            צפייה
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            עריכה
                          </DropdownMenuItem>
                          {task.status !== 'completed' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(task.id, 'completed')}
                            >
                              <CheckSquare className="mr-2 h-4 w-4" />
                              סמן כהושלם
                            </DropdownMenuItem>
                          )}
                          {task.status === 'pending' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(task.id, 'in_progress')}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              התחל ביצוע
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setTaskToDelete(task);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            מחיקה
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                עמוד {currentPage} מתוך {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  קודם
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  הבא
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את המשימה "{taskToDelete?.title}" לצמיתות.
              לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-red-600">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 