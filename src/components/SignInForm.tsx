import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { FirebaseError } from "firebase/app";

export default function SignInForm() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await signIn(email, password);
    } catch (err) {
      if (err instanceof FirebaseError) {
        // Handle specific Firebase auth errors
        switch (err.code) {
          case "auth/invalid-email":
          case "auth/user-not-found":
          case "auth/wrong-password":
          case "auth/invalid-credential":
            setError("Wrong credentials. Please try again.");
            break;
          default:
            setError("An error occurred. Please try again later.");
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-500 focus:outline-none focus:ring-gray-500"
          required
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-500 focus:outline-none focus:ring-gray-500"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-md bg-gray-800 px-4 py-2 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
      >
        Sign In
      </button>
    </form>
  );
}
