import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import PublicProfile from "./pages/PublicProfile";
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
import MyApplicationsPage from "./pages/dashboard/MyApplicationsPage";
import MapPage from "./pages/dashboard/MapPage";
import PaymentReturn from "./pages/PaymentReturn";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/u/:userId" element={<PublicProfile />} />
            <Route path="/pagamento/:paymentId" element={<PaymentReturn />} />
            <Route path="/app" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="feed" element={<FeedPage />} />
              <Route path="mapa" element={<MapPage />} />
              <Route path="solicitar" element={<RequestNew />} />
              <Route path="solicitar/:id" element={<RequestNew />} />
              <Route path="oferecer" element={<OfferNew />} />
              <Route path="oferecer/:id" element={<OfferNew />} />
              <Route path="vagas" element={<JobsPage />} />
              <Route path="vagas/nova" element={<JobNew />} />
              <Route path="candidatos" element={<CandidatesKanban />} />
              <Route path="minhas-candidaturas" element={<MyApplicationsPage />} />
              <Route path="mensagens" element={<MessagesPage />} />
              <Route path="perfil" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
