"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
export function useRealtime() { const client=useQueryClient(); const token=useAuthStore((state)=>state.token); useEffect(()=>{ const url=process.env.NEXT_PUBLIC_WS_URL; if(!url||!token) return; let socket:WebSocket|undefined; try { const nextUrl=new URL(url); nextUrl.searchParams.set("token",token); socket=new WebSocket(nextUrl.toString()); socket.onmessage=()=>client.invalidateQueries(); } catch {} return()=>socket?.close(); },[client,token]); }
