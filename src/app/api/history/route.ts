import { NextResponse } from "next/server";
import { readChatHistory, saveChatHistory } from "@/utils/chatHistory";

export async function GET() {
  try {
    const history = await readChatHistory();
    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read chat history" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const messages = await req.json();
    const existingHistory = await readChatHistory();
    const updatedHistory = [
      ...existingHistory,
      ...messages.filter(
        (msg: any) =>
          !existingHistory.some((existing: any) => existing.id === msg.id)
      ),
    ];
    await saveChatHistory(updatedHistory);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save chat history" },
      { status: 500 }
    );
  }
}
