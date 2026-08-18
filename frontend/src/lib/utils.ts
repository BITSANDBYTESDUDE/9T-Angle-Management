import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatDate(value?: string | Date, options?: Intl.DateTimeFormatOptions) { if (!value) return "—"; return new Intl.DateTimeFormat("en-GB", options || { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)); }
export function formatTime(value?: string | Date) { if (!value) return "—"; return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
export function initials(name?: string) { return (name || "9T").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }
export function percent(value?: number) { return `${Math.round((value || 0) * 10) / 10}%`; }
export function titleCase(value?: string) { return (value || "").replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
export function greeting() { const hour = new Date().getHours(); return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"; }
