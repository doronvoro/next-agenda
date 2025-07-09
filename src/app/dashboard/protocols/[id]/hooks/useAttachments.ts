import { useState } from "react";

export function useAttachments({
  protocolId,
  userId,
  uploadAttachment,
  apiDeleteAttachment,
  toast,
  setError,
  protocolAttachments,
  setProtocolAttachments,
}: {
  protocolId: string;
  userId: string | null;
  uploadAttachment: (protocolId: string, file: File, userId: string) => Promise<any>;
  apiDeleteAttachment: (id: string, filePath: string) => Promise<{ error?: any }>;
  toast: any;
  setError: (err: string | null) => void;
  protocolAttachments: any[];
  setProtocolAttachments: (fn: (prev: any[]) => any[]) => void;
}) {
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);

  const handleUploadAttachment = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    if (!userId) {
      setError("אין מזהה משתמש");
      toast({ variant: "destructive", title: "שגיאה", description: "אין מזהה משתמש" });
      return;
    }
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const attachmentData = await uploadAttachment(protocolId, file, userId);
        setProtocolAttachments(prev => [...prev, attachmentData]);
      }
      toast({ title: "הצלחה", description: `הועלו בהצלחה ${files.length} קובץ(ים)` });
    } catch (err) {
      setError(err instanceof Error ? err.message : "התרחשה שגיאה");
      toast({ variant: "destructive", title: "שגיאה", description: "נכשל העלאת הקבצים המצורפים" });
    }
  };

  const handleDeleteAttachment = async () => {
    if (!deletingAttachmentId) return;
    setError(null);
    const attachment = protocolAttachments.find(a => a.id === deletingAttachmentId);
    if (!attachment) {
      setError("הקובץ המצורף לא נמצא");
      toast({ variant: "destructive", title: "שגיאה", description: "הקובץ המצורף לא נמצא" });
      return;
    }
    try {
      const { error } = await apiDeleteAttachment(deletingAttachmentId, attachment.file_path);
      if (error) throw error;
      setProtocolAttachments(prev => prev.filter(a => a.id !== deletingAttachmentId));
      setDeletingAttachmentId(null);
      toast({ title: "הצלחה", description: "הקובץ המצורף נמחק בהצלחה" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "התרחשה שגיאה");
      toast({ variant: "destructive", title: "שגיאה", description: "נכשל מחיקת הקובץ המצורף" });
    }
  };

  return {
    deletingAttachmentId,
    setDeletingAttachmentId,
    handleUploadAttachment,
    handleDeleteAttachment,
  };
} 