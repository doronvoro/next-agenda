"use client";

import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AIProtocolPreview } from "./AIProtocolPreview";

interface Message {
  id: number;
  sender: "user" | "ai";
  content: string;
  isJson?: boolean;
}

const SYSTEM_PROMPT = `You are a protocol creation assistant. Help the user create a protocol by asking for missing information step by step.

After every user message, do the following:
1. Respond with a conversational message confirming what the user provided and clearly asking for the next required field.
2. Return the current protocol JSON object (with all fields provided so far, missing fields as null or empty) inside a single \`\`\`json code block. Always include a field called "conversation_result" in the JSON, which contains the conversational message for the user.

Never return only the JSON without the "conversation_result" field.

Example 1:
User: The protocol number is 98.1
Assistant:
\`\`\`json
{
  "conversation_result": "Great, you've set the protocol number to 98.1. Please provide the company details (name, number, address).",
  "company": { "name": null, "number": null, "address": null },
  "number": "98.1",
  "due_date": null,
  "committee": { "id": null, "name": null },
  "members": [],
  "agenda_items": []
}
\`\`\`

Example 2:
User: The company name is Acme Corp
Assistant:
\`\`\`json
{
  "conversation_result": "Thank you, the company name is now set to Acme Corp. Please provide the company number and address.",
  "company": { "name": "Acme Corp", "number": null, "address": null },
  "number": "98.1",
  "due_date": null,
  "committee": { "id": null, "name": null },
  "members": [],
  "agenda_items": []
}
\`\`\`

When all required fields are provided, confirm the protocol creation and show the complete JSON.

If the user wants to add more details (like members or agenda items), ask for those as well.

Schema:
{
  "conversation_result": string,
  "company": { "name": string, "number": string, "address": string },
  "number": number | string,
  "due_date": ISO8601 string,
  "committee": { "id": string, "name": string },
  "members": [ { "id": string, "name": string, "type": number, "status": number } ],
  "agenda_items": [ { "id": string, "title": string, "topic_content": string, "decision_content": string, "display_order": number } ]
}

Rules:
- All fields are required unless marked as nullable.
- Dates must be in ISO8601 format.
- Members and agenda_items can be empty arrays.
- Always return the JSON with the 'conversation_result' field after every user message, even if incomplete.`;

export default function AIProtocolPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const nextId = useRef(1);
  const [protocolJson, setProtocolJson] = useState<any>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg: Message = {
      id: nextId.current++,
      sender: "user",
      content: input.trim(),
    };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");
    setLoading(true);

    const chatHistory = [
      { role: "system", content: SYSTEM_PROMPT },
      ...[...messages, userMsg].map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.content,
      })),
    ];

    try {
      const res = await fetch("/api/ai-protocol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory }),
      });
      const data = await res.json();

      let conversationText = "Sorry, I had trouble processing that response.";
      let protocolData = null;

      if (data.result && typeof data.result === 'object') {
        const result = data.result;
        conversationText = result.conversation_result || "I've updated the protocol. What's next?";
        const { conversation_result, ...rest } = result;
        protocolData = rest;
      } else if (typeof data.result === 'string') {
        conversationText = data.result;
      }

      setMessages((msgs) => [
        ...msgs,
        {
          id: nextId.current++,
          sender: "ai",
          content: conversationText,
          isJson: false,
        },
      ]);
      if (protocolData) {
        setProtocolJson(protocolData);
      }
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        {
          id: nextId.current++,
          sender: "ai",
          content: "Sorry, there was an error generating the protocol.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-row h-[80vh] max-w-6xl mx-auto">
      <div className="flex-1 flex flex-col bg-background border rounded-xl shadow-lg overflow-hidden mr-6">
        <div className="flex-shrink-0 px-6 py-4 border-b bg-muted">
          <h1 className="text-2xl font-bold">AI Protocol Assistant</h1>
          <p className="text-muted-foreground text-sm">Chat with AI to create your protocol</p>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-background">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl shadow text-base whitespace-pre-line ${
                  msg.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-muted text-foreground rounded-bl-none"
                }`}
                style={msg.isJson ? { fontFamily: "monospace", fontSize: 14, background: "#f6f8fa" } : {}}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[70%] px-4 py-2 rounded-2xl shadow text-base bg-muted text-foreground rounded-bl-none opacity-70">
                Thinking...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleSend} className="flex items-center gap-2 p-4 border-t bg-background">
          <Input
            className="flex-1 rounded-full px-4 py-2"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" className="rounded-full px-6" disabled={loading}>Send</Button>
        </form>
      </div>
      <div className="w-[40%] min-w-[350px] max-w-xl">
        <AIProtocolPreview protocol={protocolJson} />
      </div>
    </div>
  );
} 