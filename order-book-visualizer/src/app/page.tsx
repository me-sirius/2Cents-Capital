"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const OrderBook = dynamic(() => import("@/components/OrderBook"), { ssr: false });
const RecentTrades = dynamic(() => import("@/components/RecentTrades"), { ssr: false });

export default function Home() {
  const [useMockData, setUseMockData] = useState(false);
  const [connectionAttempted, setConnectionAttempted] = useState(false);

  useEffect(() => {
    // Try to detect if WebSocket connections are possible
    const testConnection = async () => {
      try {
        const ws = new WebSocket("wss://data-stream.binance.com/ws/btcusdt@depth");
        
        const timeout = setTimeout(() => {
          ws.close();
          console.log("⚠️ Real connection timeout, switching to mock data");
          setUseMockData(true);
          setConnectionAttempted(true);
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timeout);
          console.log("✅ Real connection successful!");
          ws.close();
          setUseMockData(false);
          setConnectionAttempted(true);
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          console.log("❌ Real connection failed, switching to mock data");
          setUseMockData(true);
          setConnectionAttempted(true);
        };
      } catch (error) {
        console.log("❌ WebSocket not supported or blocked, using mock data");
        setUseMockData(true);
        setConnectionAttempted(true);
      }
    };

    testConnection();
  }, []);

  return (
    <main className="min-h-screen w-full max-w-6xl mx-auto p-4 sm:p-6 md:p-8">
      <header className="mb-6">
        <div className="flex items-baseline justify-between mb-2">
          <h1 className="text-2xl font-bold">
            <span className="text-orange-500">BTC/USDT</span> Order Book Visualizer
          </h1>
          <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">Binance</span>
        </div>
        {connectionAttempted && useMockData && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 text-sm">
            <span className="font-medium text-yellow-800 dark:text-yellow-200">🧪 Demo Mode:</span>
            <span className="text-yellow-700 dark:text-yellow-300 ml-2">
              Using simulated data. Real Binance WebSocket connection is unavailable (may be blocked by network/firewall).
            </span>
          </div>
        )}
        {connectionAttempted && !useMockData && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3 text-sm">
            <span className="font-medium text-green-800 dark:text-green-200">🔴 Live Mode:</span>
            <span className="text-green-700 dark:text-green-300 ml-2">
              Connected to real Binance WebSocket streams.
            </span>
          </div>
        )}
        {!connectionAttempted && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 text-sm">
            <span className="font-medium text-blue-800 dark:text-blue-200">🔄 Testing connection...</span>
          </div>
        )}
      </header>
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OrderBook useMock={useMockData} />
        </div>
        <aside className="lg:col-span-1">
          <RecentTrades useMock={useMockData} />
        </aside>
      </section>
    </main>
  );
}
