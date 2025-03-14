import fs from "fs/promises";
import path from "path";

const HISTORY_FILE = path.join(process.cwd(), "chat-history.json");

interface Message {
  content: string;
  role: "user" | "assistant";
  id: string;
  timestamp: number;
}

export async function readChatHistory(): Promise<Message[]> {
  try {
    const data = await fs.readFile(HISTORY_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is invalid, return empty array
    return [];
  }
}

export async function saveChatHistory(messages: Message[]): Promise<void> {
  try {
    await fs.writeFile(HISTORY_FILE, JSON.stringify(messages, null, 2));
  } catch (error) {
    console.error("Error saving chat history:", error);
  }
}
