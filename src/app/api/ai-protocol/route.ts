// NOTE: Make sure to install the 'openai' package: npm install openai
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing or invalid messages array" }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    let json;
    if (typeof content === "string") {
      // Try to extract JSON from code block
      const match = content.match(/```json\n([\s\S]*?)```/);
      if (match) {
        json = JSON.parse(match[1]);
      } else {
        try {
          json = JSON.parse(content);
        } catch {
          json = content;
        }
      }
    } else {
      json = null;
    }

    return NextResponse.json({ result: json });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
} 