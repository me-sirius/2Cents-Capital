"use client";

import { useEffect, useRef, useState } from "react";
import type { PriceLevel, TradeItem, SocketState } from "./useBinanceSocket";

// Mock data generator for development when real Binance connection fails
export function useMockBinanceData() {
  const bidsMapRef = useRef<Map<string, number>>(new Map());
  const asksMapRef = useRef<Map<string, number>>(new Map());
  const tradesRef = useRef<TradeItem[]>([]);
  const updateIntervalRef = useRef<number | null>(null);
  const dataIntervalRef = useRef<number | null>(null);

  const [state, setState] = useState<SocketState>({
    bids: [],
    asks: [],
    trades: [],
    connected: true, // Mock is always "connected"
  });

  useEffect(() => {
    let isMounted = true;
    let tradeId = 1;

    // Initialize with some base prices around BTC/USDT price
    const basePrice = 95000;
    
    // Initialize order book with mock data
    for (let i = 0; i < 20; i++) {
      const bidPrice = (basePrice - i * 10).toFixed(2);
      const askPrice = (basePrice + i * 10).toFixed(2);
      bidsMapRef.current.set(bidPrice, Math.random() * 2 + 0.1);
      asksMapRef.current.set(askPrice, Math.random() * 2 + 0.1);
    }

    // Simulate real-time updates
    dataIntervalRef.current = window.setInterval(() => {
      if (!isMounted) return;

      // Update a random bid
      const randomBidOffset = Math.floor(Math.random() * 20);
      const bidPrice = (basePrice - randomBidOffset * 10).toFixed(2);
      const bidQty = Math.random() * 2 + 0.1;
      bidsMapRef.current.set(bidPrice, bidQty);

      // Update a random ask
      const randomAskOffset = Math.floor(Math.random() * 20);
      const askPrice = (basePrice + randomAskOffset * 10).toFixed(2);
      const askQty = Math.random() * 2 + 0.1;
      asksMapRef.current.set(askPrice, askQty);

      // Add a random trade
      const isBuy = Math.random() > 0.5;
      const tradePrice = basePrice + (Math.random() - 0.5) * 100;
      const trade: TradeItem = {
        id: tradeId++,
        price: tradePrice,
        qty: Math.random() * 0.5 + 0.01,
        time: Date.now(),
        side: isBuy ? "buy" : "sell",
      };
      tradesRef.current.unshift(trade);
      if (tradesRef.current.length > 50) {
        tradesRef.current = tradesRef.current.slice(0, 50);
      }
    }, 500); // Update every 500ms

    // Update UI state
    updateIntervalRef.current = window.setInterval(() => {
      if (isMounted) {
        const bidsArray: PriceLevel[] = Array.from(bidsMapRef.current.entries());
        const asksArray: PriceLevel[] = Array.from(asksMapRef.current.entries());
        const tradesSnapshot = [...tradesRef.current];

        setState({
          bids: bidsArray,
          asks: asksArray,
          trades: tradesSnapshot,
          connected: true,
        });
      }
    }, 200);

    return () => {
      isMounted = false;
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
      if (dataIntervalRef.current) clearInterval(dataIntervalRef.current);
    };
  }, []);

  return state;
}
