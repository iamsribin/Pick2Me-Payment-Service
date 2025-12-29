export async function getFxRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;
  if (from === 'INR' && to === 'gbp') return 0.009; 
  if (from === 'INR' && to === 'usd') return 0.012; 
  if (from === 'GBP' && to === 'usd') return 1.27;
  throw new Error(`FX rate not available for ${from} → ${to}`);
}

export async function convertCurrency(amount: bigint, from: string, to: string): Promise<bigint> {
  if (amount < 0n) throw new Error('Amount must be non-negative');
  if (from.toLowerCase() === to.toLowerCase()) return amount;

  const rate = await getFxRate(from.toUpperCase(), to.toLowerCase()); 
  if (!rate || rate <= 0) throw new Error('Invalid FX rate');

  const SCALE = 100_000_000n;
  const rateScaled = BigInt(Math.round(rate * Number(SCALE))); 

  const converted = (amount * rateScaled) / SCALE;
  return converted;
}

import { stripe } from '../config/stripe'; 
export async function getAvailableBalanceForCurrency(currency: string): Promise<bigint> {
  const balance = await stripe.balance.retrieve();
  const entry = (balance.available || []).find((e: any) => e.currency === currency.toLowerCase());
  return entry ? BigInt(entry.amount) : 0n;
}
