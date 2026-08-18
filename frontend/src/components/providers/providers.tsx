"use client";
import { Toaster } from "sonner";
import { AuthProvider } from "./auth-provider";
export function Providers({ children }: { children: React.ReactNode }) { return <AuthProvider>{children}<Toaster richColors closeButton position="top-right" toastOptions={{ className: "font-sans" }} /></AuthProvider>; }
