import { z } from "zod";

export const createSiteSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  url: z
    .string()
    .url("Invalid URL")
    .refine((url) => url.startsWith("http"), "URL must start with http"),
});

export const updateSiteSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  url: z.string().url().optional(),
});
