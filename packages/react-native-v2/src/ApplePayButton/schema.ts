import { z } from "zod";

export const errorSchema = z.object({
  code: z.string(),
  detail: z.string(),
});

export type ApplePayError = z.infer<typeof errorSchema>;

export const expirySchema = z.object({
  month: z.string(),
  year: z.string(),
});

export const networkTokenSchema = z.object({
  number: z.string(),
  expiry: expirySchema,
  rawExpiry: z.string(),
  tokenServiceProvider: z.string(),
});

export const cardSchema = z.object({
  brand: z.string().optional(),
  funding: z.string().optional(),
  segment: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().optional(),
  issuer: z.string().optional(),
});

export const responseSchema = z.object({
  networkToken: networkTokenSchema,
  card: cardSchema,
  cryptogram: z.string(),
  eci: z.string().optional(),
  paymentDataType: z.string(),
  deviceManufacturerIdentifier: z.string(),
});

export type ApplePayResponse = z.infer<typeof responseSchema>;
