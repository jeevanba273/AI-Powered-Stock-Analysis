
import React, { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from './DashboardSidebar';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { toast } from 'sonner';
import { INDIAN_API_KEY } from '@/services/indianStockService';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface MarketIndex {
  name: string;
  price: string;
  percentChange: string;
  netChange: string;
  isPositive: boolean;
}

const MarketStatus: React.FC = () => {
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMarketIndices = async () => {
      try {
        // Fetch indices data from both APIs
        const [popularIndices, sectorIndices] = await Promise.all([
          fetch('https://dev.indianapi.in/indices?exchange=NSE&index_type=POPULAR', {
            headers: {
              'Authorization': `Bearer ${INDIAN_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch('https://dev.indianapi.in/indices?exchange=NSE&index_type=SECTOR', {
            headers: {
              'Authorization': `Bearer ${INDIAN_API_KEY}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        if (!popularIndices.ok || !sectorIndices.ok) {
          throw new Error('Failed to fetch market indices');
        }

        const popularData = await popularIndices.json();
        const sectorData = await sectorIndices.json();

        // Filter for NIFTY 50 and INDIA VIX from popular indices
        const nifty50 = popularData.indices.find((idx: any) => idx.name === "NIFTY 50");
        const indiaVix = popularData.indices.find((idx: any) => idx.name === "India VIX");

        // Filter for BANK NIFTY from sector indices
        const bankNifty = sectorData.indices.find((idx: any) => idx.name === "NIFTY Bank");

        // Combine and format the indices
        const formattedIndices = [];
        
        if (nifty50) {
          formattedIndices.push({
            name: nifty50.name,
            price: nifty50.price,
            percentChange: nifty50.percentChange,
            netChange: nifty50.netChange,
            isPositive: parseFloat(nifty50.percentChange) >= 0
          });
        }
        
        if (bankNifty) {
          formattedIndices.push({
            name: bankNifty.name,
            price: bankNifty.price,
            percentChange: bankNifty.percentChange,
            netChange: bankNifty.netChange,
            isPositive: parseFloat(bankNifty.percentChange) >= 0
          });
        }
        
        if (indiaVix) {
          formattedIndices.push({
            name: indiaVix.name,
            price: indiaVix.price,
            percentChange: indiaVix.percentChange,
            netChange: indiaVix.netChange,
            isPositive: parseFloat(indiaVix.percentChange) >= 0
          });
        }

        setMarketIndices(formattedIndices);
      } catch (error) {
        console.error('Error fetching market indices:', error);
        // Fallback data in case of API failure
        setMarketIndices([
          { name: "NIFTY 50", price: "22,399.15", percentChange: "-0.61", netChange: "-136.7", isPositive: false },
          { name: "NIFTY Bank", price: "50,240.15", percentChange: "-0.54", netChange: "-270.85", isPositive: false },
          { name: "India VIX", price: "21.43", percentChange: "4.83", netChange: "0.99", isPositive: true }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarketIndices();
    // Refresh indices every 5 minutes
    const intervalId = setInterval(fetchMarketIndices, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex items-center space-x-8 text-sm overflow-x-auto scrollbar-none py-1 px-4 bg-sidebar/50">
      {isLoading ? (
        <div className="text-muted-foreground">Loading market data...</div>
      ) : (
        marketIndices.map((index) => (
          <div key={index.name} className="flex items-center space-x-2 whitespace-nowrap">
            <span className="font-medium">{index.name}</span>
            <span>{index.price}</span>
            <span className={index.isPositive ? "text-profit flex items-center" : "text-loss flex items-center"}>
              {index.percentChange}%
              {index.isPositive ? 
                <ArrowUpRight className="h-3 w-3 ml-0.5" /> : 
                <ArrowDownRight className="h-3 w-3 ml-0.5" />
              }
            </span>
          </div>
        ))
      )}
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
                <h1 className="ml-4 font-semibold text-xl">NeuraStock</h1>
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
