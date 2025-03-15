import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  query,
  where,
  orderBy,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  role: "user" | "assistant";
  animated?: boolean;
  timestamp: number;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// Create a new conversation
export async function createConversation(userId: string, title: string) {
  const conversationsRef = collection(db, "conversations");
  const conversationData = {
    userId,
    title,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    messages: [],
  };

  const docRef = await addDoc(conversationsRef, conversationData);
  return {
    id: docRef.id,
    ...conversationData,
    createdAt: new Date(), // why is this not serverTimestamps?
    updatedAt: new Date(),
  };
}

// Get all conversations for a user
export async function getUserConversations(userId: string) {
  const conversationsRef = collection(db, "conversations");
  const q = query(
    conversationsRef,
    where("userId", "==", userId),
    orderBy("updatedAt", "desc")
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Conversation[];
}

// Get a single conversation with its messages
export async function getConversation(conversationId: string) {
  const conversationRef = doc(db, "conversations", conversationId);
  const conversationDoc = await getDoc(conversationRef);

  if (conversationDoc.exists()) {
    const data = conversationDoc.data();
    return {
      id: conversationDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as Conversation;
  }
  return null;
}

// Add a message to a conversation
export async function addMessageToConversation(
  conversationId: string,
  message: Omit<Message, "id">
) {
  const conversationRef = doc(db, "conversations", conversationId);
  const conversationDoc = await getDoc(conversationRef);

  if (!conversationDoc.exists()) {
    throw new Error("Conversation not found");
  }

  const conversation = conversationDoc.data() as Conversation;
  // Keep existing messages as they are and add the new message
  const updatedMessages = [
    ...conversation.messages,
    { ...message, id: Date.now().toString() },
  ];

  await updateDoc(conversationRef, {
    messages: updatedMessages,
    updatedAt: serverTimestamp(),
  });

  return updatedMessages;
}

// Delete a conversation
export async function deleteConversation(conversationId: string) {
  const conversationRef = doc(db, "conversations", conversationId);
  await deleteDoc(conversationRef);
}

// Update conversation title
export async function updateConversationTitle(
  conversationId: string,
  newTitle: string
) {
  const conversationRef = doc(db, "conversations", conversationId);
  await updateDoc(conversationRef, {
    title: newTitle,
    updatedAt: serverTimestamp(),
  });
}
