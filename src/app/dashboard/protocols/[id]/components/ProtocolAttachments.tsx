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
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint Presentation',
    'application/vnd.ms-excel': 'Excel Spreadsheet',
    'application/msword': 'Word Document',
    'application/vnd.ms-powerpoint': 'PowerPoint Presentation',
    
    // PDF
    'application/pdf': 'PDF Document',
    
    // Images
    'image/jpeg': 'JPEG Image',
    'image/jpg': 'JPEG Image',
    'image/png': 'PNG Image',
    'image/gif': 'GIF Image',
    'image/webp': 'WebP Image',
    'image/svg+xml': 'SVG Image',
    
    // Text
    'text/plain': 'Text File',
    'text/csv': 'CSV File',
    'text/html': 'HTML File',
    
    // Archives
    'application/zip': 'ZIP Archive',
    'application/x-rar-compressed': 'RAR Archive',
    'application/x-7z-compressed': '7-Zip Archive',
    
    // Audio
    'audio/mpeg': 'MP3 Audio',
    'audio/wav': 'WAV Audio',
    'audio/ogg': 'OGG Audio',
    
    // Video
    'video/mp4': 'MP4 Video',
    'video/avi': 'AVI Video',
    'video/mov': 'MOV Video',
    'video/wmv': 'WMV Video',
  };

  return mimeTypeMap[mimeType] || mimeType.split('/')[1]?.toUpperCase() || 'Unknown File Type';
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
        <h3 className="text-lg font-medium">Protocol Attachments</h3>
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
          Upload Attachment
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
          <p>No attachments found for this protocol</p>
          <p className="text-sm">Upload files to share with protocol members</p>
        </div>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
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
                        Download
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