"use client";

import { useEffect, useState } from "react";
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
  Check
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

type Company = Database["public"]["Tables"]["companies"]["Row"];

type SortField = "name" | "address" | "number" | "created_at";
type SortOrder = "asc" | "desc";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [isAdding, setIsAdding] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyAddress, setNewCompanyAddress] = useState("");
  const [newCompanyNumber, setNewCompanyNumber] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editCompanyAddress, setEditCompanyAddress] = useState("");
  const [editCompanyNumber, setEditCompanyNumber] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const itemsPerPage = 10;

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/companies");
      
      if (!response.ok) {
        throw new Error("Failed to fetch companies");
      }
      
      const data = await response.json();
      setCompanies(data || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
      setError("שגיאה בטעינת החברות");
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

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) {
      toast({
        title: "שגיאה",
        description: "שם החברה לא יכול להיות ריק",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCompanyName.trim(),
          address: newCompanyAddress.trim() || null,
          number: newCompanyNumber.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create company");
      }

      toast({
        title: "הצלחה",
        description: "החברה נוספה בהצלחה",
      });

      // Clear form and hide it
      setNewCompanyName("");
      setNewCompanyAddress("");
      setNewCompanyNumber("");
      setIsAdding(false);
      fetchCompanies();
    } catch (error) {
      console.error("Error adding company:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה בהוספת החברה",
        variant: "destructive",
      });
      // Hide form even on error to prevent user confusion
      setIsAdding(false);
    }
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setEditCompanyName(company.name);
    setEditCompanyAddress(company.address || "");
    setEditCompanyNumber(company.number || "");
    setIsEditing(true);
  };

  const handleUpdateCompany = async () => {
    if (!editingCompany || !editCompanyName.trim()) {
      toast({
        title: "שגיאה",
        description: "שם החברה לא יכול להיות ריק",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/companies/${editingCompany.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editCompanyName.trim(),
          address: editCompanyAddress.trim() || null,
          number: editCompanyNumber.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update company");
      }

      toast({
        title: "הצלחה",
        description: "החברה עודכנה בהצלחה",
      });

      // Clear form and hide it
      setEditCompanyName("");
      setEditCompanyAddress("");
      setEditCompanyNumber("");
      setEditingCompany(null);
      setIsEditing(false);
      fetchCompanies();
    } catch (error) {
      console.error("Error updating company:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה בעדכון החברה",
        variant: "destructive",
      });
      // Hide form even on error to prevent user confusion
      setIsEditing(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;

    try {
      const response = await fetch(`/api/companies/${companyToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete company");
      }

      toast({
        title: "הצלחה",
        description: "החברה נמחקה בהצלחה",
      });

      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
      fetchCompanies();
    } catch (error) {
      console.error("Error deleting company:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה במחיקת החברה",
        variant: "destructive",
      });
    }
  };

  const filteredAndSortedCompanies = companies
    .filter((company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: string | Date;
      let bValue: string | Date;

      if (sortField === "name") {
        aValue = a.name;
        bValue = b.name;
      } else if (sortField === "address") {
        aValue = a.address || "";
        bValue = b.address || "";
      } else if (sortField === "number") {
        aValue = a.number || "";
        bValue = b.number || "";
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

  const totalPages = Math.ceil(filteredAndSortedCompanies.length / itemsPerPage);
  const paginatedCompanies = filteredAndSortedCompanies.slice(
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
        <div className="text-center">טוען חברות...</div>
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
        <h1 className="text-3xl font-bold">חברות</h1>
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
                  placeholder="חפש חברות..."
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
              מציג {filteredAndSortedCompanies.length} מתוך {companies.length} חברות
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
                  <Label htmlFor="new-company">שם החברה</Label>
                  <Input
                    id="new-company"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="הכנס שם חברה"
                    className="flex-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-company-address">כתובת</Label>
                  <Input
                    id="new-company-address"
                    value={newCompanyAddress}
                    onChange={(e) => setNewCompanyAddress(e.target.value)}
                    placeholder="הכנס כתובת החברה"
                    className="flex-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-company-number">מספר</Label>
                  <Input
                    id="new-company-number"
                    value={newCompanyNumber}
                    onChange={(e) => setNewCompanyNumber(e.target.value)}
                    placeholder="הכנס מספר החברה"
                    className="flex-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsAdding(false);
                      setNewCompanyName("");
                      setNewCompanyAddress("");
                      setNewCompanyNumber("");
                    }}
                    className="h-10 w-10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleAddCompany}
                    className="h-10 w-10"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {isEditing && editingCompany && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold">עריכת חברה: {editingCompany.name}</h3>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-company">שם החברה</Label>
                  <Input
                    id="edit-company"
                    value={editCompanyName}
                    onChange={(e) => setEditCompanyName(e.target.value)}
                    placeholder="הכנס שם חברה"
                    className="flex-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-company-address">כתובת</Label>
                  <Input
                    id="edit-company-address"
                    value={editCompanyAddress}
                    onChange={(e) => setEditCompanyAddress(e.target.value)}
                    placeholder="הכנס כתובת החברה"
                    className="flex-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-company-number">מספר</Label>
                  <Input
                    id="edit-company-number"
                    value={editCompanyNumber}
                    onChange={(e) => setEditCompanyNumber(e.target.value)}
                    placeholder="הכנס מספר החברה"
                    className="flex-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsEditing(false);
                      setEditingCompany(null);
                      setEditCompanyName("");
                      setEditCompanyAddress("");
                      setEditCompanyNumber("");
                    }}
                    className="h-10 w-10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleUpdateCompany}
                    className="h-10 w-10"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">רשימת חברות</h2>
            {!isAdding && !isEditing && (
              <Button onClick={() => setIsAdding(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                הוסף חברה
              </Button>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortableHeader field="name">שם החברה</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader field="address">כתובת</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader field="number">מספר</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader field="created_at">תאריך יצירה</SortableHeader>
                </TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    {searchTerm ? "לא נמצאו חברות" : "אין חברות"}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.address || "-"}</TableCell>
                    <TableCell>{company.number || "-"}</TableCell>
                    <TableCell>
                      {new Date(company.created_at).toLocaleDateString("he-IL")}
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
                          <DropdownMenuItem onClick={() => handleEditCompany(company)}>
                            <Edit className="mr-2 h-4 w-4" />
                            עריכה
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setCompanyToDelete(company);
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
              פעולה זו תמחק את החברה "{companyToDelete?.name}" לצמיתות.
              לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCompany} className="bg-red-600">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 