"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
export function useRealtime() { const client=useQueryClient(); useEffect(()=>{ const url=process.env.NEXT_PUBLIC_WS_URL; if(!url) return; let socket:WebSocket|undefined; try { socket=new WebSocket(url); socket.onmessage=()=>client.invalidateQueries(); } catch {} return()=>socket?.close(); },[client]); }
