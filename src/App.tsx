import React, { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Dashboard loads eagerly (most used)
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Other pages load lazily
const Market = React.lazy(() => import("./pages/Market"));
const News = React.lazy(() => import("./pages/News"));
const Screener = React.lazy(() => import("./pages/Screener"));
const IPO = React.lazy(() => import("./pages/IPO"));
const MutualFunds = React.lazy(() => import("./pages/MutualFunds"));
const Commodities = React.lazy(() => import("./pages/Commodities"));
const Compare = React.lazy(() => import("./pages/Compare"));

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

const PageLoader = () => (
  <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--ns-bg, #1e2230)' }}>
    <div style={{ textAlign: 'center' }}>
      <div className="ns-ai-orb" style={{ width: 48, height: 48, margin: '0 auto 16px' }} />
      <p style={{ color: 'var(--ns-text-3, #8b8fa3)', fontSize: 14 }}>Loading...</p>
    </div>
  </div>
);

const PrefetchPages = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      import("./pages/Market");
      import("./pages/News");
      import("./pages/Compare");
      import("./pages/Screener");
      import("./pages/IPO");
      import("./pages/MutualFunds");
      import("./pages/Commodities");
    }, 3000);
    return () => clearTimeout(timer);
  }, []);
  return null;
};

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
            <Route path="/market" element={<P><Suspense fallback={<PageLoader />}><Market /></Suspense></P>} />
            <Route path="/compare" element={<P><Suspense fallback={<PageLoader />}><Compare /></Suspense></P>} />
            <Route path="/news" element={<P><Suspense fallback={<PageLoader />}><News /></Suspense></P>} />
            <Route path="/screener" element={<P><Suspense fallback={<PageLoader />}><Screener /></Suspense></P>} />
            <Route path="/ipo" element={<P><Suspense fallback={<PageLoader />}><IPO /></Suspense></P>} />
            <Route path="/mutual-funds" element={<P><Suspense fallback={<PageLoader />}><MutualFunds /></Suspense></P>} />
            <Route path="/commodities" element={<P><Suspense fallback={<PageLoader />}><Commodities /></Suspense></P>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <PrefetchPages />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
