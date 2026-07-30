import type { KlineBar, OnSubscribeFn } from "@keisen-charts/vue";

import { resolutionToBinanceInterval } from "./resolution";

/** Binance spot combined-capable WS; live SUBSCRIBE / UNSUBSCRIBE on one socket. */
const BINANCE_STREAM_URL = "wss://stream.binance.com:9443/ws";

type BinanceKlinePayload = {
  e?: string;
  s?: string;
  k?: {
    t: number;
    o: string;
    h: string;
    l: string;
    c: string;
    v: string;
    i: string;
  };
};

type StreamHandler = (bar: KlineBar) => void;

const buildStreamName = (symbol: string, interval: string): string =>
  `${symbol.toLowerCase()}@kline_${interval}`;

const barFromKline = (k: NonNullable<BinanceKlinePayload["k"]>): KlineBar => ({
  t: k.t,
  o: +k.o,
  h: +k.h,
  l: +k.l,
  c: +k.c,
  v: +k.v,
});

/**
 * Shared Binance WebSocket: one connection, many kline subscriptions.
 * Period / symbol switches only SUBSCRIBE / UNSUBSCRIBE — never reopen the socket.
 */
const createSharedBinanceConnection = (url: string) => {
  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let nextId = 1;
  const handlersByStream = new Map<string, Set<StreamHandler>>();

  const send = (method: "SUBSCRIBE" | "UNSUBSCRIBE", stream: string) => {
    if (ws?.readyState !== WebSocket.OPEN) return;
    ws.send(
      JSON.stringify({
        method,
        params: [stream],
        id: nextId++,
      }),
    );
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
        const message = JSON.parse(
          String(event.data),
        ) as BinanceKlinePayload;
        // Ignore SUBSCRIBE/UNSUBSCRIBE acks (`{ result, id }`)
        if (message.e !== "kline" || !message.k || !message.s) return;

        const stream = buildStreamName(message.s, message.k.i);
        const handlers = handlersByStream.get(stream);
        if (!handlers?.size) return;

        const bar = barFromKline(message.k);
        for (const handler of handlers) {
          handler(bar);
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      ws = null;
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

const sharedConnection = createSharedBinanceConnection(BINANCE_STREAM_URL);

export const binanceOnSubscribe: OnSubscribeFn = (
  { resolution, symbol },
  emit,
) => {
  if (!symbol) return;

  const interval = resolutionToBinanceInterval(resolution);
  const streamName = buildStreamName(symbol, interval);

  return sharedConnection.subscribe(streamName, (bar) => {
    emit.bar(bar);
  });
};
