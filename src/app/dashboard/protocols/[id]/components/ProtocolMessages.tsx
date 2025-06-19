import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProtocolMessage, ProtocolMember } from "../types";
import { sendProtocolMessage } from "../supabaseApi";
import { createClient } from "@/lib/supabase/client";
import { RecipientsDialog } from "./dialogs/RecipientsDialog";

interface ProtocolMessagesProps {
  protocolMessages: ProtocolMessage[];
  formatDate: (dateString: string) => string;
  protocolId: string;
  onMessageSent?: (message: ProtocolMessage) => void;
  protocolMembers?: ProtocolMember[];
}

const ProtocolMessages: React.FC<ProtocolMessagesProps> = ({
  protocolMessages,
  formatDate,
  protocolId,
  onMessageSent,
  protocolMembers = [],
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [isRecipientsDialogOpen, setIsRecipientsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      else setUserId(null);
    };
    fetchUser();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    if (!userId) {
      setError("You must be logged in to send messages.");
      return;
    }
    setError(null);
    try {
      const sentMessage = await sendProtocolMessage(protocolId, newMessage, userId);
      if (onMessageSent) onMessageSent(sentMessage);
      setNewMessage("");
    } catch (err) {
      setError("Failed to send message");
    }
  };

  const handleTemplateChange = (template: string) => {
    setSelectedTemplate(template);
    switch (template) {
      case "select-template":
        setNewMessage("");
        break;
      case "pre-meeting materials":
        setNewMessage("Pre-meeting materials are now available for review.");
        break;
      case "protocol approval":
        setNewMessage("Protocol approval is required. Please review and approve.");
        break;
      case "general message":
        setNewMessage("");
        break;
      default:
        setNewMessage("");
    }
  };

  const handleRecipientToggle = (memberId: string) => {
    setSelectedRecipients(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSelectAllRecipients = () => {
    setSelectedRecipients(protocolMembers.map(member => member.id));
  };

  const handleClearAllRecipients = () => {
    setSelectedRecipients([]);
  };

  const handleCancelRecipientsDialog = () => {
    setIsRecipientsDialogOpen(false);
    setSelectedRecipients([]);
  };

  const handleCloseRecipientsDialog = () => {
    setIsRecipientsDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Messages</h3>
      </div>

      <div className="h-[500px] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 p-4">
          {protocolMessages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No messages found for this protocol
            </div>
          ) : (
            protocolMessages.map((message) => (
              <div
                key={message.id}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-start space-x-2">
                  <div className="flex-1 bg-muted rounded-lg p-3">
                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(message.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex flex-col space-y-2">
            {error && <div className="text-sm text-red-500">{error}</div>}
            <textarea
              id="new-message-textarea"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-right"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setIsRecipientsDialogOpen(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Select Recipients ({selectedRecipients.length} selected)
                </button>
                <div className="flex items-center space-x-2">
                  <Select
                    value={selectedTemplate}
                    onValueChange={handleTemplateChange}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Choose template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="select-template">Select template</SelectItem>
                      <SelectItem value="pre-meeting materials">Pre-meeting materials</SelectItem>
                      <SelectItem value="protocol approval">Protocol approval</SelectItem>
                      <SelectItem value="general message">General message</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setNewMessage("")}
                  disabled={!newMessage.trim()}
                >
                  Clear
                </Button>
                <Button type="submit" disabled={!newMessage.trim()}>
                  Send Message
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
      <RecipientsDialog
        open={isRecipientsDialogOpen}
        onOpenChange={setIsRecipientsDialogOpen}
        protocolMembers={protocolMembers}
        selectedRecipients={selectedRecipients}
        onRecipientToggle={handleRecipientToggle}
        onSelectAll={handleSelectAllRecipients}
        onClearAll={handleClearAllRecipients}
        onCancel={handleCancelRecipientsDialog}
        onConfirm={handleCloseRecipientsDialog}
      />
    </div>
  );
};

export default ProtocolMessages; 