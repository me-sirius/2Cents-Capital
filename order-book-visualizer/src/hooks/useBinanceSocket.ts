"use client";

import { useEffect, useRef, useState } from "react";
import type { AggTradeEvent, DepthDiffEvent } from "@/types/binance";

export type PriceLevel = [price: string, qty: number];

export interface TradeItem {
  id: number;
  price: number;
  qty: number;
  time: number;
  side: "buy" | "sell";
}

export interface SocketState {
  bids: PriceLevel[];
  asks: PriceLevel[];
  trades: TradeItem[];
  connected: boolean;
  error?: string;
}

export function useBinanceSocket(symbol: string = "btcusdt", useMock: boolean = false) {
  const depthWsRef = useRef<WebSocket | null>(null);
  const tradeWsRef = useRef<WebSocket | null>(null);
  const bidsMapRef = useRef<Map<string, number>>(new Map());
  const asksMapRef = useRef<Map<string, number>>(new Map());
  const tradesRef = useRef<TradeItem[]>([]);
  const updateIntervalRef = useRef<number | null>(null);
  const failureCountRef = useRef<number>(0);

  const [state, setState] = useState<SocketState>({
    bids: [],
    asks: [],
    trades: [],
    connected: false,
  });

  useEffect(() => {
    // Skip real connection if mock mode is enabled
    if (useMock) {
      console.log("🧪 Using mock data (real Binance connection disabled)");
      return;
    }

    let isMounted = true;
    let depthConnected = false;
    let tradeConnected = false;

    function updateConnectionStatus() {
      const isConnected = depthConnected && tradeConnected;
      if (isMounted) {
        setState((s) => ({ ...s, connected: isConnected }));
      }
    }

    function handleAggTrade(data: AggTradeEvent) {
      const price = parseFloat(data.p);
      const qty = parseFloat(data.q);
      const time = data.T;
      const side: "buy" | "sell" = data.m ? "sell" : "buy";

      const trade: TradeItem = {
        id: data.a,
        price,
        qty,
        time,
        side,
      };

      tradesRef.current.unshift(trade);
      if (tradesRef.current.length > 50) {
        tradesRef.current = tradesRef.current.slice(0, 50);
      }
    }

    function handleDepthUpdate(data: DepthDiffEvent) {
      for (const [price, qtyStr] of data.b) {
        const qty = parseFloat(qtyStr);
        if (qty === 0) {
          bidsMapRef.current.delete(price);
        } else {
          bidsMapRef.current.set(price, qty);
        }
      }

      for (const [price, qtyStr] of data.a) {
        const qty = parseFloat(qtyStr);
        if (qty === 0) {
          asksMapRef.current.delete(price);
        } else {
          asksMapRef.current.set(price, qty);
        }
      }
    }

    function connectDepth() {
      const url = `wss://data-stream.binance.com/ws/${symbol}@depth`;
      console.log("📊 Connecting to depth stream:", url);
      
      const ws = new WebSocket(url);
      depthWsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ Depth stream connected");
        depthConnected = true;
        updateConnectionStatus();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.e === "depthUpdate") {
            handleDepthUpdate(data as DepthDiffEvent);
          }
        } catch (error) {
          console.error("Error parsing depth message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("❌ Depth WebSocket error:", error);
        failureCountRef.current += 1;
        
        if (failureCountRef.current >= 3) {
          console.warn("⚠️ Multiple connection failures detected. Consider using mock data mode.");
        }
      };

      ws.onclose = () => {
        console.log("Depth stream closed");
        depthConnected = false;
        updateConnectionStatus();
        depthWsRef.current = null;

        if (isMounted && failureCountRef.current < 5) {
          setTimeout(() => {
            if (isMounted) connectDepth();
          }, 3000);
        } else if (failureCountRef.current >= 5) {
          console.error("❌ Too many connection failures. Stopping reconnection attempts.");
          setState((s) => ({ ...s, error: "Unable to connect to Binance. Network may be blocking WebSocket connections." }));
        }
      };
    }

    function connectTrade() {
      const url = `wss://data-stream.binance.com/ws/${symbol}@aggTrade`;
      console.log("💰 Connecting to trade stream:", url);
      
      const ws = new WebSocket(url);
      tradeWsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ Trade stream connected");
        tradeConnected = true;
        updateConnectionStatus();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.e === "aggTrade") {
            handleAggTrade(data as AggTradeEvent);
          }
        } catch (error) {
          console.error("Error parsing trade message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("❌ Trade WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("Trade stream closed");
        tradeConnected = false;
        updateConnectionStatus();
        tradeWsRef.current = null;

        if (isMounted && failureCountRef.current < 5) {
          setTimeout(() => {
            if (isMounted) connectTrade();
          }, 3000);
        }
      };
    }

    connectDepth();
    connectTrade();

    updateIntervalRef.current = window.setInterval(() => {
      if (isMounted) {
        const bidsArray: PriceLevel[] = Array.from(bidsMapRef.current.entries());
        const asksArray: PriceLevel[] = Array.from(asksMapRef.current.entries());
        const tradesSnapshot = [...tradesRef.current];

        setState((s) => ({
          ...s,
          bids: bidsArray,
          asks: asksArray,
          trades: tradesSnapshot,
        }));
      }
    }, 200);

    return () => {
      isMounted = false;
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      if (depthWsRef.current) {
        depthWsRef.current.close();
        depthWsRef.current = null;
      }
      if (tradeWsRef.current) {
        tradeWsRef.current.close();
        tradeWsRef.current = null;
      }
    };
  }, [symbol]);

  return state;
}
