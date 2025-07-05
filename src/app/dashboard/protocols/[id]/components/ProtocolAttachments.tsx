import React from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Paperclip, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ProtocolAttachment } from "../types";

interface ProtocolAttachmentsProps {
  protocolAttachments: ProtocolAttachment[];
  handleUploadAttachment: (files: FileList | null) => void;
  setDeletingAttachmentId: (id: string) => void;
  formatDate: (dateString: string) => string;
}

const getFileTypeDisplay = (mimeType: string): string => {
  const mimeTypeMap: { [key: string]: string } = {
    // Microsoft Office
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'גיליון Excel',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'מסמך Word',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'מצגת PowerPoint',
    'application/vnd.ms-excel': 'גיליון Excel',
    'application/msword': 'מסמך Word',
    'application/vnd.ms-powerpoint': 'מצגת PowerPoint',
    
    // PDF
    'application/pdf': 'מסמך PDF',
    
    // Images
    'image/jpeg': 'תמונה JPEG',
    'image/jpg': 'תמונה JPEG',
    'image/png': 'תמונה PNG',
    'image/gif': 'תמונה GIF',
    'image/webp': 'תמונה WebP',
    'image/svg+xml': 'תמונה SVG',
    
    // Text
    'text/plain': 'קובץ טקסט',
    'text/csv': 'קובץ CSV',
    'text/html': 'קובץ HTML',
    
    // Archives
    'application/zip': 'ארכיון ZIP',
    'application/x-rar-compressed': 'ארכיון RAR',
    'application/x-7z-compressed': 'ארכיון 7-Zip',
    
    // Audio
    'audio/mpeg': 'אודיו MP3',
    'audio/wav': 'אודיו WAV',
    'audio/ogg': 'אודיו OGG',
    
    // Video
    'video/mp4': 'וידאו MP4',
    'video/avi': 'וידאו AVI',
    'video/mov': 'וידאו MOV',
    'video/wmv': 'וידאו WMV',
  };

  return mimeTypeMap[mimeType] || mimeType.split('/')[1]?.toUpperCase() || 'סוג קובץ לא ידוע';
};

const ProtocolAttachments: React.FC<ProtocolAttachmentsProps> = ({
  protocolAttachments,
  handleUploadAttachment,
  setDeletingAttachmentId,
  formatDate,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">קבצים מצורפים לפרוטוקול</h3>
        <Button
          onClick={() => {
            const fileInput = document.getElementById('file-upload');
            if (fileInput) {
              fileInput.click();
            }
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          העלה קובץ מצורף
        </Button>
      </div>

      <input
        id="file-upload"
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleUploadAttachment(e.target.files)}
      />

      {protocolAttachments.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <Paperclip className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p>לא נמצאו קבצים מצורפים לפרוטוקול זה</p>
          <p className="text-sm">העלה קבצים לשיתוף עם חברי הפרוטוקול</p>
        </div>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם הקובץ</TableHead>
                <TableHead>גודל</TableHead>
                <TableHead>סוג</TableHead>
                <TableHead>הועלה ב</TableHead>
                <TableHead className="w-[100px]">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {protocolAttachments.map((attachment) => (
                <TableRow key={attachment.id}>
                  <TableCell className="font-medium">
                    {attachment.file_name}
                  </TableCell>
                  <TableCell>
                    {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
                  </TableCell>
                  <TableCell>
                    {getFileTypeDisplay(attachment.mime_type)}
                  </TableCell>
                  <TableCell>
                    {formatDate(attachment.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const supabase = createClient();
                          const { data } = supabase.storage
                            .from('attachments')
                            .getPublicUrl(attachment.file_path);
                          window.open(data.publicUrl, '_blank');
                        }}
                      >
                        הורדה
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingAttachmentId(attachment.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ProtocolAttachments; 