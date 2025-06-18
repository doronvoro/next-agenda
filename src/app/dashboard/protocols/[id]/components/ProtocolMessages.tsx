import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ProtocolMessage = {
  id: string;
  protocol_id: string;
  message: string;
  user_id: string | null;
  created_at: string;
};

interface ProtocolMessagesProps {
  protocolMessages: ProtocolMessage[];
  newMessage: string;
  selectedRecipients: string[];
  selectedTemplate: string;
  handleSendMessage: (e: React.FormEvent) => void;
  setNewMessage: (message: string) => void;
  handleOpenRecipientsDialog: () => void;
  handleTemplateChange: (template: string) => void;
  formatDate: (dateString: string) => string;
}

const ProtocolMessages: React.FC<ProtocolMessagesProps> = ({
  protocolMessages,
  newMessage,
  selectedRecipients,
  selectedTemplate,
  handleSendMessage,
  setNewMessage,
  handleOpenRecipientsDialog,
  handleTemplateChange,
  formatDate,
}) => {
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
                  onClick={handleOpenRecipientsDialog}
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
    </div>
  );
};

export default ProtocolMessages; 