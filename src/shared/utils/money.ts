import { Decimal } from "decimal.js";
import { z } from "zod";

// fixed scale for the system currency; matches numeric(19, 4) in Postgres
export const MONEY_SCALE = 4;
export const MONEY_PRECISION = 19;
export const MAX_AMOUNT = new Decimal("100000000000000.0000"); // 10^14

const moneyRegex = /^-?\d+(\.\d+)?$/;

declare const MoneyBrand: unique symbol;
export type Money = string & { readonly [MoneyBrand]: never };

export class MoneyError extends Error {}

export function toDecimal(value: Money | string | number | Decimal): Decimal {
  if (value instanceof Decimal) return value;
  const d = new Decimal(value);
  if (!d.isFinite()) throw new MoneyError(`Non-finite money value: ${value}`);
  return d;
}

export function normalize(value: Money | string | number | Decimal): Money {
  return toDecimal(value).toFixed(MONEY_SCALE) as Money;
}

export function add(a: Money, b: Money): Money {
  return normalize(toDecimal(a).plus(toDecimal(b)));
}

export function sub(a: Money, b: Money): Money {
  return normalize(toDecimal(a).minus(toDecimal(b)));
}

export function neg(a: Money): Money {
  return normalize(toDecimal(a).neg());
}

export function isPositive(a: Money): boolean {
  return toDecimal(a).gt(0);
}

export function gte(a: Money, b: Money): boolean {
  return toDecimal(a).gte(toDecimal(b));
}

export function eq(a: Money, b: Money): boolean {
  return toDecimal(a).eq(toDecimal(b));
}

export const moneySchema = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === "number" ? v.toString() : v.trim()))
  .refine((v) => moneyRegex.test(v), { message: "Amount must be a numeric string" })
  .refine(
    (v) => {
      try {
        return new Decimal(v).decimalPlaces() <= MONEY_SCALE;
      } catch {
        return false;
      }
    },
    { message: `Amount cannot have more than ${MONEY_SCALE} decimal places` },
  )
  .refine((v) => new Decimal(v).gt(0), { message: "Amount must be positive" })
  .refine((v) => new Decimal(v).lte(MAX_AMOUNT), { message: "Amount exceeds maximum" })
  .transform((v) => normalize(v));
