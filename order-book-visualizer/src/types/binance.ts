// Minimal Binance stream event types used in this app

// Aggregate Trade Stream: <symbol>@aggTrade
export interface AggTradeEvent {
  e: "aggTrade"; // Event type
  E: number; // Event time
  s: string; // Symbol
  a: number; // Aggregate trade ID
  p: string; // Price
  q: string; // Quantity
  f: number; // First trade ID
  l: number; // Last trade ID
  T: number; // Trade time
  m: boolean; // Is the buyer the market maker?
  M: boolean; // Ignore
}

// Diff. Depth Stream: <symbol>@depth
export interface DepthDiffEvent {
  e: "depthUpdate"; // Event type
  E: number; // Event time
  s: string; // Symbol
  U: number; // First update ID in event
  u: number; // Final update ID in event
  pu?: number; // Final update Id in last stream(ie `u` in last stream)
  b: Array<[string, string]>; // Bids to be updated [price, qty]
  a: Array<[string, string]>; // Asks to be updated [price, qty]
}
