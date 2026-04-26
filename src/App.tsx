import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { DataProvider } from "@/hooks/useData";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import FeedPage from "./pages/dashboard/FeedPage";
import RequestNew from "./pages/dashboard/RequestNew";
import OfferNew from "./pages/dashboard/OfferNew";
import JobsPage from "./pages/dashboard/JobsPage";
import JobNew from "./pages/dashboard/JobNew";
import CandidatesKanban from "./pages/dashboard/CandidatesKanban";
import MessagesPage from "./pages/dashboard/MessagesPage";
import ProfilePage from "./pages/dashboard/ProfilePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/app" element={<DashboardLayout />}>
                <Route index element={<DashboardHome />} />
                <Route path="feed" element={<FeedPage />} />
                <Route path="solicitar" element={<RequestNew />} />
                <Route path="oferecer" element={<OfferNew />} />
                <Route path="vagas" element={<JobsPage />} />
                <Route path="vagas/nova" element={<JobNew />} />
                <Route path="candidatos" element={<CandidatesKanban />} />
                <Route path="mensagens" element={<MessagesPage />} />
                <Route path="perfil" element={<ProfilePage />} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
