"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Users
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

type Committee = Database["public"]["Tables"]["committees"]["Row"];
type Company = Database["public"]["Tables"]["companies"]["Row"];
type CompanyOption = Pick<Company, "id" | "name">;
type CommitteeWithCompany = Committee & {
  company: CompanyOption | null;
  members: { count: number }[];
};

type SortField = "name" | "created_at";
type SortOrder = "asc" | "desc";

export default function CommitteesPage() {
  const [committees, setCommittees] = useState<CommitteeWithCompany[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [isAdding, setIsAdding] = useState(false);
  const [newCommitteeName, setNewCommitteeName] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState<CommitteeWithCompany | null>(null);
  const [editCommitteeName, setEditCommitteeName] = useState("");
  const [editCommitteeCompanyId, setEditCommitteeCompanyId] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [committeeToDelete, setCommitteeToDelete] = useState<Committee | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [committeeToView, setCommitteeToView] = useState<CommitteeWithCompany | null>(null);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [selectedCommittee, setSelectedCommittee] = useState<CommitteeWithCompany | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [newMemberName, setNewMemberName] = useState("");
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [editMemberName, setEditMemberName] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  const itemsPerPage = 10;

  useEffect(() => {
    fetchCommittees();
    fetchCompanies();
  }, []);

  const fetchCommittees = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/committees");
      
      if (!response.ok) {
        throw new Error("Failed to fetch committees");
      }
      
      const data = await response.json();
      setCommittees(data || []);
    } catch (error) {
      console.error("Error fetching committees:", error);
      setError("שגיאה בטעינת הוועדות");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/companies");
      
      if (!response.ok) {
        throw new Error("Failed to fetch companies");
      }
      
      const data = await response.json();
      setCompanies(data || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
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

  const handleAddCommittee = async () => {
    if (!newCommitteeName.trim()) {
      toast({
        title: "שגיאה",
        description: "שם הוועדה לא יכול להיות ריק",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCompanyId) {
      toast({
        title: "שגיאה",
        description: "יש לבחור חברה",
        variant: "destructive",
      });
      return;
    }

    // Check if committee name already exists
    const existingCommittee = committees.find(
      committee => committee.name.toLowerCase() === newCommitteeName.trim().toLowerCase()
    );

    if (existingCommittee) {
      toast({
        title: "שגיאה",
        description: "כבר קיימת ועדה עם שם זה",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/committees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCommitteeName.trim(),
          company_id: selectedCompanyId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create committee");
      }

      toast({
        title: "הצלחה",
        description: "הוועדה נוספה בהצלחה",
      });

      const newCommittee = await response.json();
      
      // Add the new committee to local state
      setCommittees(prevCommittees => [...prevCommittees, { ...newCommittee, company: companies.find(c => c.id === newCommittee.company_id) || null, members: [{ count: 0 }] }]);
      
      setNewCommitteeName("");
      setSelectedCompanyId("");
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding committee:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה בהוספת הוועדה",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCommittee = async () => {
    if (!committeeToDelete) return;

    try {
      const response = await fetch(`/api/committees/${committeeToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete committee");
      }

      toast({
        title: "הצלחה",
        description: "הוועדה נמחקה בהצלחה",
      });

      setDeleteDialogOpen(false);
      setCommitteeToDelete(null);
      fetchCommittees();
    } catch (error) {
      console.error("Error deleting committee:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה במחיקת הוועדה",
        variant: "destructive",
      });
    }
  };

  const handleViewCommittee = (committee: CommitteeWithCompany) => {
    setCommitteeToView(committee);
    setViewDialogOpen(true);
  };

  const handleEditCommittee = (committee: CommitteeWithCompany) => {
    setEditingCommittee(committee);
    setEditCommitteeName(committee.name);
    setEditCommitteeCompanyId(committee.company_id || "");
    setIsEditing(true);
  };

  const handleUpdateCommittee = async () => {
    if (!editingCommittee || !editCommitteeName.trim()) {
      toast({
        title: "שגיאה",
        description: "שם הוועדה לא יכול להיות ריק",
        variant: "destructive",
      });
      return;
    }

    if (!editCommitteeCompanyId) {
      toast({
        title: "שגיאה",
        description: "יש לבחור חברה",
        variant: "destructive",
      });
      return;
    }

    // Check if committee name already exists (excluding current committee)
    const existingCommittee = committees.find(
      committee => 
        committee.id !== editingCommittee.id &&
        committee.name.toLowerCase() === editCommitteeName.trim().toLowerCase()
    );

    if (existingCommittee) {
      toast({
        title: "שגיאה",
        description: "כבר קיימת ועדה עם שם זה",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/committees/${editingCommittee.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editCommitteeName.trim(),
          company_id: editCommitteeCompanyId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update committee");
      }

      toast({
        title: "הצלחה",
        description: "הוועדה עודכנה בהצלחה",
      });

      const updatedCommittee = await response.json();
      
      // Update the committee in local state
      setCommittees(prevCommittees => 
        prevCommittees.map(committee => 
          committee.id === editingCommittee.id 
            ? { 
                ...updatedCommittee, 
                company: companies.find(c => c.id === updatedCommittee.company_id) || null,
                members: committee.members // Keep existing member count
              }
            : committee
        )
      );
      
      setEditCommitteeName("");
      setEditCommitteeCompanyId("");
      setEditingCommittee(null);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating committee:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה בעדכון הוועדה",
        variant: "destructive",
      });
    }
  };

  const handleOpenMembersDialog = async (committee: CommitteeWithCompany) => {
    setSelectedCommittee(committee);
    setMembersDialogOpen(true);
    setNewMemberName("");
    setEditingMember(null);
    setEditMemberName("");
    
    try {
      const response = await fetch(`/api/committees/${committee.id}/members`);
      if (!response.ok) {
        throw new Error("Failed to fetch members");
      }
      const data = await response.json();
      setMembers(data || []);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה בטעינת חברי הוועדה",
        variant: "destructive",
      });
    }
  };

  const handleAddMember = async () => {
    if (!selectedCommittee || !newMemberName.trim()) {
      toast({
        title: "שגיאה",
        description: "שם החבר נדרש",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/committees/${selectedCommittee.id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newMemberName.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add member");
      }

      const newMember = await response.json();
      setMembers([...members, newMember]);
      setNewMemberName("");
      
      // Update the committee's member count locally
      setCommittees(prevCommittees => 
        prevCommittees.map(committee => 
          committee.id === selectedCommittee?.id 
            ? { ...committee, members: [{ count: (committee.members?.[0]?.count || 0) + 1 }] }
            : committee
        )
      );
      
      toast({
        title: "הצלחה",
        description: "החבר נוסף בהצלחה",
      });
    } catch (error) {
      console.error("Error adding member:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה בהוספת החבר",
        variant: "destructive",
      });
    }
  };

  const handleEditMember = async () => {
    if (!editingMember || !editMemberName.trim()) {
      toast({
        title: "שגיאה",
        description: "שם החבר נדרש",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/committees/${selectedCommittee!.id}/members/${editingMember.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editMemberName.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update member");
      }

      const updatedMember = await response.json();
      setMembers(members.map(m => m.id === editingMember.id ? updatedMember : m));
      setEditingMember(null);
      setEditMemberName("");
      
      toast({
        title: "הצלחה",
        description: "החבר עודכן בהצלחה",
      });
    } catch (error) {
      console.error("Error updating member:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה בעדכון החבר",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/committees/${selectedCommittee!.id}/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete member");
      }

      setMembers(members.filter(m => m.id !== memberId));
      
      // Update the committee's member count locally
      setCommittees(prevCommittees => 
        prevCommittees.map(committee => 
          committee.id === selectedCommittee?.id 
            ? { ...committee, members: [{ count: Math.max(0, (committee.members?.[0]?.count || 0) - 1) }] }
            : committee
        )
      );
      
      toast({
        title: "הצלחה",
        description: "החבר נמחק בהצלחה",
      });
    } catch (error) {
      console.error("Error deleting member:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה במחיקת החבר",
        variant: "destructive",
      });
    }
  };

  const filteredAndSortedCommittees = committees
    .filter((committee) =>
      committee.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: string | Date;
      let bValue: string | Date;

      if (sortField === "name") {
        aValue = a.name;
        bValue = b.name;
      } else {
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const totalPages = Math.ceil(filteredAndSortedCommittees.length / itemsPerPage);
  const paginatedCommittees = filteredAndSortedCommittees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const clearFilters = () => {
    setSearchTerm("");
    setCurrentPage(1);
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
        <div className="text-center">טוען ועדות...</div>
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
        <h1 className="text-3xl font-bold">ועדות</h1>
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
                  placeholder="חפש ועדות..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pr-10 rtl"
                />
              </div>
            </div>
          </div>
          {/* Clear Filters */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              מציג {filteredAndSortedCommittees.length} מתוך {committees.length} ועדות
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              disabled={!searchTerm}
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
                <div className="space-y-2">
                  <Label htmlFor="new-committee">שם הוועדה</Label>
                  <Input
                    id="new-committee"
                    value={newCommitteeName}
                    onChange={(e) => setNewCommitteeName(e.target.value)}
                    placeholder="הכנס שם ועדה"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-select">חברה</Label>
                  <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר חברה" />
                    </SelectTrigger>
                    <SelectContent className="w-fit min-w-0">
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsAdding(false);
                      setNewCommitteeName("");
                      setSelectedCompanyId("");
                    }}
                    className="h-10 w-10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleAddCommittee}
                    disabled={!newCommitteeName.trim() || !selectedCompanyId}
                    className="h-10 w-10"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {isEditing && editingCommittee && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold">עריכת ועדה: {editingCommittee.name}</h3>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-committee">שם הוועדה</Label>
                  <Input
                    id="edit-committee"
                    value={editCommitteeName}
                    onChange={(e) => setEditCommitteeName(e.target.value)}
                    placeholder="הכנס שם ועדה"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-company-select">חברה</Label>
                  <Select value={editCommitteeCompanyId} onValueChange={setEditCommitteeCompanyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר חברה" />
                    </SelectTrigger>
                    <SelectContent className="w-fit min-w-0">
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsEditing(false);
                      setEditingCommittee(null);
                      setEditCommitteeName("");
                      setEditCommitteeCompanyId("");
                    }}
                    className="h-10 w-10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleUpdateCommittee}
                    disabled={!editCommitteeName.trim() || !editCommitteeCompanyId}
                    className="h-10 w-10"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">רשימת ועדות</h2>
            {!isAdding && !isEditing && (
              <Button onClick={() => setIsAdding(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                הוסף ועדה
              </Button>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortableHeader field="name">שם הוועדה</SortableHeader>
                </TableHead>
                <TableHead>חברה</TableHead>
                <TableHead>מספר חברים</TableHead>
                <TableHead>
                  <SortableHeader field="created_at">תאריך יצירה</SortableHeader>
                </TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCommittees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    {searchTerm ? "לא נמצאו ועדות" : "אין ועדות"}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCommittees.map((committee) => (
                  <TableRow key={committee.id}>
                    <TableCell className="font-medium">{committee.name}</TableCell>
                    <TableCell>
                      {committee.company?.name || "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="link"
                        className="p-0 h-auto font-normal text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        onClick={() => handleOpenMembersDialog(committee)}
                      >
                        <Users className="h-4 w-4" />
                        {committee.members?.[0]?.count || 0}
                      </Button>
                    </TableCell>
                    <TableCell>
                      {new Date(committee.created_at).toLocaleDateString("he-IL")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-fit min-w-0">
                          <DropdownMenuItem onClick={() => handleViewCommittee(committee)}>
                            <Eye className="mr-2 h-4 w-4" />
                            צפייה
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditCommittee(committee)}>
                            <Edit className="mr-2 h-4 w-4" />
                            עריכה
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setCommitteeToDelete(committee);
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

      {/* View Committee Dialog */}
      <AlertDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <AlertDialogContent className="max-w-md rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>פרטי הוועדה</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-4 py-4 rtl">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">שם הוועדה</Label>
              <p className="text-sm">{committeeToView?.name}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">חברה</Label>
              <p className="text-sm">{committeeToView?.company?.name || "לא צוין"}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">מספר חברים</Label>
              <p className="text-sm">{committeeToView?.members?.[0]?.count || 0} חברים</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">תאריך יצירה</Label>
              <p className="text-sm">
                {committeeToView?.created_at 
                  ? new Date(committeeToView.created_at).toLocaleDateString("he-IL")
                  : "לא צוין"
                }
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>סגור</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את הוועדה "{committeeToDelete?.name}" לצמיתות.
              לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCommittee} className="bg-red-600">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Members Management Dialog */}
      <AlertDialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>ניהול חברי ועדה: {selectedCommittee?.name}</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            {/* Add New Member */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="text-lg font-semibold">הוסף חבר חדש</h3>
              <div className="flex gap-2">
                <Input
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="הזן שם חבר"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleAddMember}
                  disabled={!newMemberName.trim()}
                  className="h-10 w-10"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Members List */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">רשימת חברים</h3>
              {members.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  אין חברים בוועדה זו
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      {editingMember?.id === member.id ? (
                        <div className="flex gap-2 flex-1">
                          <Input
                            value={editMemberName}
                            onChange={(e) => setEditMemberName(e.target.value)}
                            placeholder="הזן שם חבר"
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleEditMember}
                            disabled={!editMemberName.trim()}
                            className="h-8 w-8"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingMember(null);
                              setEditMemberName("");
                            }}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="flex-1">{member.name}</span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingMember(member);
                                setEditMemberName(member.name);
                              }}
                              className="h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteMember(member.id)}
                              className="h-8 w-8 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>סגור</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 