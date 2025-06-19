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
      setError("No user ID");
      toast({ variant: "destructive", title: "Error", description: "No user ID" });
      return;
    }
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const attachmentData = await uploadAttachment(protocolId, file, userId);
        setProtocolAttachments(prev => [...prev, attachmentData]);
      }
      toast({ title: "Success", description: `Successfully uploaded ${files.length} file(s)` });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast({ variant: "destructive", title: "Error", description: "Failed to upload attachments" });
    }
  };

  const handleDeleteAttachment = async () => {
    if (!deletingAttachmentId) return;
    setError(null);
    const attachment = protocolAttachments.find(a => a.id === deletingAttachmentId);
    if (!attachment) {
      setError("Attachment not found");
      toast({ variant: "destructive", title: "Error", description: "Attachment not found" });
      return;
    }
    try {
      const { error } = await apiDeleteAttachment(deletingAttachmentId, attachment.file_path);
      if (error) throw error;
      setProtocolAttachments(prev => prev.filter(a => a.id !== deletingAttachmentId));
      setDeletingAttachmentId(null);
      toast({ title: "Success", description: "Attachment deleted successfully" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast({ variant: "destructive", title: "Error", description: "Failed to delete attachment" });
    }
  };

  return {
    deletingAttachmentId,
    setDeletingAttachmentId,
    handleUploadAttachment,
    handleDeleteAttachment,
  };
} 