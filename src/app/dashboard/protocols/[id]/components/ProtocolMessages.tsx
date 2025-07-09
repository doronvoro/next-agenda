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
  const [isSending, setIsSending] = useState(false);

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
      setError("עליך להיות מחובר כדי לשלוח הודעות.");
      return;
    }
    
    setIsSending(true);
    setError(null);
    
    try {
      // First, save the message to the database
      const sentMessage = await sendProtocolMessage(protocolId, newMessage, userId);
      if (onMessageSent) onMessageSent(sentMessage);
      
      // Then, send emails to selected recipients if any
      if (selectedRecipients.length > 0) {
        try {
          const emailResponse = await fetch("/api/send-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              protocolId,
              message: newMessage,
              recipientIds: selectedRecipients,
            }),
          });

          const emailResult = await emailResponse.json();
          
          if (!emailResponse.ok) {
            console.error("Email sending failed:", emailResult.error);
            // Show a warning but don't prevent the message from being sent
            setError(`ההודעה נשלחה בהצלחה, אך שליחת ההתראה במייל נכשלה: ${emailResult.error}`);
          } else {
            console.log("Email sending result:", emailResult);
            // Show success message for email
            if (emailResult.note) {
              setError(`ההודעה נשלחה בהצלחה! ${emailResult.note}`);
            }
          }
        } catch (emailError) {
          console.error("Error sending emails:", emailError);
          setError("ההודעה נשלחה בהצלחה, אך שליחת ההתראה במייל נכשלה עקב שגיאת רשת");
        }
      }
      
      setNewMessage("");
      setSelectedRecipients([]); // Clear selected recipients after sending
    } catch (err) {
      setError("שליחת ההודעה נכשלה");
    } finally {
      setIsSending(false);
    }
  };

  const handleTemplateChange = (template: string) => {
    setSelectedTemplate(template);
    switch (template) {
      case "select-template":
        setNewMessage("");
        break;
      case "pre-meeting materials":
        setNewMessage("חומרים לפני ישיבה עכשיו זמינים לבדיקה.");
        break;
      case "protocol approval":
        setNewMessage("אישור פרוטוקול נדרש. אנא בדוק ואשר.");
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
        <h3 className="text-lg font-medium">הודעות</h3>
      </div>

      <div className="h-[500px] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 p-4">
          {protocolMessages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              לא נמצאו הודעות עבור פרוטוקול זה
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
              placeholder="הקלד את ההודעה שלך..."
              className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-right"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setIsRecipientsDialogOpen(true)}
                  className="text-sm text-primary hover:underline"
                >
                  בחר נמענים ({selectedRecipients.length} נבחרו)
                </button>
                <div className="flex items-center space-x-2">
                  <Select
                    value={selectedTemplate}
                    onValueChange={handleTemplateChange}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="בחר תבנית" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="select-template">בחר תבנית</SelectItem>
                      <SelectItem value="pre-meeting materials">חומרים לפני ישיבה</SelectItem>
                      <SelectItem value="protocol approval">אישור פרוטוקול</SelectItem>
                      <SelectItem value="general message">הודעה כללית</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setNewMessage("")}
                  disabled={!newMessage.trim() || isSending}
                >
                  נקה
                </Button>
                <Button type="submit" disabled={!newMessage.trim() || isSending}>
                  {isSending ? "שולח..." : "שלח הודעה"}
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