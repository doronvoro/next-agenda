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

type SortField = "name" | "created_at";
type SortOrder = "asc" | "desc";

export default function CommitteesPage() {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [isAdding, setIsAdding] = useState(false);
  const [newCommitteeName, setNewCommitteeName] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [committeeToDelete, setCommitteeToDelete] = useState<Committee | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const itemsPerPage = 10;

  useEffect(() => {
    fetchCommittees();
  }, []);

  const fetchCommittees = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("committees")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setCommittees(data || []);
    } catch (error) {
      console.error("Error fetching committees:", error);
      setError("שגיאה בטעינת הוועדות");
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

  const handleAddCommittee = async () => {
    if (!newCommitteeName.trim()) {
      toast({
        title: "שגיאה",
        description: "שם הוועדה לא יכול להיות ריק",
        variant: "destructive",
      });
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("committees")
        .insert([{ name: newCommitteeName.trim() }]);

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: "הוועדה נוספה בהצלחה",
      });

      setNewCommitteeName("");
      setIsAdding(false);
      fetchCommittees();
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
      const supabase = createClient();
      const { error } = await supabase
        .from("committees")
        .delete()
        .eq("id", committeeToDelete.id);

      if (error) throw error;

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
                  <div className="flex gap-2">
                    <Input
                      id="new-committee"
                      value={newCommitteeName}
                      onChange={(e) => setNewCommitteeName(e.target.value)}
                      placeholder="הכנס שם ועדה"
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
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">רשימת ועדות</h2>
            <Button onClick={() => setIsAdding(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              הוסף ועדה
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortableHeader field="name">שם הוועדה</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader field="created_at">תאריך יצירה</SortableHeader>
                </TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCommittees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    {searchTerm ? "לא נמצאו ועדות" : "אין ועדות"}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCommittees.map((committee) => (
                  <TableRow key={committee.id}>
                    <TableCell className="font-medium">{committee.name}</TableCell>
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
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            צפייה
                          </DropdownMenuItem>
                          <DropdownMenuItem>
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
    </div>
  );
} 