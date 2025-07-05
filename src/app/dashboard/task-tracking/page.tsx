"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isValid, parseISO, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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
  Filter, 
  CalendarIcon, 
  ChevronDown, 
  ChevronUp,
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  X,
  CheckSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import type { TaskStatus, Task } from "@/components/KanbanBoard";
import { 
  fetchAllTasks, 
  deleteTask, 
  fetchTasksWithCascadingFilters,
  type TaskWithDetails 
} from "../protocols/[id]/supabaseApi";
import { useRouter } from "next/navigation";
import { CascadingFilterDialog } from "./components/CascadingFilterDialog";
import { EditTaskDialog } from "./components/EditTaskDialog";

type SortField = "title" | "status" | "priority" | "due_date" | "created_at" | "protocol_number" | "agenda_item_title";
type SortOrder = "asc" | "desc";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return isValid(date) ? format(date, "dd/MM/yyyy") : "Invalid date";
};

const getStatusBadge = (status: TaskStatus) => {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary">To Do</Badge>;
    case 'in_progress':
      return <Badge variant="default">In Progress</Badge>;
    case 'completed':
      return <Badge variant="default" className="bg-green-100 text-green-800">Done</Badge>;
    case 'overdue':
      return <Badge variant="destructive">Overdue</Badge>;
  }
};

const getPriorityBadge = (priority: Task['priority']) => {
  switch (priority) {
    case 'high':
      return <Badge variant="destructive">High</Badge>;
    case 'medium':
      return <Badge variant="secondary">Medium</Badge>;
    case 'low':
      return <Badge variant="outline">Low</Badge>;
  }
};

export default function TaskTrackingPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [selectedProtocol, setSelectedProtocol] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  // Sorting states
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  // Delete confirmation states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<TaskWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit task dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithDetails | null>(null);

  // Cascading filter dialog states
  const [cascadingFilterDialogOpen, setCascadingFilterDialogOpen] = useState(false);
  const [cascadingFilters, setCascadingFilters] = useState({
    companyId: null as string | null,
    committeeId: null as string | null,
    protocolId: null as string | null,
  });

  const { toast } = useToast();

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadTasks();
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Effect for other filters
  useEffect(() => {
    loadTasks();
  }, [selectedStatus, selectedPriority, selectedProtocol, dateRange, cascadingFilters]);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      
      // Use the new cascading filter function
      const filters = {
        search: searchTerm || undefined,
        status: selectedStatus === "all" ? undefined : selectedStatus,
        priority: selectedPriority === "all" ? undefined : selectedPriority,
        dateFrom: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
        dateTo: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
        companyId: cascadingFilters.companyId,
        committeeId: cascadingFilters.committeeId,
        protocolId: selectedProtocol === "all" ? undefined : selectedProtocol,
      };

      const tasksData = await fetchTasksWithCascadingFilters(filters);
      setTasks(tasksData);
      
      // Calculate pagination based on the returned data
      setTotalPages(Math.ceil(tasksData.length / itemsPerPage));
      setCurrentPage(1);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter((task) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.agenda_item.title.toLowerCase().includes(searchLower) ||
        task.protocol?.number.toString().includes(searchLower) ||
        task.protocol?.committee?.name.toLowerCase().includes(searchLower) ||
        task.assigned_to?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = selectedStatus === "all" || task.status === selectedStatus;

      // Priority filter
      const matchesPriority = selectedPriority === "all" || task.priority === selectedPriority;

      // Protocol filter
      const matchesProtocol = selectedProtocol === "all" || task.protocol?.id === selectedProtocol;

      // Date range filter
      let matchesDateRange = true;
      if (dateRange?.from || dateRange?.to) {
        const taskDate = task.due_date ? new Date(task.due_date) : null;
        if (taskDate) {
          if (dateRange.from && isBefore(taskDate, startOfDay(dateRange.from))) {
            matchesDateRange = false;
          }
          if (dateRange.to && isAfter(taskDate, endOfDay(dateRange.to))) {
            matchesDateRange = false;
          }
        } else {
          matchesDateRange = false;
        }
      }

      return matchesSearch && matchesStatus && matchesPriority && matchesProtocol && matchesDateRange;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
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
        case "created_at":
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case "protocol_number":
          aValue = a.protocol?.number || 0;
          bValue = b.protocol?.number || 0;
          break;
        case "agenda_item_title":
          aValue = a.agenda_item.title.toLowerCase();
          bValue = b.agenda_item.title.toLowerCase();
          break;
        default:
          aValue = a[sortField];
          bValue = b[sortField];
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tasks, searchTerm, selectedStatus, selectedPriority, selectedProtocol, dateRange, sortField, sortOrder]);

  // Pagination
  const paginatedTasks = filteredAndSortedTasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique protocols for filter
  const uniqueProtocols = useMemo(() => {
    const protocols = tasks
      .map(task => task.protocol)
      .filter(Boolean)
      .map(protocol => ({
        id: protocol!.id,
        number: protocol!.number,
        committee: protocol!.committee?.name || 'No Committee'
      }));
    
    return Array.from(new Map(protocols.map(p => [p.id, p])).values());
  }, [tasks]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedPriority("all");
    setSelectedProtocol("all");
    setDateRange(undefined);
    setCurrentPage(1);
    loadTasks();
  };

  const handleViewTask = (task: TaskWithDetails) => {
    // Navigate to the protocol task tracking page
    window.open(`/dashboard/protocols/protocol-task-tracking?protocolId=${task.protocol?.id}`, '_blank');
  };

  const handleDeleteTask = (task: TaskWithDetails) => {
    setDeletingTask(task);
    setIsDeleteDialogOpen(true);
  };

  const handleEditTask = (task: TaskWithDetails) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingTask) return;

    setIsDeleting(true);
    try {
      await deleteTask(deletingTask.id);
      
      setTasks(prev => prev.filter(task => task.id !== deletingTask.id));
      toast({
        title: "Task Deleted",
        description: "Task has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete task. Please try again.",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setDeletingTask(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setDeletingTask(null);
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-semibold hover:bg-transparent"
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

  const handleCascadingFiltersApply = (filters: {
    companyId: string | null;
    committeeId: string | null;
    protocolId: string | null;
  }) => {
    setCascadingFilters(filters);
    loadTasks();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedStatus !== "all") count++;
    if (selectedPriority !== "all") count++;
    if (dateRange?.from || dateRange?.to) count++;
    if (cascadingFilters.companyId) count++;
    if (cascadingFilters.committeeId) count++;
    if (cascadingFilters.protocolId) count++;
    return count;
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedPriority("all");
    setDateRange(undefined);
    setCascadingFilters({
      companyId: null,
      committeeId: null,
      protocolId: null,
    });
    setCurrentPage(1);
    loadTasks();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading tasks...</div>
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Task Tracking</h1>
        <Button onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()} active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* First row: Search, Status, Priority, Protocol */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 rtl">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground rtl" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pr-10 rtl"
              />
            </div>
            {/* Status Filter */}
            <div>
              <Label htmlFor="status" className="mb-1 block">Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) => {
                  setSelectedStatus(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Done</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Priority Filter */}
            <div>
              <Label htmlFor="priority" className="mb-1 block">Priority</Label>
              <Select
                value={selectedPriority}
                onValueChange={(value) => {
                  setSelectedPriority(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Protocol Filter */}
            <div>
              <Label htmlFor="protocol" className="mb-1 block">Protocol</Label>
              <Select
                value={selectedProtocol}
                onValueChange={(value) => {
                  setSelectedProtocol(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All protocols" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All protocols</SelectItem>
                  {uniqueProtocols.map((protocol) => (
                    <SelectItem key={protocol.id} value={protocol.id}>
                      #{protocol.number} - {protocol.committee}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Second row: Date Range and Advanced Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mb-4 rtl">
            {/* Date Range */}
            <div>
              <Label className="mb-1 block">Due Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-right font-normal rtl",
                      !dateRange?.from && !dateRange?.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4 rtl" />
                    {dateRange?.from ? (
                      dateRange?.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy")
                      )
                    ) : (
                      "Select date range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range) => {
                      setDateRange(range);
                      setCurrentPage(1);
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            {/* Advanced Filters Button */}
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setCascadingFilterDialogOpen(true)}
                className="flex items-center gap-2 w-full md:w-auto"
              >
                <Filter className="h-4 w-4" />
                Advanced Filters
                {(cascadingFilters.companyId || cascadingFilters.committeeId || cascadingFilters.protocolId) && (
                  <Badge variant="secondary" className="ml-1">
                    {(cascadingFilters.companyId ? 1 : 0) + (cascadingFilters.committeeId ? 1 : 0) + (cascadingFilters.protocolId ? 1 : 0)}
                  </Badge>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-muted-foreground hover:text-foreground mr-2 rtl"
              >
                Clear all
              </Button>
            </div>
          </div>

          {/* Active Filters Display */}
          {getActiveFiltersCount() > 0 && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <Badge variant="outline" className="gap-1">
                    Search: {searchTerm}
                    <button
                      onClick={() => setSearchTerm("")}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {selectedStatus !== "all" && (
                  <Badge variant="outline" className="gap-1">
                    Status: {selectedStatus}
                    <button
                      onClick={() => setSelectedStatus("all")}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {selectedPriority !== "all" && (
                  <Badge variant="outline" className="gap-1">
                    Priority: {selectedPriority}
                    <button
                      onClick={() => setSelectedPriority("all")}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {(dateRange?.from || dateRange?.to) && (
                  <Badge variant="outline" className="gap-1">
                    Date: {dateRange.from ? format(dateRange.from, "dd/MM/yyyy") : "From"} - {dateRange.to ? format(dateRange.to, "dd/MM/yyyy") : "To"}
                    <button
                      onClick={() => setDateRange(undefined)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {cascadingFilters.companyId && (
                  <Badge variant="outline" className="gap-1">
                    Company filter
                    <button
                      onClick={() => {
                        setCascadingFilters({ companyId: null, committeeId: null, protocolId: null });
                        loadTasks();
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks Table */}
      {filteredAndSortedTasks.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground">
              {tasks.length === 0 ? (
                <>
                  <p className="text-lg font-medium mb-2">No tasks found</p>
                  <p>Get started by creating your first task.</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium mb-2">No tasks match your filters</p>
                  <p>Try adjusting your search criteria or clear the filters.</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortableHeader field="title">Task Title</SortableHeader>
                    </TableHead>
                    <TableHead>
                      <SortableHeader field="agenda_item_title">Agenda Item</SortableHeader>
                    </TableHead>
                    <TableHead>
                      <SortableHeader field="protocol_number">Protocol</SortableHeader>
                    </TableHead>
                    <TableHead>
                      <SortableHeader field="status">Status</SortableHeader>
                    </TableHead>
                    <TableHead>
                      <SortableHeader field="priority">Priority</SortableHeader>
                    </TableHead>
                    <TableHead>
                      <SortableHeader field="due_date">Due Date</SortableHeader>
                    </TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>
                      <SortableHeader field="created_at">Created</SortableHeader>
                    </TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium max-w-[200px]">
                        <div className="truncate" title={task.title}>
                          {task.title}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="truncate" title={task.agenda_item.title}>
                          {task.agenda_item.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        {task.protocol ? (
                          <Link 
                            href={`/dashboard/protocols/${task.protocol.id}`}
                            className="text-primary hover:underline"
                          >
                            #{task.protocol.number}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">No protocol</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(task.status)}</TableCell>
                      <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                      <TableCell>
                        {task.due_date ? formatDate(task.due_date) : (
                          <span className="text-muted-foreground">No due date</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.assigned_to || (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(task.created_at)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewTask(task)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View in Board
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditTask(task)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Task
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteTask(task)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredAndSortedTasks.length)} of{" "}
                  {filteredAndSortedTasks.length} results
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the task "{deletingTask?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cascading Filter Dialog */}
      <CascadingFilterDialog
        open={cascadingFilterDialogOpen}
        onOpenChange={setCascadingFilterDialogOpen}
        onApplyFilters={handleCascadingFiltersApply}
        currentFilters={cascadingFilters}
      />

      {/* Edit Task Dialog */}
      <EditTaskDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        task={editingTask}
        onTaskUpdated={loadTasks}
      />
    </div>
  );
} 