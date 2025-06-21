"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";
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
  Download,
  MoreHorizontal,
  X,
  Printer
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
  return isValid(date) ? format(date, "dd/MM/yyyy") : "Invalid date";
};

const getStatusBadge = (dueDate: string) => {
  const today = new Date();
  const due = new Date(dueDate);
  
  if (isAfter(today, due)) {
    return <Badge variant="destructive">Overdue</Badge>;
  } else if (isAfter(today, new Date(due.getTime() - 7 * 24 * 60 * 60 * 1000))) {
    return <Badge variant="secondary">Due Soon</Badge>;
  } else {
    return <Badge variant="default">On Track</Badge>;
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
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
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
      
      // Close dialog and reset state
      setIsDeleteDialogOpen(false);
      setDeletingProtocol(null);
    } catch (error) {
      console.error("Error deleting protocol:", error);
      alert("Failed to delete protocol. Please try again.");
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
        <div className="text-center">Loading protocols...</div>
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
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Protocols</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all committee protocols
          </p>
        </div>
        <Link href="/dashboard/protocols/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Protocol
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search protocols..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Committee Filter */}
            <div className="space-y-2">
              <Label htmlFor="committee">Committee</Label>
              <Select
                value={selectedCommittee}
                onValueChange={(value) => {
                  setSelectedCommittee(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All committees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All committees</SelectItem>
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
              <Label htmlFor="status">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="due-soon">Due Soon</SelectItem>
                  <SelectItem value="on-track">On Track</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>Due Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange?.from && !dateRange?.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
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
          </div>

          {/* Clear Filters */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {filteredAndSortedProtocols.length} of {protocols.length} protocols
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              disabled={!searchTerm && selectedCommittee === "all" && !dateRange?.from && statusFilter === "all"}
            >
              Clear Filters
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
                  <p className="text-lg font-medium mb-2">No protocols found</p>
                  <p>Get started by creating your first protocol.</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium mb-2">No protocols match your filters</p>
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
                      <SortableHeader field="number">Protocol #</SortableHeader>
                    </TableHead>
                    <TableHead>
                      <SortableHeader field="committee_name">Committee</SortableHeader>
                    </TableHead>
                    <TableHead>
                      <SortableHeader field="due_date">Due Date</SortableHeader>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <SortableHeader field="created_at">Created</SortableHeader>
                    </TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
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
                          <span className="text-muted-foreground">No committee</span>
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
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditProtocol(protocol.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewPdf(protocol)}>
                              <Download className="mr-2 h-4 w-4" />
                              Export
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteProtocol(protocol)}
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
                  {Math.min(currentPage * itemsPerPage, filteredAndSortedProtocols.length)} of{" "}
                  {filteredAndSortedProtocols.length} results
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
                <DialogTitle>Protocol #{viewingProtocol.number}</DialogTitle>
                <Button variant="secondary" onClick={() => window.print()} className="ml-4 rounded-md border border-blue-600 bg-blue-600 text-white shadow-sm flex items-center gap-2 hover:bg-blue-700 hover:border-blue-700 focus:ring-2 focus:ring-blue-400 focus:outline-none">
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button variant="secondary" onClick={handleCloseViewModal} className="ml-2 rounded-md border border-gray-300 shadow-sm flex items-center gap-2 hover:bg-gray-100 hover:border-gray-400 focus:ring-2 focus:ring-blue-400">
                  <X className="h-4 w-4" />
                  Close
                </Button>
              </div>
            </DialogHeader>
            <div className="overflow-auto p-12 pt-6" style={{ maxHeight: "calc(80vh - 80px)" }}>
              {isLoadingViewData ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p>Loading protocol data...</p>
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
                  Failed to load protocol data
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
            <AlertDialogTitle>Delete Protocol</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete Protocol #{deletingProtocol?.number}? This action cannot be undone and will permanently remove the protocol and all its associated data including agenda items, members, attachments, and messages.
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
    </div>
  );
} 