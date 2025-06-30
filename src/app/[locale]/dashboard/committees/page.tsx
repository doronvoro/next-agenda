"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isValid } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, X, Check, Users, UserPlus, ChevronDown, ChevronUp, ArrowUpDown, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { getLocaleFromPathname } from "@/lib/i18n/client";
import AppDropdown from "@/components/AppDropdown";
import { RtlProvider } from "@/context/RtlContext";

type Committee = Database["public"]["Tables"]["committees"]["Row"];
type CommitteeMember = Database["public"]["Tables"]["committees_members"]["Row"];
type Company = {
  id: string;
  name: string;
};

// Add sort and filter types
type SortField = "name" | "company" | "created_at" | "updated_at";
type SortOrder = "asc" | "desc";

const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return isValid(date) ? format(date, "dd/MM/yyyy") : "Invalid date";
};

export default function CommitteesPage() {
  const { toast } = useToast();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [committeeMembers, setCommitteeMembers] = useState<Record<string, CommitteeMember[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newCommitteeName, setNewCommitteeName] = useState("");
  const [newCompanyId, setNewCompanyId] = useState<string>("");
  const [editingCommittee, setEditingCommittee] = useState<Committee | null>(null);
  const [deletingCommitteeId, setDeletingCommitteeId] = useState<string | null>(null);
  
  // Member management state
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<CommitteeMember | null>(null);
  const [editingMemberName, setEditingMemberName] = useState("");

  // Filtering, sorting, and pagination states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const t = useTranslations("dashboard.committees");
  const pathname = usePathname();
  const currentLocale = getLocaleFromPathname(pathname);
  const isRTL = currentLocale === 'he';

  useEffect(() => {
    fetchCommittees();
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (committees.length > 0) {
      fetchAllCommitteeMembers();
    }
  }, [committees]);

  const fetchAllCommitteeMembers = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("committees_members")
        .select("*")
        .order("name");

      if (error) throw error;

      // Group members by committee_id
      const membersByCommittee: Record<string, CommitteeMember[]> = {};
      data?.forEach(member => {
        if (!membersByCommittee[member.committee_id]) {
          membersByCommittee[member.committee_id] = [];
        }
        membersByCommittee[member.committee_id].push(member);
      });

      setCommitteeMembers(membersByCommittee);
    } catch (err) {
      console.error("Error fetching committee members:", err);
    }
  };

  const fetchCommitteeMembers = async (committeeId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("committees_members")
        .select("*")
        .eq("committee_id", committeeId)
        .order("name");

      if (error) throw error;

      setCommitteeMembers(prev => ({
        ...prev,
        [committeeId]: data || []
      }));
    } catch (err) {
      console.error("Error fetching committee members:", err);
    }
  };

  const fetchCompanies = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setCompanies(data || []);
    } catch (err) {
      console.error("Error fetching companies:", err);
      setError(err instanceof Error ? err.message : "Failed to load companies");
    }
  };

  const fetchCommittees = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("committees")
        .select("*")
        .order("name");

      if (error) throw error;
      setCommittees(data || []);
    } catch (err) {
      console.error("Error fetching committees:", err);
      setError(err instanceof Error ? err.message : "Failed to load committees");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCommittee = async () => {
    if (!newCommitteeName.trim()) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("committees")
        .insert([{ 
          name: newCommitteeName.trim(),
          company_id: newCompanyId || null
        }])
        .select()
        .single();

      if (error) throw error;

      setCommittees(prev => [...prev, data]);
      setNewCommitteeName("");
      setNewCompanyId("");
      setIsAdding(false);

      toast({
        title: "Success",
        description: "Committee added successfully",
      });
    } catch (err) {
      console.error("Error adding committee:", err);
      setError(err instanceof Error ? err.message : "Failed to add committee");

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add committee",
      });
    }
  };

  const handleUpdateCommittee = async () => {
    if (!editingCommittee || !editingCommittee.name.trim()) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("committees")
        .update({ 
          name: editingCommittee.name.trim(),
          company_id: editingCommittee.company_id
        })
        .eq("id", editingCommittee.id);

      if (error) throw error;

      setCommittees(prev =>
        prev.map(committee =>
          committee.id === editingCommittee.id ? editingCommittee : committee
        )
      );
      setEditingCommittee(null);

      toast({
        title: "Success",
        description: "Committee updated successfully",
      });
    } catch (err) {
      console.error("Error updating committee:", err);
      setError(err instanceof Error ? err.message : "Failed to update committee");

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update committee",
      });
    }
  };

  const handleDeleteCommittee = async () => {
    if (!deletingCommitteeId) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("committees")
        .delete()
        .eq("id", deletingCommitteeId);

      if (error) throw error;

      setCommittees(prev => prev.filter(committee => committee.id !== deletingCommitteeId));
      setDeletingCommitteeId(null);

      toast({
        title: "Success",
        description: "Committee deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting committee:", err);
      setError(err instanceof Error ? err.message : "Failed to delete committee");

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete committee",
      });
    }
  };

  const handleAddMember = async (committeeId: string) => {
    if (!newMemberName.trim()) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("committees_members")
        .insert([{ 
          committee_id: committeeId,
          name: newMemberName.trim()
        }])
        .select()
        .single();

      if (error) throw error;

      setCommitteeMembers(prev => ({
        ...prev,
        [committeeId]: [...(prev[committeeId] || []), data]
      }));
      setNewMemberName("");
      setIsAddingMember(false);

      toast({
        title: "Success",
        description: "Member added successfully",
      });
    } catch (err) {
      console.error("Error adding member:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add member",
      });
    }
  };

  const handleDeleteMember = async () => {
    if (!deletingMemberId) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("committees_members")
        .delete()
        .eq("id", deletingMemberId);

      if (error) throw error;

      // Update the local state
      setCommitteeMembers(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(committeeId => {
          updated[committeeId] = updated[committeeId].filter(member => member.id !== deletingMemberId);
        });
        return updated;
      });
      setDeletingMemberId(null);

      toast({
        title: "Success",
        description: "Member removed successfully",
      });
    } catch (err) {
      console.error("Error deleting member:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove member",
      });
    }
  };

  const handleUpdateMember = async () => {
    if (!editingMember || !editingMemberName.trim()) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("committees_members")
        .update({ name: editingMemberName.trim() })
        .eq("id", editingMember.id);

      if (error) throw error;

      // Update the local state
      setCommitteeMembers(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(committeeId => {
          updated[committeeId] = updated[committeeId].map(member =>
            member.id === editingMember.id 
              ? { ...member, name: editingMemberName.trim() }
              : member
          );
        });
        return updated;
      });

      setEditingMember(null);
      setEditingMemberName("");

      toast({
        title: "Success",
        description: "Member name updated successfully",
      });
    } catch (err) {
      console.error("Error updating member:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update member name",
      });
    }
  };

  // Filtering, searching, and sorting logic
  const filteredAndSortedCommittees = useMemo(() => {
    let filtered = committees.filter((committee) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const companyName = companies.find(c => c.id === committee.company_id)?.name?.toLowerCase() || "";
      const matchesSearch =
        committee.name.toLowerCase().includes(searchLower) ||
        companyName.includes(searchLower);
      if (!matchesSearch) return false;
      // Company filter
      if (selectedCompany !== "all" && committee.company_id !== selectedCompany) {
        return false;
      }
      return true;
    });
    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "company":
          aValue = companies.find(c => c.id === a.company_id)?.name?.toLowerCase() || "";
          bValue = companies.find(c => c.id === b.company_id)?.name?.toLowerCase() || "";
          break;
        case "created_at":
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case "updated_at":
          aValue = new Date(a.updated_at);
          bValue = new Date(b.updated_at);
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    return filtered;
  }, [committees, companies, searchTerm, selectedCompany, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedCommittees.length / itemsPerPage);
  const paginatedCommittees = filteredAndSortedCommittees.slice(
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
    setSelectedCompany("all");
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
        <div className="text-center">Loading committees...</div>
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
    <RtlProvider isRTL={isRTL}>
      <div className="container mx-auto p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className={`flex justify-between items-center mb-6${isRTL ? ' text-right' : ''}`}>
          <h1 className={`text-3xl font-bold ${isRTL ? 'text-right' : ''}`}>{t("title")}</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {t("totalCommittees", { count: committees.length })}
            </div>
            {!isAdding && (
              <Button onClick={() => setIsAdding(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                {t("addCommittee")}
              </Button>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t("filtersAndSearch")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4${isRTL ? ' text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">{t("search")}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder={t("searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
              {/* Company Filter */}
              <div className="space-y-2">
                <AppDropdown
                  label={t("company")}
                  value={selectedCompany}
                  onChange={(value) => {
                    setSelectedCompany(value);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: "all", label: t("allCompanies") },
                    ...companies.map((company) => ({ value: company.id, label: company.name }))
                  ]}
                  placeholder={t("allCompanies")}
                />
              </div>
            </div>
            {/* Clear Filters */}
            <div className={`flex justify-between items-center mt-4 pt-4 border-t${isRTL ? ' flex-row-reverse' : ''}` }>
              <div className="text-sm text-muted-foreground">
                {t("showingCommittees", { shown: filteredAndSortedCommittees.length, total: committees.length })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                disabled={!searchTerm && selectedCompany === "all"}
              >
                {t("clearFilters")}
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
                    <Label htmlFor="new-committee">{t("committeeName")}</Label>
                    <div className={`flex gap-2${isRTL ? ' flex-row-reverse' : ''}` }>
                      <Input
                        id="new-committee"
                        value={newCommitteeName}
                        onChange={(e) => setNewCommitteeName(e.target.value)}
                        placeholder={t("enterCommitteeName")}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsAdding(false)}
                        className="h-10 w-10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleAddCommittee}
                        className="h-10 w-10"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <AppDropdown
                      label={t("company")}
                      value={newCompanyId}
                      onChange={setNewCompanyId}
                      options={companies.map(company => ({ value: company.id, label: company.name }))}
                      placeholder={t("selectCompany")}
                    />
                  </div>
                </div>
              </div>
            )}

            {filteredAndSortedCommittees.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {committees.length === 0 ? (
                  <>
                    <p className="text-lg font-medium mb-2">{t("noCommitteesFound")}</p>
                    <p>{t("getStartedCreateCommittee")}</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-2">{t("noCommitteesMatch")}</p>
                    <p>{t("tryAdjustingSearch")}</p>
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-md border" dir={isRTL ? 'rtl' : 'ltr'}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={isRTL ? 'text-right' : ''}>
                        <SortableHeader field="name">{t("tableHeaders.name")}</SortableHeader>
                      </TableHead>
                      <TableHead className={isRTL ? 'text-right' : ''}>
                        <SortableHeader field="company">{t("tableHeaders.company")}</SortableHeader>
                      </TableHead>
                      <TableHead className={isRTL ? 'text-right' : ''}>{t("tableHeaders.members")}</TableHead>
                      <TableHead className={isRTL ? 'text-right' : ''}>
                        <SortableHeader field="created_at">{t("tableHeaders.createdAt")}</SortableHeader>
                      </TableHead>
                      <TableHead className={isRTL ? 'text-right' : ''}>
                        <SortableHeader field="updated_at">{t("tableHeaders.lastUpdated")}</SortableHeader>
                      </TableHead>
                      <TableHead className={`w-[100px]${isRTL ? ' text-right' : ''}`}>{t("tableHeaders.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCommittees.map((committee) => (
                      <TableRow key={committee.id}>
                        <TableCell className={isRTL ? 'text-right' : ''}>
                          {editingCommittee?.id === committee.id ? (
                            <Input
                              value={editingCommittee.name}
                              onChange={(e) =>
                                setEditingCommittee({
                                  ...editingCommittee,
                                  name: e.target.value,
                                })
                              }
                              placeholder={t("enterCommitteeName")}
                            />
                          ) : (
                            committee.name
                          )}
                        </TableCell>
                        <TableCell className={isRTL ? 'text-right' : ''}>
                          {companies.find((c) => c.id === committee.company_id)?.name || "-"}
                        </TableCell>
                        <TableCell className={isRTL ? 'text-right' : ''}>
                          {(committeeMembers[committee.id]?.length || 0)}
                        </TableCell>
                        <TableCell className={isRTL ? 'text-right' : ''}>
                          {formatDate(committee.created_at)}
                        </TableCell>
                        <TableCell className={isRTL ? 'text-right' : ''}>
                          {formatDate(committee.updated_at)}
                        </TableCell>
                        <TableCell className={`w-[100px]${isRTL ? ' text-right' : ''}`}>
                          <div className="flex gap-2">
                            {editingCommittee?.id === committee.id ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingCommittee(null)}
                                  className="h-8 w-8"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={handleUpdateCommittee}
                                  className="h-8 w-8"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingCommittee(committee)}
                                  className="h-8 w-8"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeletingCommitteeId(committee.id)}
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && filteredAndSortedCommittees.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredAndSortedCommittees.length)} of{" "}
                  {filteredAndSortedCommittees.length} results
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

        <AlertDialog open={!!deletingCommitteeId} onOpenChange={() => setDeletingCommitteeId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the committee.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCommittee}
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
              <AlertDialogTitle>Remove Member</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this member from the committee? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteMember}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </RtlProvider>
  );
} 