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
import { useTranslations } from "next-intl";

interface ProtocolAttachmentsProps {
  protocolAttachments: ProtocolAttachment[];
  handleUploadAttachment: (files: FileList | null) => void;
  setDeletingAttachmentId: (id: string) => void;
  formatDate: (dateString: string) => string;
}

const ProtocolAttachments: React.FC<ProtocolAttachmentsProps> = ({
  protocolAttachments,
  handleUploadAttachment,
  setDeletingAttachmentId,
  formatDate,
}) => {
  const t = useTranslations("dashboard.protocols.attachments");
  
  // Debug logs
  console.log("🔍 ProtocolAttachments Debug:");
  console.log("Translation namespace:", "dashboard.protocols.attachments");
  console.log("Translation function:", t);
  console.log("Title translation:", t("title"));
  console.log("Upload attachment translation:", t("uploadAttachment"));
  console.log("No attachments found translation:", t("noAttachmentsFound"));
  console.log("Upload files to share translation:", t("uploadFilesToShare"));
  
  // Test if translation function is working
  try {
    const testTranslation = t("title");
    console.log("✅ Translation test successful:", testTranslation);
  } catch (error) {
    console.error("❌ Translation test failed:", error);
  }

  const getFileTypeDisplay = (mimeType: string): string => {
    const mimeTypeMap: { [key: string]: string } = {
      // Microsoft Office
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': t("fileTypes.excelSpreadsheet"),
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': t("fileTypes.wordDocument"),
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': t("fileTypes.powerPointPresentation"),
      'application/vnd.ms-excel': t("fileTypes.excelSpreadsheet"),
      'application/msword': t("fileTypes.wordDocument"),
      'application/vnd.ms-powerpoint': t("fileTypes.powerPointPresentation"),
      
      // PDF
      'application/pdf': t("fileTypes.pdfDocument"),
      
      // Images
      'image/jpeg': t("fileTypes.jpegImage"),
      'image/jpg': t("fileTypes.jpegImage"),
      'image/png': t("fileTypes.pngImage"),
      'image/gif': t("fileTypes.gifImage"),
      'image/webp': t("fileTypes.webpImage"),
      'image/svg+xml': t("fileTypes.svgImage"),
      
      // Text
      'text/plain': t("fileTypes.textFile"),
      'text/csv': t("fileTypes.csvFile"),
      'text/html': t("fileTypes.htmlFile"),
      
      // Archives
      'application/zip': t("fileTypes.zipArchive"),
      'application/x-rar-compressed': t("fileTypes.rarArchive"),
      'application/x-7z-compressed': t("fileTypes.sevenZipArchive"),
      
      // Audio
      'audio/mpeg': t("fileTypes.mp3Audio"),
      'audio/wav': t("fileTypes.wavAudio"),
      'audio/ogg': t("fileTypes.oggAudio"),
      
      // Video
      'video/mp4': t("fileTypes.mp4Video"),
      'video/avi': t("fileTypes.aviVideo"),
      'video/mov': t("fileTypes.movVideo"),
      'video/wmv': t("fileTypes.wmvVideo"),
    };

    return mimeTypeMap[mimeType] || mimeType.split('/')[1]?.toUpperCase() || t("fileTypes.unknownFileType");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{t("title")}</h3>
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
          {t("uploadAttachment")}
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
          <p>{t("noAttachmentsFound")}</p>
          <p className="text-sm">{t("uploadFilesToShare")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fileName")}</TableHead>
                <TableHead>{t("size")}</TableHead>
                <TableHead>{t("type")}</TableHead>
                <TableHead>{t("uploaded")}</TableHead>
                <TableHead className="w-[100px]">{t("actions")}</TableHead>
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
                        {t("download")}
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