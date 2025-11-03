"use client";

import { useMemo } from "react";
import { useBinanceSocket } from "@/hooks/useBinanceSocket";
import { useMockBinanceData } from "@/hooks/useMockBinanceData";

interface OrderBookRowProps {
  price: number;
  amount: number;
  total: number;
  maxTotal: number;
  side: "bid" | "ask";
}

function OrderBookRow({ price, amount, total, maxTotal, side }: OrderBookRowProps) {
  const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
  
  return (
    <div className="relative h-6 flex items-center hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors">
      {/* Background depth bar - using inline style for dynamic width */}
      <div
        className={`absolute top-0 h-full ${
          side === "bid" 
            ? "left-0 bg-green-500/10" 
            : "right-0 bg-red-500/10"
        }`}
        style={{ width: `${percentage}%` }}
      />
      {/* Content */}
      <div className="relative z-10 w-full grid grid-cols-3 gap-2 px-2 text-xs font-mono">
        <span className={side === "bid" ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
          {price.toFixed(2)}
        </span>
        <span className="text-right text-zinc-700 dark:text-zinc-300">{amount.toFixed(4)}</span>
        <span className="text-right text-zinc-500 dark:text-zinc-400">{total.toFixed(4)}</span>
      </div>
    </div>
  );
}

export default function OrderBook({ symbol = "btcusdt", useMock = true }: { symbol?: string; useMock?: boolean }) {
  // Use mock data by default since real Binance connection is being blocked
  const mockData = useMockBinanceData();
  const realData = useBinanceSocket(symbol, useMock);
  
  const { bids, asks, connected } = useMock ? mockData : realData;

  // Process and sort bids (highest first)
  const processedBids = useMemo(() => {
    const sorted = bids
      .map(([price, qty]) => ({
        price: parseFloat(price),
        amount: qty,
      }))
      .sort((a, b) => b.price - a.price)
      .slice(0, 15); // show top 15

    // Calculate cumulative totals
    let cumulative = 0;
    const withTotals = sorted.map((item) => {
      cumulative += item.amount;
      return { ...item, total: cumulative };
    });

    const maxTotal = cumulative;
    return { rows: withTotals, maxTotal };
  }, [bids]);

  // Process and sort asks (lowest first)
  const processedAsks = useMemo(() => {
    const sorted = asks
      .map(([price, qty]) => ({
        price: parseFloat(price),
        amount: qty,
      }))
      .sort((a, b) => a.price - b.price)
      .slice(0, 15); // show top 15

    // Calculate cumulative totals
    let cumulative = 0;
    const withTotals = sorted.map((item) => {
      cumulative += item.amount;
      return { ...item, total: cumulative };
    });

    const maxTotal = cumulative;
    return { rows: withTotals, maxTotal };
  }, [asks]);

  // Calculate spread
  const spread = useMemo(() => {
    const highestBid = processedBids.rows[0]?.price ?? 0;
    const lowestAsk = processedAsks.rows[0]?.price ?? 0;
    return lowestAsk && highestBid ? lowestAsk - highestBid : 0;
  }, [processedBids.rows, processedAsks.rows]);

  const spreadPercent = useMemo(() => {
    const lowestAsk = processedAsks.rows[0]?.price ?? 0;
    return lowestAsk && spread ? ((spread / lowestAsk) * 100) : 0;
  }, [spread, processedAsks.rows]);

  return (
    <div className="rounded-md border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Order Book</h2>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-xs text-zinc-500">
            {connected ? "Live" : "Disconnected"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Bids Column */}
        <div>
          <div className="mb-3 grid grid-cols-3 gap-2 px-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
            <span>Price (USDT)</span>
            <span className="text-right">Amount (BTC)</span>
            <span className="text-right">Total</span>
          </div>
          <div className="space-y-px border border-zinc-200 dark:border-zinc-700 rounded-md overflow-hidden">
            {processedBids.rows.length > 0 ? (
              processedBids.rows.map((row) => (
                <OrderBookRow
                  key={row.price}
                  price={row.price}
                  amount={row.amount}
                  total={row.total}
                  maxTotal={processedBids.maxTotal}
                  side="bid"
                />
              ))
            ) : (
              <div className="text-center text-xs text-zinc-500 py-4">
                Loading bids...
              </div>
            )}
          </div>
        </div>

        {/* Asks Column */}
        <div>
          <div className="mb-3 grid grid-cols-3 gap-2 px-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
            <span>Price (USDT)</span>
            <span className="text-right">Amount (BTC)</span>
            <span className="text-right">Total</span>
          </div>
          <div className="space-y-px border border-zinc-200 dark:border-zinc-700 rounded-md overflow-hidden">
            {processedAsks.rows.length > 0 ? (
              processedAsks.rows.map((row) => (
                <OrderBookRow
                  key={row.price}
                  price={row.price}
                  amount={row.amount}
                  total={row.total}
                  maxTotal={processedAsks.maxTotal}
                  side="ask"
                />
              ))
            ) : (
              <div className="text-center text-xs text-zinc-500 py-4">
                Loading asks...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spread Display */}
      <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-center">
        <div className="text-xs text-zinc-500">Spread</div>
        <div className="text-sm font-mono font-semibold">
          {spread.toFixed(2)} USDT{" "}
          <span className="text-xs text-zinc-500">
            ({spreadPercent.toFixed(3)}%)
          </span>
        </div>
      </div>
    </div>
  );
}
