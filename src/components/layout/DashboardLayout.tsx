
import React from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from './DashboardSidebar';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const MarketStatus: React.FC = () => {
  // This would come from real API, mocked for demo
  const marketIndices = [
    { name: "NIFTY", value: "22,302.50", change: "+0.35%", isPositive: true },
    { name: "SENSEX", value: "73,256.36", change: "+0.40%", isPositive: true },
    { name: "BANKNIFTY", value: "47,786.55", change: "-0.12%", isPositive: false },
    { name: "NIFTY-IT", value: "32,956.20", change: "+0.72%", isPositive: true },
  ];

  return (
    <div className="flex items-center space-x-8 text-sm overflow-x-auto scrollbar-none py-1 px-4 bg-sidebar/50">
      {marketIndices.map((index) => (
        <div key={index.name} className="flex items-center space-x-2 whitespace-nowrap">
          <span className="font-medium">{index.name}</span>
          <span>{index.value}</span>
          <span className={index.isPositive ? "text-profit flex items-center" : "text-loss flex items-center"}>
            {index.change}
            {index.isPositive ? 
              <ArrowUpRight className="h-3 w-3 ml-0.5" /> : 
              <ArrowDownRight className="h-3 w-3 ml-0.5" />
            }
          </span>
        </div>
      ))}
    </div>
  );
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="flex w-full h-screen overflow-hidden">
        <DashboardSidebar />
        <div className="flex flex-col flex-1 h-screen overflow-hidden">
          <div className="sticky top-0 z-30">
            <header className="flex items-center justify-between border-b border-border h-14 px-4">
              <div className="flex items-center">
                <SidebarTrigger />
                <h1 className="ml-4 font-semibold text-xl">Stock Seer India</h1>
              </div>
              <div className="flex items-center space-x-3">
                <button className="bg-primary/20 hover:bg-primary/30 text-primary-foreground px-3 py-1 rounded text-sm transition-colors">
                  Switch to Demo Data
                </button>
              </div>
            </header>
            <MarketStatus />
          </div>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
        <SonnerToaster />
        <Toaster />
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
