"use client";

import { useState, useEffect } from "react";
import TypewriterEffect from "./TypewriterEffect";
import { useAuth } from "@/contexts/AuthContext";
import {
  Message,
  Conversation,
  createConversation,
  getUserConversations,
  getConversation,
  addMessageToConversation,
  deleteConversation,
} from "@/services/firestore";

export default function ChatInterface() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Copy timeout cleanup
  useEffect(() => {
    if (copiedId) {
      const timeout = setTimeout(() => {
        setCopiedId(null);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [copiedId]);

  // Load conversations on component mount
  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;
      try {
        const userConversations = await getUserConversations(user.uid);
        setConversations(userConversations);
        setMounted(true);
      } catch (error) {
        console.error("Error loading conversations:", error);
      }
    };
    loadConversations();
  }, [user]);

  // Load messages when conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentConversationId) return;
      try {
        const conversation = await getConversation(currentConversationId);
        if (conversation) {
          // Set all messages as already animated when loading from history
          setMessages(
            conversation.messages.map((msg) => ({ ...msg, animated: true }))
          );
        }
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    };
    loadMessages();
  }, [currentConversationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    try {
      setIsLoading(true);

      // Create new conversation if none exists
      if (!currentConversationId) {
        const newConversation = await createConversation(
          user.uid,
          input.slice(0, 50)
        );
        setCurrentConversationId(newConversation.id);
        setConversations((prev) => [newConversation, ...prev]);
      }

      const newMessage: Omit<Message, "id"> = {
        content: input,
        role: "user",
        timestamp: Date.now(),
        animated: false,
        conversationId: currentConversationId!,
      };

      // Add user message
      const updatedMessages = await addMessageToConversation(
        currentConversationId!,
        newMessage
      );
      setMessages(updatedMessages);
      setInput("");

      // Get AI response
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get AI response");
      }

      // Add AI message with animation
      const aiMessage: Omit<Message, "id"> = {
        content: data.response,
        role: "assistant",
        timestamp: Date.now(),
        animated: false, // Start as false to trigger animation
        conversationId: currentConversationId!,
      };

      const messagesWithAI = await addMessageToConversation(
        currentConversationId!,
        aiMessage
      );
      setMessages(messagesWithAI);
    } catch (error) {
      console.error("Error:", error);
      // Add error message to chat
      const errorMessage: Omit<Message, "id"> = {
        content: "Sorry, I encountered an error. Please try again.",
        role: "assistant",
        timestamp: Date.now(),
        animated: false, // Start as false to trigger animation
        conversationId: currentConversationId!,
      };

      const messagesWithError = await addMessageToConversation(
        currentConversationId!,
        errorMessage
      );
      setMessages(messagesWithError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (content: string, id: string) => {
    try {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = content;
      const textContent = tempDiv.textContent || tempDiv.innerText || content;
      await navigator.clipboard.writeText(textContent);
      setCopiedId(id);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handleAnimationComplete = (id: string) => {
    // Update the message in Firestore to mark it as animated
    const message = messages.find((msg) => msg.id === id);
    if (message) {
      const updatedMessages = messages.map((msg) =>
        msg.id === id ? { ...msg, animated: true } : msg
      );
      setMessages(updatedMessages);
    }
  };

  const handleNewChat = async () => {
    setCurrentConversationId(null);
    setMessages([]);
    setInput("");
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversation(conversationId);
      setConversations((prev) =>
        prev.filter((conv) => conv.id !== conversationId)
      );
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  if (!mounted || !user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col p-4">
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col transition-colors duration-200">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl p-4 relative group ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-200"
                      : "bg-white dark:bg-gray-700 border-2 border-black dark:border-gray-600 text-black dark:text-white shadow-lg transition-colors duration-200"
                  }`}
                >
                  {message.role === "assistant" && (
                    <button
                      onClick={() => handleCopy(message.content, message.id)}
                      className="absolute top-3 right-3 px-3 py-1 text-sm rounded-md bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 transition-all duration-200 flex items-center gap-2 hover:cursor-pointer"
                      title="Copy message"
                    >
                      {copiedId === message.id ? (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                          </svg>
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                  {message.role === "assistant" ? (
                    <div className="pr-20">
                      {!message.animated ? (
                        <TypewriterEffect
                          text={message.content}
                          speed={20}
                          onComplete={() => handleAnimationComplete(message.id)}
                        />
                      ) : (
                        message.content
                      )}
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-4 animate-pulse transition-colors duration-200">
                  Thinking<span className="animate-bounce">.</span>
                  <span className="animate-bounce delay-100">.</span>
                  <span className="animate-bounce delay-200">.</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <div className="border-t border-red-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 transition-colors duration-200">
            <form
              onSubmit={handleSubmit}
              className="relative flex items-center"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                rows={1}
                className="w-full pl-6 pr-32 py-4 bg-red-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 resize-none overflow-hidden placeholder-gray-500 dark:placeholder-gray-400"
                style={{
                  height: "3rem",
                  lineHeight: "1.5rem",
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "3rem";
                  const newHeight = Math.min(target.scrollHeight, 128);
                  if (newHeight > 48) {
                    target.style.height = newHeight + "px";
                    target.classList.remove("overflow-hidden");
                    target.classList.add("overflow-y-auto");
                  } else {
                    target.classList.add("overflow-hidden");
                    target.classList.remove("overflow-y-auto");
                  }
                }}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="absolute right-2 bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-full hover:bg-gray-900 dark:hover:bg-gray-200 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed hover:cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* History Tab */}
      <div className="w-80 bg-white dark:bg-gray-800 shadow-xl rounded-l-3xl flex flex-col m-4 ml-0 transition-colors duration-200">
        <div className="p-6 border-b border-red-100 dark:border-gray-700 flex justify-between items-center transition-colors duration-200">
          <h2 className="text-2xl font-bold text-red-900 dark:text-red-400 transition-colors duration-200">
            Chat History
          </h2>
          <button
            onClick={handleNewChat}
            className="p-2 rounded-full bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-colors duration-200 hover:cursor-pointer group"
            title="Start New Chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`mb-4 p-3 rounded-lg transition-colors duration-200 cursor-pointer group relative ${
                currentConversationId === conversation.id
                  ? "bg-red-100 dark:bg-red-900/30"
                  : "bg-red-50 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30"
              }`}
              onClick={() => setCurrentConversationId(conversation.id)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteConversation(conversation.id);
                }}
                className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-all duration-200"
                title="Delete conversation"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
              <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">
                {new Date(conversation.updatedAt).toLocaleString()}
              </p>
              <p className="text-gray-900 dark:text-white truncate transition-colors duration-200">
                {conversation.title || "New Conversation"}
              </p>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="text-gray-500 dark:text-gray-400 text-center italic transition-colors duration-200">
              No chat history yet. Start a new conversation!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
