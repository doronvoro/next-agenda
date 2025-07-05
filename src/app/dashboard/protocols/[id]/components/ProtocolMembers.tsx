import React, { useState } from "react";
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
import { createMember, updateMember } from "../supabaseApi";
import { useToast } from "@/components/ui/use-toast";

interface ProtocolMembersProps {
  protocolMembers: ProtocolMember[];
  setProtocolMembers: React.Dispatch<React.SetStateAction<ProtocolMember[]>>;
  setDeletingMemberId: (id: string) => void;
  protocolId: string;
}

const ProtocolMembers: React.FC<ProtocolMembersProps> = ({
  protocolMembers,
  setProtocolMembers,
  setDeletingMemberId,
  protocolId,
}) => {
  const [editingMember, setEditingMember] = useState<EditingMember | null>(null);
  const [newMember, setNewMember] = useState<NewMember>({
    name: "",
    type: 1,
    status: 1,
    vote_status: null,
    isEditing: false,
  });
  const { toast } = useToast();

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name.trim()) return;
    try {
      const { data, error } = await createMember(protocolId, newMember);
      if (error) throw error;
      setProtocolMembers(prev => [...prev, data]);
      setNewMember({ name: "", type: 1, status: 1, vote_status: null, isEditing: false });
      toast({ title: "הצלחה", description: "חבר נוסף בהצלחה" });
    } catch (err) {
      setNewMember({ name: "", type: 1, status: 1, vote_status: null, isEditing: false });
      toast({ variant: "destructive", title: "שגיאה", description: "נכשל הוספת חבר" });
    }
  };

  const handleUpdateMember = async () => {
    if (!editingMember) return;
    try {
      const { error } = await updateMember(editingMember);
      if (error) throw error;
      setProtocolMembers(prev => prev.map(m => m.id === editingMember.id ? { ...m, ...editingMember } : m));
      setEditingMember(null);
      toast({ title: "הצלחה", description: "חבר עודכן בהצלחה" });
    } catch (err) {
      setEditingMember(null);
      toast({ variant: "destructive", title: "שגיאה", description: "נכשל עדכון חבר" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">חברי הפרוטוקול</h3>
        <Button
          onClick={() => setNewMember(prev => ({ ...prev, isEditing: true }))}
          className="gap-2"
          disabled={newMember.isEditing}
        >
          <Plus className="h-4 w-4" />
          הוסף חבר
        </Button>
      </div>

      {newMember.isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">הוסף חבר חדש</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateMember} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="member-name">שם *</Label>
                                  <Input
                    id="member-name"
                    value={newMember.name}
                    onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="הזן שם חבר"
                    required
                  />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="member-type">סוג</Label>
                  <Select
                    value={newMember.type.toString()}
                    onValueChange={(value) => setNewMember(prev => ({ ...prev, type: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">חבר ועדה</SelectItem>
                      <SelectItem value="2">חיצוני</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="member-status">סטטוס</Label>
                  <Select
                    value={newMember.status.toString()}
                    onValueChange={(value) => setNewMember(prev => ({ ...prev, status: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">נעדר</SelectItem>
                      <SelectItem value="2">נוכח</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="member-vote-status">סטטוס הצבעה</Label>
                <div className="flex gap-2">
                                      <Select
                      value={newMember.vote_status?.toString() || ""}
                      onValueChange={(value) => setNewMember(prev => ({ 
                        ...prev, 
                        vote_status: parseInt(value) 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="אין הצבעה" />
                      </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">בעד</SelectItem>
                      <SelectItem value="2">נגד</SelectItem>
                      <SelectItem value="3">נמנע</SelectItem>
                    </SelectContent>
                  </Select>
                  {newMember.vote_status && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setNewMember(prev => ({ ...prev, vote_status: null }))}
                      className="text-destructive hover:text-destructive"
                    >
                      נקה
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setNewMember(prev => ({ ...prev, isEditing: false }))}
                >
                  ביטול
                </Button>
                <Button type="submit" disabled={!newMember.name.trim()}>
                  הוסף חבר
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {protocolMembers.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          לא נמצאו חברים לפרוטוקול זה
        </div>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם</TableHead>
                <TableHead>סוג</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>סטטוס הצבעה</TableHead>
                <TableHead className="w-[100px]">פעולות</TableHead>
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
                          placeholder="הזן שם חבר"
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
                            <SelectItem value="1">חבר ועדה</SelectItem>
                            <SelectItem value="2">חיצוני</SelectItem>
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
                            <SelectItem value="1">נעדר</SelectItem>
                            <SelectItem value="2">נוכח</SelectItem>
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
                              <SelectValue placeholder="אין הצבעה" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">בעד</SelectItem>
                              <SelectItem value="2">נגד</SelectItem>
                              <SelectItem value="3">נמנע</SelectItem>
                            </SelectContent>
                          </Select>
                          {editingMember.vote_status && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingMember(prev => prev ? { ...prev, vote_status: null } : null)}
                              className="text-destructive hover:text-destructive"
                            >
                              נקה
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
                            onClick={() => setEditingMember(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>{member.name || "ללא שם"}</TableCell>
                      <TableCell>
                        {member.type === 1 ? "חבר ועדה" : "חיצוני"}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          member.status === 2 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        )}>
                          {member.status === 2 ? "נוכח" : "נעדר"}
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
                          {member.vote_status === 1 ? "בעד" : member.vote_status === 2 ? "נגד" : member.vote_status === 3 ? "נמנע" : "אין הצבעה"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingMember({
                              id: member.id,
                              name: member.name || "",
                              type: member.type,
                              status: member.status,
                              vote_status: member.vote_status,
                            })}
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