import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNav from "@/components/BottomNav";
import BackgroundBlobs from "@/components/BackgroundBlobs";
import Index from "./pages/Index";
import LogMeal from "./pages/LogMeal";
import History from "./pages/History";
import SettingsPage from "./pages/SettingsPage";
import Onboarding from "./pages/Onboarding";
import Suggestions from "./pages/Suggestions";
import NotFound from "./pages/NotFound";
import { isOnboarded } from "@/lib/nutrition-store";

const queryClient = new QueryClient();

const RequireOnboarding = ({ children }: { children: JSX.Element }) => {
  const location = useLocation();
  if (!isOnboarded() && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BackgroundBlobs />
      <BrowserRouter>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={<RequireOnboarding><Index /></RequireOnboarding>} />
          <Route path="/log" element={<RequireOnboarding><LogMeal /></RequireOnboarding>} />
          <Route path="/history" element={<RequireOnboarding><History /></RequireOnboarding>} />
          <Route path="/suggestions" element={<RequireOnboarding><Suggestions /></RequireOnboarding>} />
          <Route path="/settings" element={<RequireOnboarding><SettingsPage /></RequireOnboarding>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
