"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isValid, parseISO, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { he } from "date-fns/locale";
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
  Download,
  MoreHorizontal,
  X,
  Printer,
  CheckSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import ProtocolPdfModal from "./components/ProtocolPdfModal";
import { deleteProtocol, getProtocolViewData } from "./[id]/supabaseApi";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ProtocolPdfView from "./[id]/components/ProtocolPdfView";
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
import { useToast } from "@/components/ui/use-toast";

type Protocol = Database["public"]["Tables"]["protocols"]["Row"] & {
  committee: Database["public"]["Tables"]["committees"]["Row"] | null;
};

type Committee = {
  id: string;
  name: string;
};

type SortField = "due_date" | "number" | "committee_name" | "created_at";
type SortOrder = "asc" | "desc";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return isValid(date) ? format(date, "dd/MM/yyyy", { locale: he }) : "תאריך שגוי";
};

const getStatusBadge = (dueDate: string) => {
  const today = new Date();
  const due = new Date(dueDate);
  
  if (isAfter(today, due)) {
    return <Badge variant="destructive">באיחור</Badge>;
  } else if (isAfter(today, new Date(due.getTime() - 7 * 24 * 60 * 60 * 1000))) {
    return <Badge variant="secondary">בקרוב</Badge>;
  } else {
    return <Badge variant="default">במסלול</Badge>;
  }
};

export default function ProtocolsPage() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCommittee, setSelectedCommittee] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Sorting states
  const [sortField, setSortField] = useState<SortField>("due_date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // PDF Viewer states
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);

  // View modal states (for showing ProtocolPdfView like in protocol page)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingProtocol, setViewingProtocol] = useState<Protocol | null>(null);
  const [viewModalData, setViewModalData] = useState<{
    agendaItems: any[];
    protocolMembers: any[];
    protocolAttachments: any[];
    protocolMessages: any[];
    company: any;
  } | null>(null);
  const [isLoadingViewData, setIsLoadingViewData] = useState(false);

  // Delete confirmation states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingProtocol, setDeletingProtocol] = useState<Protocol | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        
        // Fetch protocols
        const { data: protocolsData, error: protocolsError } = await supabase
          .from("protocols")
          .select(`
            *,
            committee:committees!committee_id(*)
          `)
          .order("due_date", { ascending: false });

        if (protocolsError) {
          console.error("Error fetching protocols:", protocolsError);
          setError(protocolsError.message);
          return;
        }

        setProtocols(protocolsData || []);

        // Fetch committees for filter
        const { data: committeesData, error: committeesError } = await supabase
          .from("committees")
          .select("id, name")
          .order("name");

        if (committeesError) {
          console.error("Error fetching committees:", committeesError);
        } else {
          setCommittees(committeesData || []);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError(err instanceof Error ? err.message : "אירעה שגיאה בלתי צפויה");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter and sort protocols
  const filteredAndSortedProtocols = useMemo(() => {
    let filtered = protocols.filter((protocol) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        protocol.number.toString().includes(searchLower) ||
        protocol.committee?.name?.toLowerCase().includes(searchLower) ||
        formatDate(protocol.due_date).includes(searchLower);

      if (!matchesSearch) return false;

      // Committee filter
      if (selectedCommittee !== "all" && protocol.committee_id !== selectedCommittee) {
        return false;
      }

      // Date range filter
      if (dateRange && (dateRange.from || dateRange.to)) {
        const protocolDate = parseISO(protocol.due_date);
        if (dateRange.from && isBefore(protocolDate, startOfDay(dateRange.from))) {
          return false;
        }
        if (dateRange.to && isAfter(protocolDate, endOfDay(dateRange.to))) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "all") {
        const today = new Date();
        const due = new Date(protocol.due_date);
        
        switch (statusFilter) {
          case "overdue":
            if (!isAfter(today, due)) return false;
            break;
          case "due-soon":
            if (!isAfter(today, new Date(due.getTime() - 7 * 24 * 60 * 60 * 1000))) return false;
            break;
          case "on-track":
            if (isAfter(today, due) || isAfter(today, new Date(due.getTime() - 7 * 24 * 60 * 60 * 1000))) return false;
            break;
        }
      }

      return true;
    });

    // Sort protocols
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case "due_date":
          aValue = new Date(a.due_date);
          bValue = new Date(b.due_date);
          break;
        case "number":
          aValue = a.number;
          bValue = b.number;
          break;
        case "committee_name":
          aValue = a.committee?.name || "";
          bValue = b.committee?.name || "";
          break;
        case "created_at":
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          aValue = new Date(a.due_date);
          bValue = new Date(b.due_date);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [protocols, searchTerm, selectedCommittee, dateRange, statusFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProtocols.length / itemsPerPage);
  const paginatedProtocols = filteredAndSortedProtocols.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCommittee("all");
    setDateRange(undefined);
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const handleViewPdf = (protocol: Protocol) => {
    setSelectedProtocol(protocol);
    setIsPdfViewerOpen(true);
  };

  const handleClosePdfViewer = () => {
    setIsPdfViewerOpen(false);
    setSelectedProtocol(null);
  };

  const handleViewProtocol = async (protocol: Protocol) => {
    setViewingProtocol(protocol);
    setIsViewModalOpen(true);
    setIsLoadingViewData(true);

    try {
      const data = await getProtocolViewData(protocol.id);
      setViewModalData({
        agendaItems: data.agendaItems,
        protocolMembers: data.protocolMembers,
        protocolAttachments: data.protocolAttachments,
        protocolMessages: data.protocolMessages,
        company: data.company
      });
    } catch (error) {
      console.error("Error fetching protocol data for view:", error);
    } finally {
      setIsLoadingViewData(false);
    }
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewingProtocol(null);
  };

  const handleEditProtocol = (protocolId: string) => {
    window.location.href = `/dashboard/protocols/${protocolId}`;
  };

  const handleTasksProtocol = (protocolId: string) => {
    window.location.href = `/dashboard/protocols/protocol-task-tracking?protocolId=${protocolId}&returnTo=protocols`;
  };

  const handleDeleteProtocol = (protocol: Protocol) => {
    setDeletingProtocol(protocol);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingProtocol) return;

    setIsDeleting(true);
    try {
      await deleteProtocol(deletingProtocol.id);

      // Remove from local state
      setProtocols(prev => prev.filter(p => p.id !== deletingProtocol.id));
      
      toast({
        title: "פרוטוקול נמחק",
        description: `פרוטוקול #${deletingProtocol.number} נמחק בהצלחה.`,
      });

      // Close dialog and reset state
      setIsDeleteDialogOpen(false);
      setDeletingProtocol(null);
    } catch (error) {
      console.error("Error deleting protocol:", error);
      toast({
        variant: "destructive",
        title: "שגיאת מחיקת פרוטוקול",
        description: "נכשל מחיקת פרוטוקול. אנא נסה שוב.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setDeletingProtocol(null);
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
        <div className="text-center">טוען פרוטוקולים...</div>
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
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">פרוטוקולים</h1>
          <p className="text-muted-foreground mt-1">
            ניהול ומעקב אחר כל פרוטוקולי הוועדות
          </p>
        </div>
        <Link href="/dashboard/protocols/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            צור פרוטוקול
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            סינון וחיפוש
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
                  placeholder="חפש פרוטוקולים..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pr-10 rtl"
                />
              </div>
            </div>

            {/* Committee Filter */}
            <div className="space-y-2">
              <Label htmlFor="committee">ועדה</Label>
              <Select
                value={selectedCommittee}
                onValueChange={(value) => {
                  setSelectedCommittee(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="כל הוועדות" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הוועדות</SelectItem>
                  {committees.map((committee) => (
                    <SelectItem key={committee.id} value={committee.id}>
                      {committee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status">סטטוס</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="כל הסטטוסים" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הסטטוסים</SelectItem>
                  <SelectItem value="overdue">באיחור</SelectItem>
                  <SelectItem value="due-soon">בקרוב</SelectItem>
                  <SelectItem value="on-track">במסלול</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>טווח תאריך יעד</Label>
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
                      "בחר טווח תאריכים"
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
          </div>

          {/* Clear Filters */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              מציג {filteredAndSortedProtocols.length} מתוך {protocols.length} פרוטוקולים
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              disabled={!searchTerm && selectedCommittee === "all" && !dateRange?.from && statusFilter === "all"}
            >
              נקה סינון
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Protocols Table */}
      {filteredAndSortedProtocols.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground">
              {protocols.length === 0 ? (
                <>
                  <p className="text-lg font-medium mb-2">לא נמצאו פרוטוקולים</p>
                  <p>התחל על ידי יצירת הפרוטוקול הראשון שלך.</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium mb-2">אין פרוטוקולים התואמים לסינון שלך</p>
                  <p>נסה לשנות את קריטריוני החיפוש או נקה את הסינון.</p>
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
                      <SortableHeader field="number">מספר פרוטוקול</SortableHeader>
                    </TableHead>
                    <TableHead>
                      <SortableHeader field="committee_name">ועדה</SortableHeader>
                    </TableHead>
                    <TableHead>
                      <SortableHeader field="due_date">תאריך יעד</SortableHeader>
                    </TableHead>
                    <TableHead>סטטוס</TableHead>
                    <TableHead>
                      <SortableHeader field="created_at">נוצר ב</SortableHeader>
                    </TableHead>
                    <TableHead className="w-[100px]">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProtocols.map((protocol) => (
                    <TableRow key={protocol.id}>
                      <TableCell className="font-medium">
                        <Link 
                          href={`/dashboard/protocols/${protocol.id}`}
                          className="text-primary hover:underline"
                        >
                          #{protocol.number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {protocol.committee?.name || (
                          <span className="text-muted-foreground">אין ועדה</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(protocol.due_date)}</TableCell>
                      <TableCell>{getStatusBadge(protocol.due_date)}</TableCell>
                      <TableCell>{formatDate(protocol.created_at)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewProtocol(protocol)}>
                              <Eye className="mr-2 h-4 w-4" />
                              צפייה
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditProtocol(protocol.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              עריכה
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewPdf(protocol)}>
                              <Download className="mr-2 h-4 w-4" />
                              ייצוא
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTasksProtocol(protocol.id)}>
                              <CheckSquare className="mr-2 h-4 w-4" />
                              משימות
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteProtocol(protocol)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              מחיקה
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
                  מציג {((currentPage - 1) * itemsPerPage) + 1} עד{" "}
                  {Math.min(currentPage * itemsPerPage, filteredAndSortedProtocols.length)} מתוך{" "}
                  {filteredAndSortedProtocols.length} תוצאות
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    קודם
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
                    הבא
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* PDF Viewer Modal */}
      {selectedProtocol && (
        <ProtocolPdfModal
          isOpen={isPdfViewerOpen}
          onClose={handleClosePdfViewer}
          protocolId={selectedProtocol.id}
          protocolNumber={selectedProtocol.number.toString()}
        />
      )}

      {/* View Protocol Modal */}
      {viewingProtocol && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-5xl w-full max-h-[80vh] bg-white flex flex-col p-0" style={{ borderRadius: 0 }}>
            <DialogHeader className="sticky top-0 z-10 bg-white text-black flex flex-row items-center justify-between p-6 border-b shadow">
              <div className="flex items-center gap-2">
                <DialogTitle>פרוטוקול #{viewingProtocol.number}</DialogTitle>
                <Button variant="secondary" onClick={() => window.print()} className="ml-4 rounded-md border border-blue-600 bg-blue-600 text-white shadow-sm flex items-center gap-2 hover:bg-blue-700 hover:border-blue-700 focus:ring-2 focus:ring-blue-400 focus:outline-none">
                  <Printer className="h-4 w-4" />
                  הדפסה
                </Button>
                <Button variant="secondary" onClick={handleCloseViewModal} className="ml-2 rounded-md border border-gray-300 shadow-sm flex items-center gap-2 hover:bg-gray-100 hover:border-gray-400 focus:ring-2 focus:ring-blue-400">
                  <X className="h-4 w-4" />
                  סגירה
                </Button>
              </div>
            </DialogHeader>
            <div className="overflow-auto p-12 pt-6" style={{ maxHeight: "calc(80vh - 80px)" }}>
              {isLoadingViewData ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p>טוען נתוני פרוטוקול...</p>
                  </div>
                </div>
              ) : viewModalData ? (
                <ProtocolPdfView
                  protocol={viewingProtocol}
                  agendaItems={viewModalData.agendaItems}
                  protocolMembers={viewModalData.protocolMembers}
                  protocolAttachments={viewModalData.protocolAttachments}
                  protocolMessages={viewModalData.protocolMessages}
                  formatDate={formatDate}
                  company={viewModalData.company}
                />
              ) : (
                <div className="text-center text-red-500">
                  נכשל טעינת נתוני הפרוטוקול
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת פרוטוקול</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את פרוטוקול #{deletingProtocol?.number}? פעולה זו אינה ניתנת לביטול ותסיר לצמיתות את הפרוטוקול וכל הנתונים המשויכים אליו כולל סעיפים, חברים, קבצים והודעות.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "מוחק..." : "מחק"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 