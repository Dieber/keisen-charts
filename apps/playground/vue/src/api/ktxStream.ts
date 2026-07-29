import type { KlineBar, OnSubscribeFn } from "@keisen-charts/vue";

import { resolutionToKtxTimeFrame } from "./resolution";

const MARKET = "lpc";
const KTX_STREAM_URL = "wss://m-stream.ktx.com/";

type KtxStreamMessage = {
  stream?: string;
  data?: {
    e?: unknown[][];
  };
};

type StreamHandler = (bars: KlineBar[]) => void;

const normalizeKtxBars = (rows: unknown[][]): KlineBar[] =>
  rows
    .map((row) => ({
      t: Number(row[0]),
      o: Number(row[1]),
      h: Number(row[2]),
      l: Number(row[3]),
      c: Number(row[4]),
      v: Number(row[5]),
    }))
    .filter((bar) => Number.isFinite(bar.t))
    .sort((a, b) => a.t - b.t);

const buildStreamName = (symbol: string, timeFrame: string): string =>
  `${MARKET}.${symbol}.candles.${timeFrame}`;

/**
 * Shared KTX WebSocket: one connection, many stream subscriptions.
 * Period / symbol switches only SUBSCRIBE / UNSUBSCRIBE — never reopen the socket.
 */
const createSharedKtxConnection = (url: string) => {
  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  const handlersByStream = new Map<string, Set<StreamHandler>>();

  const send = (method: "SUBSCRIBE" | "UNSUBSCRIBE", stream: string) => {
    if (ws?.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ method, params: [stream] }));
  };

  const ensureConnected = () => {
    if (
      ws &&
      (ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    ws = new WebSocket(url);

    ws.onopen = () => {
      for (const stream of handlersByStream.keys()) {
        send("SUBSCRIBE", stream);
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(String(event.data)) as KtxStreamMessage;
        const stream = message.stream;
        if (!stream || !message.data?.e) return;

        const handlers = handlersByStream.get(stream);
        if (!handlers?.size) return;

        const bars = normalizeKtxBars(message.data.e);
        for (const handler of handlers) {
          handler([bars[bars.length - 1]!]);
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      ws = null;
      // Reconnect if any subscription is still active.
      if (handlersByStream.size === 0) return;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        ensureConnected();
      }, 1000);
    };
  };

  const subscribe = (stream: string, handler: StreamHandler): (() => void) => {
    let handlers = handlersByStream.get(stream);
    const isFirst = !handlers || handlers.size === 0;

    if (!handlers) {
      handlers = new Set();
      handlersByStream.set(stream, handlers);
    }
    handlers.add(handler);

    ensureConnected();
    if (isFirst) {
      send("SUBSCRIBE", stream);
    }

    return () => {
      const current = handlersByStream.get(stream);
      if (!current) return;

      current.delete(handler);
      if (current.size > 0) return;

      handlersByStream.delete(stream);
      send("UNSUBSCRIBE", stream);
    };
  };

  return { subscribe };
};

const sharedConnection = createSharedKtxConnection(KTX_STREAM_URL);

export const ktxOnSubscribe: OnSubscribeFn = ({ resolution, symbol }, emit) => {
  if (!symbol) return;

  const timeFrame = resolutionToKtxTimeFrame(resolution);
  const streamName = buildStreamName(symbol, timeFrame);

  return sharedConnection.subscribe(streamName, (bars) => {
    for (const bar of bars) {
      emit.bar(bar);
    }
  });
};
