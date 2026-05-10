import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import Market from "./pages/Market";
import News from "./pages/News";
import Screener from "./pages/Screener";
import IPO from "./pages/IPO";
import MutualFunds from "./pages/MutualFunds";
import Commodities from "./pages/Commodities";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<P><Index /></P>} />
            <Route path="/stock/:ticker" element={<P><Index /></P>} />
            <Route path="/market" element={<P><Market /></P>} />
            <Route path="/news" element={<P><News /></P>} />
            <Route path="/screener" element={<P><Screener /></P>} />
            <Route path="/ipo" element={<P><IPO /></P>} />
            <Route path="/mutual-funds" element={<P><MutualFunds /></P>} />
            <Route path="/commodities" element={<P><Commodities /></P>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
