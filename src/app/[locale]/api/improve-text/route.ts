import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Invalid text' }, { status: 400 });
    }

    // Call OpenAI API
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OpenAI API key' }, { status: 500 });
    }

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'אתה עוזר שמשפר ומבהיר טקסט של סדר יום לישיבות. שפר את הטקסט, הפוך אותו לברור, תמציתי ומקצועי, שמור על המשמעות המקורית וענה תמיד בעברית.' },
          { role: 'user', content: text },
        ],
        max_tokens: 512,
        temperature: 0.7,
      }),
    });

    if (!openaiRes.ok) {
      const error = await openaiRes.text();
      return NextResponse.json({ error }, { status: 500 });
    }

    const openaiData = await openaiRes.json();
    const improvedText = openaiData.choices?.[0]?.message?.content?.trim() || text;
    return NextResponse.json({ improvedText });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
} 