"use client";

import { useEffect, useRef, useState } from "react";
import { useBinanceSocket } from "@/hooks/useBinanceSocket";
import { useMockBinanceData } from "@/hooks/useMockBinanceData";

interface TradeRowProps {
  price: number;
  qty: number;
  time: number;
  side: "buy" | "sell";
  isNew: boolean;
}

function TradeRow({ price, qty, time, side, isNew }: TradeRowProps) {
  const timeStr = new Date(time).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <div className={`relative h-8 flex items-center group transition-all duration-500 rounded-md ${
      isNew 
        ? (side === "buy" ? "bg-emerald-500/20 shadow-sm" : "bg-rose-500/20 shadow-sm")
        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
    }`}>
      {/* Side indicator bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-md ${
        side === "buy" ? "bg-emerald-500" : "bg-rose-500"
      }`} />
      
      <div className="w-full grid grid-cols-3 gap-4 px-4 text-sm font-mono">
        <span className={`truncate font-bold tabular-nums ${
          side === "buy" 
            ? "text-emerald-600 dark:text-emerald-400" 
            : "text-rose-600 dark:text-rose-400"
        }`}>
          {price.toFixed(2)}
        </span>
        <span className="text-right text-zinc-700 dark:text-zinc-300 truncate tabular-nums font-medium">
          {qty.toFixed(4)}
        </span>
        <span className="text-right text-zinc-600 dark:text-zinc-400 truncate tabular-nums text-xs">
          {timeStr}
        </span>
      </div>
    </div>
  );
}

export default function RecentTrades({ symbol = "btcusdt", useMock = true }: { symbol?: string; useMock?: boolean }) {
  const mockData = useMockBinanceData();
  const realData = useBinanceSocket(symbol, useMock);
  
  const { trades } = useMock ? mockData : realData;
  const [highlightedIds, setHighlightedIds] = useState<Set<number>>(new Set());
  const prevTradesRef = useRef<number[]>([]);

  useEffect(() => {
    if (trades.length > 0) {
      const currentIds = trades.map((t) => t.id);
      const newIds = currentIds.filter((id) => !prevTradesRef.current.includes(id));

      if (newIds.length > 0) {
        setHighlightedIds(new Set(newIds));

        const timer = setTimeout(() => {
          setHighlightedIds(new Set());
        }, 500);

        prevTradesRef.current = currentIds;

        return () => clearTimeout(timer);
      }
    }
  }, [trades]);

  // Calculate statistics
  const stats = {
    buyCount: trades.filter(t => t.side === "buy").length,
    sellCount: trades.filter(t => t.side === "sell").length,
    totalVolume: trades.reduce((sum, t) => sum + t.qty, 0),
    avgPrice: trades.length > 0 ? trades.reduce((sum, t) => sum + t.price, 0) / trades.length : 0,
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Recent Trades
            </h2>
            <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
              {symbol.toUpperCase()}
            </span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Last 50 Trades
            </span>
          </div>
        </div>
      </div>

      {/* Trade Statistics */}
      <div className="px-5 py-3 bg-gradient-to-b from-zinc-50/50 to-white dark:from-zinc-900/50 dark:to-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Buy Trades
            </div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {stats.buyCount}
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Sell Trades
            </div>
            <div className="text-lg font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              {stats.sellCount}
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Total Volume
            </div>
            <div className="text-lg font-bold text-zinc-900 dark:text-white tabular-nums">
              {stats.totalVolume.toFixed(2)}
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Avg Price
            </div>
            <div className="text-lg font-bold text-zinc-900 dark:text-white tabular-nums">
              ${stats.avgPrice.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Trade List */}
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
            Trade History
          </h3>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-medium text-zinc-600 dark:text-zinc-400">Buy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-rose-500" />
              <span className="font-medium text-zinc-600 dark:text-zinc-400">Sell</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 px-4 pb-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          <span>Price (USDT)</span>
          <span className="text-right">Amount (BTC)</span>
          <span className="text-right">Time</span>
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900/50">
          <div className="max-h-96 overflow-y-auto space-y-0.5 p-1">
            {trades.length > 0 ? (
              trades.map((trade) => (
                <TradeRow
                  key={`${trade.id}-${trade.time}`}
                  price={trade.price}
                  qty={trade.qty}
                  time={trade.time}
                  side={trade.side}
                  isNew={highlightedIds.has(trade.id)}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-8 w-8 rounded-full border-2 border-zinc-300 dark:border-zinc-700 border-t-emerald-500 animate-spin" />
                <p className="mt-3 text-sm text-zinc-500">Loading trades...</p>
              </div>
            )}
          </div>
        </div>

        {/* Trade Flow Indicator */}
        {trades.length > 0 && (
          <div className="mt-4 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Trade Flow
              </span>
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                {stats.buyCount > stats.sellCount ? 'Buy Pressure' : stats.sellCount > stats.buyCount ? 'Sell Pressure' : 'Balanced'}
              </span>
            </div>
            <div className="relative h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${(stats.buyCount / trades.length) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-xs font-medium">
              <span className="text-emerald-600 dark:text-emerald-400">
                {((stats.buyCount / trades.length) * 100).toFixed(1)}%
              </span>
              <span className="text-rose-600 dark:text-rose-400">
                {((stats.sellCount / trades.length) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}