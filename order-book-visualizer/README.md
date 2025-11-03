## Order Book Visualizer

Real-time Binance order book and recent trades visualizer built with Next.js and TypeScript.

### Scripts

- dev: start local development server
- build: build for production
- start: run production server

### Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000

### Summary:

1. Connect to a live data feed from Binance (a major crypto exchange).

2. Build a component to show all current "buy" and "sell" offers (the "Order Book").

3. Build another component to show all "completed" trades as they happen (the "Recent Trades").

#### Part 1: Getting the Live Data (The WebSocket)
#### Part 2: The Order Book (The "Current Offers")
#### Part 3: The Recent Trades (The "Completed Sales")

# Core Files

They map directly to the three parts of the assignment.

* src/hooks/useBinanceSocket.ts

    * **What it's for (Function):** This is Part 1 of your assignment. This file will contain all the logic for connecting to the Binance WebSocket API, subscribing to the data streams (aggTrade and depth), listening for messages, and handling (re)connections.

    * **Why it's created:** You put this in a "hook" so that your components (OrderBook and RecentTrades) don't need to know how the connection works. They can just "use" the hook and get the live data.

* src/components/OrderBook.tsx

    * **What it's for (Function):** This is Part 2. It will import data from your useBinanceSocket hook and be responsible only for managing the state of the bids and asks (adding, updating, removing price levels). It will also handle all the visual layout (the two columns, the spread, and the depth chart).

    * **Why it's created:** This is the main visual component of the project.

* src/components/RecentTrades.tsx

    * **What it's for (Function):** This is Part 3. It will also import data from your useBinanceSocket hook but will only look at the "trade" messages. It will manage a list of the 50 most recent trades and handle the "flash" effect for new trades.

    * **Why it's created:** This is the second visual component, showing the log of completed sales.

* src/types/binance.ts

    * **What it's for (Function):** This file will define the shape of the data you get from Binance. For example, you'll create a TypeScript type or interface for an OrderBookDelta and a TradeMessage.

    * **Why it's created:** This is a fantastic practice. It gives you auto-completion in your editor and prevents bugs by ensuring you don't accidentally, for example, try to read trade.price when the real data field is trade.p.

### NOTE:
If your network is blocking the wss:// protocol to binance.com before the connection can even start. As a result, the app cannot connect to the real Binance WebSocket API.
There are many ways to work around this, such as using a VPN, proxy, or different network. However, to facilitate development and testing, a mock data hook has been provided that simulates the Binance WebSocket data streams. You can use this mock data hook by default in the RecentTrades component, allowing you to see the functionality without needing a live connection. There is also an automatic fallback to mock data if the real connection fails.

The strategy is:

1. Created a new, fake hook called useMockBinanceSocket.ts.

2. This hook will not connect to any API. Instead, it will use setInterval to pretend to receive data, generating random trades and deltas.

3. The OrderBook and RecentTrades components won't know the difference! They will just receive the fake data.

4. This allows us to build and test the entire UI (Part 2 and 3) perfectly.

### Next steps

- Implement Binance WebSocket hook and state aggregation
- Render live bids/asks and recent trades
- Add depth visualization and spread
