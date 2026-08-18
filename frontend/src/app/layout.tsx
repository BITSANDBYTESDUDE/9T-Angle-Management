import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/providers";
export const metadata: Metadata = { title: { default: "9T-Angle Workspace", template: "%s | 9T-Angle" }, description: "Employee task, target, attendance and performance management for 9T-Angle.", icons: { icon: "/favicon.svg" } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#146f67" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><Providers>{children}</Providers></body></html>; }
