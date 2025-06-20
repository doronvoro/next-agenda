"use client";

import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: number;
  sender: "user" | "ai";
  content: string;
  isJson?: boolean;
}

const SYSTEM_PROMPT = `You are a protocol creation assistant. Help the user create a protocol by asking for missing information step by step. If the user provides some fields (like protocol number), confirm and ask for the next required field (committee, due date, etc). When all required fields are provided, confirm the protocol creation and show the JSON. If the user wants to add more details (like members or agenda items), ask for those as well.`;

export default function AIProtocolPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const nextId = useRef(1);

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

    // Prepare chat history for OpenAI
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
      setMessages((msgs) => [
        ...msgs,
        {
          id: nextId.current++,
          sender: "ai",
          content: typeof data.result === "object" ? JSON.stringify(data.result, null, 2) : data.result,
          isJson: typeof data.result === "object",
        },
      ]);
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
    <div className="flex flex-col h-[80vh] max-w-2xl mx-auto bg-background border rounded-xl shadow-lg overflow-hidden">
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
  );
} 