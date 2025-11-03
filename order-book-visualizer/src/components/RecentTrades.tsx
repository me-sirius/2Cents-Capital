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

  const textColor = side === "buy" ? "text-green-500 font-medium" : "text-red-500 font-medium";
  const flashBg = isNew 
    ? (side === "buy" ? "bg-green-500/20" : "bg-red-500/20")
    : "";
  const transition = "transition-all duration-500";

  return (
    <div className={`grid grid-cols-3 gap-1 sm:gap-2 text-[10px] sm:text-xs font-mono py-1 sm:py-1.5 px-1 sm:px-2 rounded ${flashBg} ${transition}`}>
      <span className={`${textColor} truncate`}>{price.toFixed(2)}</span>
      <span className="text-right text-zinc-700 dark:text-zinc-300 truncate">{qty.toFixed(4)}</span>
      <span className="text-right text-zinc-500 dark:text-zinc-400 truncate">{timeStr}</span>
    </div>
  );
}

export default function RecentTrades({ symbol = "btcusdt", useMock = true }: { symbol?: string; useMock?: boolean }) {
  // Use mock data by default since real Binance connection is being blocked
  const mockData = useMockBinanceData();
  const realData = useBinanceSocket(symbol, useMock);
  
  const { trades } = useMock ? mockData : realData;
  const [highlightedIds, setHighlightedIds] = useState<Set<number>>(new Set());
  const prevTradesRef = useRef<number[]>([]);

  // Detect new trades and highlight them
  useEffect(() => {
    if (trades.length > 0) {
      const currentIds = trades.map((t) => t.id);
      const newIds = currentIds.filter((id) => !prevTradesRef.current.includes(id));

      if (newIds.length > 0) {
        setHighlightedIds(new Set(newIds));

        // Remove highlight after 500ms
        const timer = setTimeout(() => {
          setHighlightedIds(new Set());
        }, 500);

        prevTradesRef.current = currentIds;

        return () => clearTimeout(timer);
      }
    }
  }, [trades]);

  return (
    <div className="rounded-md border border-zinc-200 dark:border-zinc-800 p-2 sm:p-3 md:p-4">
      <div className="mb-2 sm:mb-3 md:mb-4 flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-semibold">Recent Trades</h2>
        <span className="text-[10px] sm:text-xs text-zinc-500">Last 50</span>
      </div>

      <div className="mb-2 sm:mb-3 grid grid-cols-3 gap-1 sm:gap-2 px-1 sm:px-2 text-[10px] sm:text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
        <span className="truncate">Price</span>
        <span className="text-right truncate">Amount</span>
        <span className="text-right truncate">Time</span>
      </div>

      <div className="max-h-[300px] sm:max-h-[400px] md:h-96 overflow-y-auto space-y-px border border-zinc-200 dark:border-zinc-700 rounded-md p-1">
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
          <div className="text-center text-[10px] sm:text-xs text-zinc-500 py-3 sm:py-4">
            Loading trades...
          </div>
        )}
      </div>
    </div>
  );
}
