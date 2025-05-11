import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API KEY 未配置', detail: process.env }, { status: 500 });
    }
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        stream: false,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: 'DeepSeek API 调用失败', status: response.status, data }, { status: 500 });
    }
    const reply = data.choices?.[0]?.message?.content || 'AI无回复';
    return NextResponse.json({ reply });
  } catch (e) {
    return NextResponse.json({ error: '服务器异常', detail: String(e) }, { status: 500 });
  }
} 