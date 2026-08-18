"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
export default function ErrorPage({error,reset}:{error:Error&{digest?:string};reset:()=>void}){useEffect(()=>{console.error(error)},[error]);return <main className="grid min-h-[60vh] place-items-center p-6 text-center"><div><h1 className="text-2xl font-bold">Something went wrong</h1><p className="mt-2 max-w-md text-sm text-muted-foreground">The workspace could not render this page. Your data was not changed.</p><Button className="mt-5" onClick={reset}>Try again</Button></div></main>}
