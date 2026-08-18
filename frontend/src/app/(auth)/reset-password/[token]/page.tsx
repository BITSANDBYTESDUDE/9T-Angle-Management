"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { post } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
export default function ResetPassword(){const {token}=useParams<{token:string}>();const router=useRouter();const [password,setPassword]=useState("");const [confirm,setConfirm]=useState("");const [loading,setLoading]=useState(false);async function submit(e:React.FormEvent){e.preventDefault();if(password.length<8)return toast.error("Use at least 8 characters.");if(password!==confirm)return toast.error("Passwords do not match.");setLoading(true);try{await post(`/auth/reset-password/${token}`,{password});toast.success("Password reset. Please sign in.");router.replace("/login")}catch(e){toast.error(e instanceof Error?e.message:"Reset failed.")}finally{setLoading(false)}}return <div className="flex min-h-screen items-center justify-center p-6"><Card className="w-full max-w-md p-7"><h1 className="text-2xl font-bold">Choose a new password</h1><p className="mt-2 text-sm text-muted-foreground">Use at least 8 characters and keep it unique.</p><form onSubmit={submit} className="mt-6 space-y-4"><div><Label>New password</Label><Input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></div><div><Label>Confirm password</Label><Input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required/></div><Button className="w-full" disabled={loading}>{loading?"Updating…":"Set new password"}</Button></form></Card></div>}
