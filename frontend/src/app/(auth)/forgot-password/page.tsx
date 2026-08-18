"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { post } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
export default function ForgotPassword() { const [email,setEmail]=useState(""); const [sent,setSent]=useState(false); const [loading,setLoading]=useState(false); async function submit(e:React.FormEvent){e.preventDefault();setLoading(true);try{await post("/auth/forgot-password",{email});setSent(true)}catch(e){toast.error(e instanceof Error?e.message:"Request failed.")}finally{setLoading(false)}} return <div className="flex min-h-screen items-center justify-center p-6"><Card className="w-full max-w-md p-7">{sent?<div className="text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-700"><MailCheck/></div><h1 className="mt-5 text-2xl font-bold">Check your inbox</h1><p className="mt-2 text-sm text-muted-foreground">If an active account exists for {email}, we sent a 15-minute reset link.</p></div>:<><h1 className="text-2xl font-bold">Reset your password</h1><p className="mt-2 text-sm text-muted-foreground">Enter your work email and we’ll send a secure reset link.</p><form onSubmit={submit} className="mt-6"><Label>Email address</Label><Input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@9tangle.com"/><Button className="mt-4 w-full" disabled={loading}>{loading?"Sending…":"Send reset link"}</Button></form></>}<Button asChild variant="ghost" className="mt-5 w-full"><Link href="/login"><ArrowLeft className="h-4 w-4"/> Back to sign in</Link></Button></Card></div> }
