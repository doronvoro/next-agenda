"use client";

import { useEffect, useState } from "react";
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
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
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

type Company = Database["public"]["Tables"]["companies"]["Row"];

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
  const [newCompany, setNewCompany] = useState({
    name: "",
    address: "",
    number: "",
  });
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deletingCompanyId, setDeletingCompanyId] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

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

  const handleAddCompany = async () => {
    if (!newCompany.name.trim()) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("companies")
        .insert([{
          name: newCompany.name.trim(),
          address: newCompany.address.trim() || null,
          number: newCompany.number.trim() || null,
        }])
        .select()
        .single();

      if (error) throw error;

      setCompanies(prev => [...prev, data]);
      setNewCompany({
        name: "",
        address: "",
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

          {companies.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No companies found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Number</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        {editingCompany?.id === company.id ? (
                          <div className="flex gap-2">
                            <Input
                              value={editingCompany.name}
                              onChange={(e) =>
                                setEditingCompany({
                                  ...editingCompany,
                                  name: e.target.value,
                                })
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
                        {editingCompany?.id === company.id ? (
                          <Input
                            value={editingCompany.address || ""}
                            onChange={(e) =>
                              setEditingCompany({
                                ...editingCompany,
                                address: e.target.value,
                              })
                            }
                            placeholder="Enter address"
                          />
                        ) : (
                          company.address || "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {editingCompany?.id === company.id ? (
                          <Input
                            value={editingCompany.number || ""}
                            onChange={(e) =>
                              setEditingCompany({
                                ...editingCompany,
                                number: e.target.value,
                              })
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
                          {editingCompany?.id === company.id ? (
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