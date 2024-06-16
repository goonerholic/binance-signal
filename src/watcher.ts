import EventEmitter2 from "eventemitter2";
import { FixedSizeArray } from "./utils";

export type WatcherOptions = {
  priceChangeRateToWatch?: number;
  lookBackLength?: number;
};

const DEFAULT_OPTIONS = {
  priceChangeRateToWatch: 0.005,
  lookBackLength: 3,
};

export class Watcher extends EventEmitter2 {
  private _tickerMap: Map<string, FixedSizeArray<number>>;
  private _priceChangeRateToWatch: number;

  constructor(tickers: string[], options?: WatcherOptions) {
    super();

    const ressolvedOptions = { ...DEFAULT_OPTIONS, ...(options || {}) };

    this._priceChangeRateToWatch = ressolvedOptions.priceChangeRateToWatch;

    this._tickerMap = new Map();

    tickers.forEach((ticker) => {
      this._tickerMap.set(
        ticker,
        new FixedSizeArray(ressolvedOptions.lookBackLength)
      );
    });

    this.on("new-price", (ticker, timestamp) => {
      this.handleNewPrice(ticker, timestamp);
    });
  }

  public feed(ticker: string, price: number, timestamp: string) {
    const array = this._tickerMap.get(ticker);

    if (!array) return;

    array.push(price);

    this.emit("new-price", ticker, timestamp);
  }

  private handleNewPrice(ticker: string, timestamp: string) {
    const array = this._tickerMap.get(ticker);

    if (!array) return;

    const head = array.head;
    const tail = array.tail;

    if (!head || !tail) return;

    const priceChangeRate = (tail - head) / head;
    if (Math.abs(priceChangeRate) > this._priceChangeRateToWatch) {
      this.emit("surge-detected", {
        timestamp,
        symbol: ticker,
        price: tail,
        rate: priceChangeRate,
      });
    }
  }

  public get tickerMap() {
    return Object.fromEntries(this._tickerMap);
  }
}
