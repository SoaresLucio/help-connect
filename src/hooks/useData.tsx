import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from "react";
import {
  CompanyJob, HelpOffer, HelpRequest, JobApplication, CandidateStatus, ChatThread, ChatMessage,
} from "@/lib/types";
import {
  seedRequests, seedOffers, seedJobs, seedApplications, seedThreads, seedMessages,
} from "@/lib/seed";

const KEY = "helpaqui.data.v1";

interface DataState {
  requests: HelpRequest[];
  offers: HelpOffer[];
  jobs: CompanyJob[];
  applications: JobApplication[];
  threads: ChatThread[];
  messages: Record<string, ChatMessage[]>;
}

interface DataContextValue extends DataState {
  addRequest: (r: Omit<HelpRequest, "id" | "createdAt" | "proposalsCount">) => void;
  addOffer: (o: Omit<HelpOffer, "id" | "rating" | "reviews">) => void;
  addJob: (j: Omit<CompanyJob, "id" | "createdAt" | "status">) => void;
  updateApplicationStatus: (id: string, status: CandidateStatus) => void;
  sendMessage: (threadId: string, text: string) => void;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

const initial: DataState = {
  requests: seedRequests,
  offers: seedOffers,
  jobs: seedJobs,
  applications: seedApplications,
  threads: seedThreads,
  messages: seedMessages,
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>(initial);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...initial, ...JSON.parse(raw) });
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const addRequest: DataContextValue["addRequest"] = useCallback((r) => {
    setState(s => ({
      ...s,
      requests: [
        { ...r, id: `r-${Date.now()}`, createdAt: new Date().toISOString(), proposalsCount: 0 },
        ...s.requests,
      ],
    }));
  }, []);

  const addOffer: DataContextValue["addOffer"] = useCallback((o) => {
    setState(s => ({
      ...s,
      offers: [{ ...o, id: `o-${Date.now()}`, rating: 5.0, reviews: 0 }, ...s.offers],
    }));
  }, []);

  const addJob: DataContextValue["addJob"] = useCallback((j) => {
    setState(s => ({
      ...s,
      jobs: [
        { ...j, id: `j-${Date.now()}`, createdAt: new Date().toISOString(), status: "open" },
        ...s.jobs,
      ],
    }));
  }, []);

  const updateApplicationStatus: DataContextValue["updateApplicationStatus"] = useCallback((id, status) => {
    setState(s => ({
      ...s,
      applications: s.applications.map(a => (a.id === id ? { ...a, status } : a)),
    }));
  }, []);

  const sendMessage: DataContextValue["sendMessage"] = useCallback((threadId, text) => {
    setState(s => {
      const msg: ChatMessage = {
        id: `m-${Date.now()}`,
        threadId,
        fromId: "me",
        text,
        at: new Date().toISOString(),
      };
      return {
        ...s,
        messages: { ...s.messages, [threadId]: [...(s.messages[threadId] || []), msg] },
        threads: s.threads.map(t => t.id === threadId ? { ...t, lastMessageAt: msg.at } : t),
      };
    });
  }, []);

  const value = useMemo<DataContextValue>(() => ({
    ...state, addRequest, addOffer, addJob, updateApplicationStatus, sendMessage,
  }), [state, addRequest, addOffer, addJob, updateApplicationStatus, sendMessage]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
