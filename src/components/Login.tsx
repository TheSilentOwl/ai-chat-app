import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { FirebaseError } from "firebase/app";

export default function Login() {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (err) {
      if (err instanceof FirebaseError) {
        if (err.code === "auth/unauthorized-domain") {
          setError(
            "This domain is not authorized. Please contact the administrator."
          );
        } else {
          setError("Failed to sign in with Google. Please try again.");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">
          Welcome to AI Chat
        </h1>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        <button
          onClick={handleSignIn}
          className="flex w-full items-center justify-center rounded-md bg-white px-4 py-2 text-gray-700 shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            className="mr-2 h-6 w-6"
          />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
