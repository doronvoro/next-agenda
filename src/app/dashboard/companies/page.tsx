"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";
import { format, isValid } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp, ArrowUpDown, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";

type Company = Database["public"]["Tables"]["companies"]["Row"];

type SortField = "name" | "address" | "number" | "created_at";
type SortOrder = "asc" | "desc";

const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return isValid(date) ? format(date, "dd/MM/yyyy") : "Invalid date";
};

export default function CompaniesPage() {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [defaultAddress, setDefaultAddress] = useState<string | null>(null);
  const [newCompany, setNewCompany] = useState({
    name: "",
    address: defaultAddress || "",
    number: "",
  });
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deletingCompanyId, setDeletingCompanyId] = useState<string | null>(null);

  // Filtering, sorting, and pagination states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchCompanies();
    fetchOrganization();
  }, []);

  useEffect(() => {
    if (defaultAddress) {
      setNewCompany(prev => ({
        ...prev,
        address: defaultAddress
      }));
    }
  }, [defaultAddress]);

  const fetchCompanies = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("name");

      if (error) throw error;
      setCompanies(data || []);
    } catch (err) {
      console.error("Error fetching companies:", err);
      setError(err instanceof Error ? err.message : "Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganization = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("organizations")
        .select("id, default_address")
        .limit(1)
        .single();

      if (error) throw error;
      setOrganizationId(data?.id || null);
      setDefaultAddress(data?.default_address || null);
    } catch (err) {
      console.error("Error fetching organization:", err);
      setError(err instanceof Error ? err.message : "Failed to load organization");
    }
  };

  const handleAddCompany = async () => {
    if (!newCompany.name.trim() || !organizationId) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("companies")
        .insert([{
          name: newCompany.name.trim(),
          address: newCompany.address.trim() || null,
          number: newCompany.number.trim() || null,
          organization_id: organizationId,
        }])
        .select()
        .single();

      if (error) throw error;

      setCompanies(prev => [...prev, data]);
      setNewCompany({
        name: "",
        address: defaultAddress || "",
        number: "",
      });
      setIsAdding(false);

      toast({
        title: "Success",
        description: "Company added successfully",
      });
    } catch (err) {
      console.error("Error adding company:", err);
      setError(err instanceof Error ? err.message : "Failed to add company");

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add company",
      });
    }
  };

  const handleUpdateCompany = async () => {
    if (!editingCompany || !editingCompany.name.trim()) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("companies")
        .update({
          name: editingCompany.name.trim(),
          address: editingCompany.address?.trim() || null,
          number: editingCompany.number?.trim() || null,
        })
        .eq("id", editingCompany.id);

      if (error) throw error;

      setCompanies(prev =>
        prev.map(company =>
          company.id === editingCompany.id ? editingCompany : company
        )
      );
      setEditingCompany(null);

      toast({
        title: "Success",
        description: "Company updated successfully",
      });
    } catch (err) {
      console.error("Error updating company:", err);
      setError(err instanceof Error ? err.message : "Failed to update company");

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update company",
      });
    }
  };

  const handleDeleteCompany = async () => {
    if (!deletingCompanyId) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("companies")
        .delete()
        .eq("id", deletingCompanyId);

      if (error) throw error;

      setCompanies(prev => prev.filter(company => company.id !== deletingCompanyId));
      setDeletingCompanyId(null);

      toast({
        title: "Success",
        description: "Company deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting company:", err);
      setError(err instanceof Error ? err.message : "Failed to delete company");

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete company",
      });
    }
  };

  // Filtering, searching, and sorting logic
  const filteredAndSortedCompanies = useMemo(() => {
    let filtered = companies.filter((company) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        company.name.toLowerCase().includes(searchLower) ||
        (company.address || "").toLowerCase().includes(searchLower) ||
        (company.number || "").toLowerCase().includes(searchLower);
      return matchesSearch;
    });
    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "address":
          aValue = (a.address || "").toLowerCase();
          bValue = (b.address || "").toLowerCase();
          break;
        case "number":
          aValue = (a.number || "").toLowerCase();
          bValue = (b.number || "").toLowerCase();
          break;
        case "created_at":
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
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
  }, [companies, searchTerm, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedCompanies.length / itemsPerPage);
  const paginatedCompanies = filteredAndSortedCompanies.slice(
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
        <div className="text-center">Loading companies...</div>
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Companies</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Total: {companies.length} companies
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Company
            </Button>
          )}
        </div>
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
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          {/* Clear Filters */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {filteredAndSortedCompanies.length} of {companies.length} companies
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              disabled={!searchTerm}
            >
              Clear Filters
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
                  <Label htmlFor="new-name">Company Name *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="new-name"
                      value={newCompany.name}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, name: e.target.value })
                      }
                      placeholder="Enter company name"
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
                      onClick={handleAddCompany}
                      className="h-10 w-10"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-address">Address</Label>
                  <Input
                    id="new-address"
                    value={newCompany.address}
                    onChange={(e) =>
                      setNewCompany({ ...newCompany, address: e.target.value })
                    }
                    placeholder="Enter company address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-number">Number</Label>
                  <Input
                    id="new-number"
                    value={newCompany.number}
                    onChange={(e) =>
                      setNewCompany({ ...newCompany, number: e.target.value })
                    }
                    placeholder="Enter company number"
                  />
                </div>
              </div>
            </div>
          )}

          {filteredAndSortedCompanies.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {companies.length === 0 ? (
                <>
                  <p className="text-lg font-medium mb-2">No companies found</p>
                  <p>Get started by creating your first company.</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium mb-2">No companies match your filters</p>
                  <p>Try adjusting your search criteria or clear the filters.</p>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortableHeader field="name">Name</SortableHeader>
                    </TableHead>
                    <TableHead>
                      <SortableHeader field="address">Address</SortableHeader>
                    </TableHead>
                    <TableHead>
                      <SortableHeader field="number">Number</SortableHeader>
                    </TableHead>
                    <TableHead>
                      <SortableHeader field="created_at">Created At</SortableHeader>
                    </TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCompanies.map((company: Company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        {editingCompany && editingCompany.id === company.id ? (
                          <div className="flex gap-2">
                            <Input
                              value={editingCompany.name}
                              onChange={(e) =>
                                setEditingCompany({
                                  ...editingCompany,
                                  name: e.target.value,
                                } as Company)
                              }
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingCompany(null)}
                              className="h-8 w-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleUpdateCompany}
                              className="h-8 w-8"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          company.name
                        )}
                      </TableCell>
                      <TableCell>
                        {editingCompany && editingCompany.id === company.id ? (
                          <Input
                            value={editingCompany.address || ""}
                            onChange={(e) =>
                              setEditingCompany({
                                ...editingCompany,
                                address: e.target.value,
                              } as Company)
                            }
                            placeholder="Enter address"
                          />
                        ) : (
                          company.address || "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {editingCompany && editingCompany.id === company.id ? (
                          <Input
                            value={editingCompany.number || ""}
                            onChange={(e) =>
                              setEditingCompany({
                                ...editingCompany,
                                number: e.target.value,
                              } as Company)
                            }
                            placeholder="Enter number"
                          />
                        ) : (
                          company.number || "N/A"
                        )}
                      </TableCell>
                      <TableCell>{formatDate(company.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {editingCompany && editingCompany.id === company.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingCompany(null)}
                                className="h-8 w-8"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleUpdateCompany}
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
                                onClick={() => setEditingCompany(company)}
                                className="h-8 w-8"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingCompanyId(company.id)}
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
          {totalPages > 1 && filteredAndSortedCompanies.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredAndSortedCompanies.length)} of{" "}
                {filteredAndSortedCompanies.length} results
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

      <AlertDialog open={!!deletingCompanyId} onOpenChange={() => setDeletingCompanyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the company.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCompany}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 