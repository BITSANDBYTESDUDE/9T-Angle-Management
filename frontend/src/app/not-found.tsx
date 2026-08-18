import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound(){return <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center"><div><p className="text-7xl font-black text-primary/20">404</p><h1 className="mt-2 text-2xl font-bold">Page not found</h1><p className="mt-2 text-sm text-muted-foreground">The workspace page you requested does not exist.</p><Button asChild className="mt-6"><Link href="/dashboard">Return to dashboard</Link></Button></div></main>}
