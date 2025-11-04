"use client";

import { useMemo, useEffect, useState } from "react";
import { useBinanceSocket } from "@/hooks/useBinanceSocket";
import { useMockBinanceData } from "@/hooks/useMockBinanceData";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

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
    <div className="relative h-7 flex items-center group cursor-pointer transition-all duration-150 hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
      <div
        className={`absolute top-0 h-full transition-all duration-300 ${
          side === "bid" 
            ? "left-0 bg-gradient-to-r from-emerald-500/15 to-emerald-500/5" 
            : "right-0 bg-gradient-to-l from-rose-500/15 to-rose-500/5"
        }`}
        style={{ width: `${percentage}%` }}
      />
      
      <div className="relative z-10 w-full grid grid-cols-3 gap-4 px-4 text-sm font-mono">
        <span className={`truncate font-bold tabular-nums ${
          side === "bid" 
            ? "text-emerald-600 dark:text-emerald-400" 
            : "text-rose-600 dark:text-rose-400"
        }`}>
          {price.toFixed(2)}
        </span>
        <span className="text-right text-zinc-700 dark:text-zinc-300 truncate tabular-nums font-medium">
          {amount.toFixed(4)}
        </span>
        <span className="text-right text-zinc-600 dark:text-zinc-400 truncate tabular-nums">
          {total.toFixed(4)}
        </span>
      </div>
    </div>
  );
}

export default function OrderBook({ symbol = "btc/usdt", useMock = true }: { symbol?: string; useMock?: boolean }) {
  const mockData = useMockBinanceData();
  const realData = useBinanceSocket(symbol, useMock);
  
  const { bids, asks, connected } = useMock ? mockData : realData;

  // Responsive helper: treat screens smaller than Tailwind's `sm` (640px) as mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(typeof window !== "undefined" && window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const processedBids = useMemo(() => {
    const sorted = bids
      .map(([price, qty]) => ({
        price: parseFloat(price),
        amount: qty,
      }))
      .sort((a, b) => b.price - a.price)
      .slice(0, 15);

    let cumulative = 0;
    const withTotals = sorted.map((item) => {
      cumulative += item.amount;
      return { ...item, total: cumulative };
    });

    const maxTotal = cumulative;
    return { rows: withTotals, maxTotal };
  }, [bids]);

  const processedAsks = useMemo(() => {
    const sorted = asks
      .map(([price, qty]) => ({
        price: parseFloat(price),
        amount: qty,
      }))
      .sort((a, b) => a.price - b.price)
      .slice(0, 15);

    let cumulative = 0;
    const withTotals = sorted.map((item) => {
      cumulative += item.amount;
      return { ...item, total: cumulative };
    });

    const maxTotal = cumulative;
    return { rows: withTotals, maxTotal };
  }, [asks]);

  const spread = useMemo(() => {
    const highestBid = processedBids.rows[0]?.price ?? 0;
    const lowestAsk = processedAsks.rows[0]?.price ?? 0;
    return lowestAsk && highestBid ? lowestAsk - highestBid : 0;
  }, [processedBids.rows, processedAsks.rows]);

  const spreadPercent = useMemo(() => {
    const lowestAsk = processedAsks.rows[0]?.price ?? 0;
    return lowestAsk && spread ? ((spread / lowestAsk) * 100) : 0;
  }, [spread, processedAsks.rows]);

  // Prepare data for depth chart
  const depthChartData = useMemo(() => {
    const bidData = [...processedBids.rows]
      .reverse()
      .map(row => ({
        price: row.price,
        bidTotal: row.total,
        askTotal: 0
      }));

    const askData = processedAsks.rows.map(row => ({
      price: row.price,
      bidTotal: processedBids.maxTotal,
      askTotal: row.total
    }));

    return [...bidData, ...askData];
  }, [processedBids.rows, processedBids.maxTotal, processedAsks.rows]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 shadow-xl">
          <p className="text-xs font-bold text-zinc-900 dark:text-white mb-1.5 border-b border-zinc-200 dark:border-zinc-700 pb-1">
            ${payload[0].payload.price.toFixed(2)}
          </p>
          {payload[0].value > 0 && (
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                Bid: {payload[0].value.toFixed(4)} BTC
              </p>
            </div>
          )}
          {payload[1]?.value > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                Ask: {payload[1].value.toFixed(4)} BTC
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
      {/* Clean Professional Header */}
      <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Order Book
            </h2>
            <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
              {symbol.toUpperCase()}
            </span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <div className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {connected ? "Live" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      {/* Market Depth Chart - Clear Data Visualization */}
      <div className="px-3 py-3 sm:px-5 sm:py-4 bg-gradient-to-b from-zinc-50/50 to-white dark:from-zinc-900/50 dark:to-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
        <div className="mb-2 sm:mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
            Market Depth Chart
          </h3>
          <div className="flex items-center gap-2 sm:gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
              <span className="font-medium text-zinc-600 dark:text-zinc-400">Bids</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
              <span className="font-medium text-zinc-600 dark:text-zinc-400">Asks</span>
            </div>
          </div>
        </div>
        
        <div className="h-72 sm:h-64 w-full bg-gradient-to-br from-white via-zinc-50/50 to-white dark:from-zinc-900 dark:via-zinc-900/50 dark:to-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-2 sm:p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={depthChartData} margin={{ top: 10, right: 10, left: isMobile ? -16 : 6, bottom: 5 }}>
              <defs>
                <linearGradient id="bidGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="50%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="askGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4}/>
                  <stop offset="50%" stopColor="#f43f5e" stopOpacity={0.2}/>
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="price" 
                tick={{ fontSize: 11, fill: '#71717a', fontWeight: 500 }}
                tickFormatter={(value) => `${value.toFixed(0)}`}
                stroke="#d4d4d8"
                strokeWidth={1}
                tickLine={false}
                axisLine={{ stroke: '#e4e4e7', strokeWidth: 1 }}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#71717a', fontWeight: 500 }}
                tickFormatter={(value) => value.toFixed(1)}
                stroke="#d4d4d8"
                strokeWidth={1}
                tickLine={false}
                axisLine={{ stroke: '#e4e4e7', strokeWidth: 1 }}
                label={isMobile ? undefined : { value: 'BTC', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#71717a', fontWeight: 600 } }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#71717a', strokeWidth: 1, strokeDasharray: '5 5' }} />
              <Area 
                type="monotone" 
                dataKey="bidTotal" 
                stroke="#10b981" 
                strokeWidth={3}
                fill="url(#bidGradient)"
                animationDuration={800}
                animationEasing="ease-in-out"
              />
              <Area 
                type="monotone" 
                dataKey="askTotal" 
                stroke="#f43f5e" 
                strokeWidth={3}
                fill="url(#askGradient)"
                animationDuration={800}
                animationEasing="ease-in-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Order Book Tables - Clean Layout */}
      <div className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bids Section */}
          <div>
            <div className="mb-3 flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                Buy Orders (Bids)
              </h3>
              <span className="text-xs font-semibold text-zinc-500">
                Total: {processedBids.maxTotal.toFixed(2)} BTC
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 px-4 pb-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              <span>Price (USDT)</span>
              <span className="text-right">Amount (BTC)</span>
              <span className="text-right">Total</span>
            </div>
            
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900/50">
              <div className="max-h-96 overflow-y-auto">
                {processedBids.rows.length > 0 ? (
                  processedBids.rows.map((row, idx) => (
                    <OrderBookRow
                      key={`bid-${row.price}-${idx}`}
                      price={row.price}
                      amount={row.amount}
                      total={row.total}
                      maxTotal={processedBids.maxTotal}
                      side="bid"
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="h-8 w-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                    <p className="mt-3 text-sm text-zinc-500">Loading...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Asks Section */}
          <div>
            <div className="mb-3 flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400">
                Sell Orders (Asks)
              </h3>
              <span className="text-xs font-semibold text-zinc-500">
                Total: {processedAsks.maxTotal.toFixed(2)} BTC
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 px-4 pb-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              <span>Price (USDT)</span>
              <span className="text-right">Amount (BTC)</span>
              <span className="text-right">Total</span>
            </div>
            
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900/50">
              <div className="max-h-96 overflow-y-auto">
                {processedAsks.rows.length > 0 ? (
                  processedAsks.rows.map((row, idx) => (
                    <OrderBookRow
                      key={`ask-${row.price}-${idx}`}
                      price={row.price}
                      amount={row.amount}
                      total={row.total}
                      maxTotal={processedAsks.maxTotal}
                      side="ask"
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="h-8 w-8 rounded-full border-2 border-rose-500/30 border-t-rose-500 animate-spin" />
                    <p className="mt-3 text-sm text-zinc-500">Loading...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Spread Information - Clear Financial Metric */}
        <div className="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
              <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                Bid-Ask Spread
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
                ${spread.toFixed(2)}
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
              <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                Spread Percentage
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
                {spreadPercent.toFixed(3)}%
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
              <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                Market Status
              </div>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {processedBids.rows.length > 0 && processedAsks.rows.length > 0 ? 'Active Trading' : 'Loading...'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}