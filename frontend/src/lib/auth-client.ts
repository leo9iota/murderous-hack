import { createAuthClient } from "better-auth/react";

// Create and export the auth client
export const authClient = createAuthClient({
  baseURL: "/api/auth",
});

// For now, just export the available methods
export const signIn = authClient.signIn;
export const signUp = authClient.signUp;
export const signOut = authClient.signOut; 