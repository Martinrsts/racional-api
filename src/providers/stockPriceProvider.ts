export interface StockPriceProvider {
  getPrices(isns: string[]): Promise<Record<string, number>>;
}
