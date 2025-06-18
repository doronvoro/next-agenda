"use client";

import { useEffect, useState } from "react";
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
import { Plus, Pencil, Trash2, X, Check, Users, UserPlus } from "lucide-react";
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

type Committee = Database["public"]["Tables"]["committees"]["Row"];
type CommitteeMember = Database["public"]["Tables"]["committees_members"]["Row"];
type Company = {
  id: string;
  name: string;
};

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
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Committees</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Total: {committees.length} committees
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Committee
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
                  <Label htmlFor="new-committee">Committee Name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="new-committee"
                      value={newCommitteeName}
                      onChange={(e) => setNewCommitteeName(e.target.value)}
                      placeholder="Enter committee name"
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
                  <Label htmlFor="new-company">Company</Label>
                  <Select
                    value={newCompanyId}
                    onValueChange={setNewCompanyId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {committees.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No committees found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {committees.map((committee) => (
                    <TableRow key={committee.id}>
                      <TableCell>
                        {editingCommittee?.id === committee.id ? (
                          <Input
                            value={editingCommittee.name}
                            onChange={(e) =>
                              setEditingCommittee({
                                ...editingCommittee,
                                name: e.target.value,
                              })
                            }
                            className="flex-1"
                          />
                        ) : (
                          committee.name
                        )}
                      </TableCell>
                      <TableCell>
                        {editingCommittee?.id === committee.id ? (
                          <Select
                            value={editingCommittee.company_id || ""}
                            onValueChange={(value) =>
                              setEditingCommittee({
                                ...editingCommittee,
                                company_id: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a company" />
                            </SelectTrigger>
                            <SelectContent>
                              {companies.map((company) => (
                                <SelectItem key={company.id} value={company.id}>
                                  {company.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          companies.find(c => c.id === committee.company_id)?.name || "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {committeeMembers[committee.id]?.length || 0} members
                          </Badge>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedCommittee(committee)}
                                className="h-6 px-2"
                              >
                                <Users className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Manage Members - {committee.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Members</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsAddingMember(true)}
                                    className="h-8"
                                  >
                                    <UserPlus className="h-3 w-3 mr-1" />
                                    Add Member
                                  </Button>
                                </div>
                                
                                {isAddingMember && (
                                  <div className="p-3 border rounded-lg">
                                    <div className="space-y-2">
                                      <Label htmlFor="new-member">Member Name</Label>
                                      <div className="flex gap-2">
                                        <Input
                                          id="new-member"
                                          value={newMemberName}
                                          onChange={(e) => setNewMemberName(e.target.value)}
                                          placeholder="Enter member name"
                                          className="flex-1"
                                        />
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => setIsAddingMember(false)}
                                          className="h-8 w-8"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleAddMember(committee.id)}
                                          className="h-8 w-8"
                                        >
                                          <Check className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div className="space-y-2">
                                  {committeeMembers[committee.id]?.length === 0 ? (
                                    <div className="text-center text-muted-foreground py-4">
                                      No members yet
                                    </div>
                                  ) : (
                                    committeeMembers[committee.id]?.map((member) => (
                                      <div
                                        key={member.id}
                                        className="flex items-center justify-between p-2 border rounded"
                                      >
                                        {editingMember?.id === member.id ? (
                                          <div className="flex items-center gap-2 flex-1">
                                            <Input
                                              value={editingMemberName}
                                              onChange={(e) => setEditingMemberName(e.target.value)}
                                              className="flex-1 h-8"
                                              placeholder="Enter member name"
                                            />
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                setEditingMember(null);
                                                setEditingMemberName("");
                                              }}
                                              className="h-6 w-6 p-0"
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={handleUpdateMember}
                                              className="h-6 w-6 p-0"
                                            >
                                              <Check className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <>
                                            <span className="text-sm">{member.name}</span>
                                            <div className="flex gap-1">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                  setEditingMember(member);
                                                  setEditingMemberName(member.name);
                                                }}
                                                className="h-6 w-6 p-0"
                                              >
                                                <Pencil className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDeletingMemberId(member.id)}
                                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(committee.created_at)}</TableCell>
                      <TableCell>{formatDate(committee.updated_at)}</TableCell>
                      <TableCell>
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
  );
} 