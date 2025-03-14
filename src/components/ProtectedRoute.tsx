"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth");
      } else {
        setIsAuthenticated(true);
      }
    }
  }, [user, loading, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-100 border-t-red-600"></div>
          <p className="mt-4 text-red-900 font-medium">
            {loading ? "Loading..." : "Verifying authentication..."}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
