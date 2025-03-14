import ChatInterface from "@/components/ChatInterface";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Home() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen">
        <ChatInterface />
      </main>
    </ProtectedRoute>
  );
}
