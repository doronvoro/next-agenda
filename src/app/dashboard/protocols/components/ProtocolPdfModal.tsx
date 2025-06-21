"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, Download, Loader2 } from "lucide-react";

interface ProtocolPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  protocolId: string;
  protocolNumber: string;
}

export default function ProtocolPdfModal({
  isOpen,
  onClose,
  protocolId,
  protocolNumber,
}: ProtocolPdfModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && protocolId) {
      generatePdf();
    }
  }, [isOpen, protocolId]);

  const generatePdf = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/protocols/${protocolId}/download-pdf`);
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `protocol-${protocolNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleClose = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>Protocol #{protocolNumber}</DialogTitle>
            <div className="flex items-center gap-2 mr-10">
              {pdfUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Generating PDF...</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={generatePdf} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          )}
          
          {pdfUrl && !loading && !error && (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title={`Protocol ${protocolNumber} PDF`}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 