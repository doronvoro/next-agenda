import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProtocolMember, EditingMember, NewMember } from "../types";

interface ProtocolMembersProps {
  protocolMembers: ProtocolMember[];
  editingMember: EditingMember | null;
  newMember: NewMember;
  handleAddMember: () => void;
  handleCancelAddMember: () => void;
  handleCreateMember: (e: React.FormEvent) => void;
  setNewMember: React.Dispatch<React.SetStateAction<NewMember>>;
  handleEditMember: (member: ProtocolMember) => void;
  handleCancelEditMember: () => void;
  handleUpdateMember: (e: React.FormEvent) => void;
  setEditingMember: React.Dispatch<React.SetStateAction<EditingMember | null>>;
  setDeletingMemberId: (id: string) => void;
}

const ProtocolMembers: React.FC<ProtocolMembersProps> = ({
  protocolMembers,
  editingMember,
  newMember,
  handleAddMember,
  handleCancelAddMember,
  handleCreateMember,
  setNewMember,
  handleEditMember,
  handleCancelEditMember,
  handleUpdateMember,
  setEditingMember,
  setDeletingMemberId,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Protocol Members</h3>
        <Button
          onClick={handleAddMember}
          className="gap-2"
          disabled={newMember.isEditing}
        >
          <Plus className="h-4 w-4" />
          Add Member
        </Button>
      </div>

      {newMember.isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add New Member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateMember} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="member-name">Name *</Label>
                <Input
                  id="member-name"
                  value={newMember.name}
                  onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter member name"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="member-type">Type</Label>
                  <Select
                    value={newMember.type.toString()}
                    onValueChange={(value) => setNewMember(prev => ({ ...prev, type: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Committee Member</SelectItem>
                      <SelectItem value="2">External</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="member-status">Status</Label>
                  <Select
                    value={newMember.status.toString()}
                    onValueChange={(value) => setNewMember(prev => ({ ...prev, status: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Absent</SelectItem>
                      <SelectItem value="2">Present</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="member-vote-status">Vote Status</Label>
                <div className="flex gap-2">
                  <Select
                    value={newMember.vote_status?.toString() || ""}
                    onValueChange={(value) => setNewMember(prev => ({ 
                      ...prev, 
                      vote_status: parseInt(value) 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No vote" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">For</SelectItem>
                      <SelectItem value="2">Against</SelectItem>
                      <SelectItem value="3">Abstain</SelectItem>
                    </SelectContent>
                  </Select>
                  {newMember.vote_status && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setNewMember(prev => ({ ...prev, vote_status: null }))}
                      className="text-destructive hover:text-destructive"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancelAddMember}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!newMember.name.trim()}>
                  Add Member
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {protocolMembers.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No members found for this protocol
        </div>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vote Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {protocolMembers.map((member) => (
                <TableRow key={member.id}>
                  {editingMember?.id === member.id ? (
                    <>
                      <TableCell>
                        <Input
                          value={editingMember.name}
                          onChange={(e) => setEditingMember(prev => prev ? { ...prev, name: e.target.value } : null)}
                          placeholder="Enter member name"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={editingMember.type.toString()}
                          onValueChange={(value) => setEditingMember(prev => prev ? { ...prev, type: parseInt(value) } : null)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Committee Member</SelectItem>
                            <SelectItem value="2">External</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={editingMember.status.toString()}
                          onValueChange={(value) => setEditingMember(prev => prev ? { ...prev, status: parseInt(value) } : null)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Absent</SelectItem>
                            <SelectItem value="2">Present</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Select
                            value={editingMember.vote_status?.toString() || ""}
                            onValueChange={(value) => setEditingMember(prev => prev ? { ...prev, vote_status: parseInt(value) } : null)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="No vote" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">For</SelectItem>
                              <SelectItem value="2">Against</SelectItem>
                              <SelectItem value="3">Abstain</SelectItem>
                            </SelectContent>
                          </Select>
                          {editingMember.vote_status && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingMember(prev => prev ? { ...prev, vote_status: null } : null)}
                              className="text-destructive hover:text-destructive"
                            >
                              Clear
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleUpdateMember}
                            disabled={!editingMember.name.trim()}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEditMember}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>{member.name || "Unnamed"}</TableCell>
                      <TableCell>
                        {member.type === 1 ? "Committee Member" : "External"}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          member.status === 2 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        )}>
                          {member.status === 2 ? "Present" : "Absent"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          member.vote_status === 1 
                            ? "bg-green-100 text-green-800"
                            : member.vote_status === 2
                            ? "bg-red-100 text-red-800"
                            : member.vote_status === 3
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        )}>
                          {member.vote_status === 1 ? "For" : member.vote_status === 2 ? "Against" : member.vote_status === 3 ? "Abstain" : "No vote"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditMember(member)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingMemberId(member.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ProtocolMembers; 