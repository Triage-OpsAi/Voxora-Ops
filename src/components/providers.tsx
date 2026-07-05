"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { QUERY_REFRESH_INTERVAL } from "@/constants/navigation";
export function Providers({children}:{children:React.ReactNode}) { const [client]=useState(()=>new QueryClient({defaultOptions:{queries:{staleTime:15_000,refetchInterval:QUERY_REFRESH_INTERVAL,retry:1}}})); return <QueryClientProvider client={client}>{children}</QueryClientProvider>; }
