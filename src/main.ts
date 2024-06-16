import { WebsocketClient, WsMessageKlineFormatted, USDMClient } from "binance";
import { Watcher } from "./watcher";

const wsClient = new WebsocketClient({
  beautify: true,
});
const usdMClient = new USDMClient({});

async function main() {
  // notification when a connection is opened
  wsClient.on("open", (data) => {
    console.log("connection opened open:", data.wsKey, data.ws.target.url);
  });

  // receive formatted events with beautified keys. Any "known" floats stored in strings as parsed as floats.

  // read response to command sent via WS stream (e.g LIST_SUBSCRIPTIONS)
  wsClient.on("reply", (data) => {
    console.log("log reply: ", JSON.stringify(data, null, 2));
  });

  // receive notification when a ws connection is reconnecting automatically
  wsClient.on("reconnecting", (data) => {
    console.log("ws automatically reconnecting.... ", data?.wsKey);
  });

  // receive notification that a reconnection completed successfully (e.g use REST to check for missing data)
  wsClient.on("reconnected", (data) => {
    console.log("ws has reconnected ", data?.wsKey);
  });

  // Recommended: receive error events (e.g. first reconnection failed)
  wsClient.on("error", (data) => {
    console.log("ws saw error ", data?.wsKey);
  });

  const exchangeInfo = await usdMClient.getExchangeInfo();

  const tickerList = exchangeInfo.symbols
    .filter((symbol) => symbol.status === "TRADING")
    .filter((symbol) => symbol.quoteAsset === "USDT")
    .map(({ symbol }) => symbol);
  const watcher = new Watcher(tickerList);

  wsClient.on("formattedMessage", (data) => {
    const { kline } = data as WsMessageKlineFormatted;

    if (!kline.final) return;

    const { startTime, open, high, low, close, volume, interval, symbol } =
      kline;

    watcher.feed(symbol, close, new Date(startTime).toISOString());
  });

  watcher.on("surge-detected", ({ symbol, price, rate, timestamp }) => {
    console.log(
      `[${timestamp}] Surge detected: ${symbol} - ${price} - ${(
        rate * 100
      ).toFixed(2)}%`
    );
  });

  tickerList.forEach((symbol) => {
    wsClient.subscribeKlines(symbol, "1m", "usdm");
  });
}

main();
