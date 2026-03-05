"use server";

import crypto from "crypto";

export async function generateSiteToken(): Promise<string> {
  return `wpdash_${crypto.randomBytes(32).toString("hex")}`;
}

export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyToken(token: string, hash: string): Promise<boolean> {
  const tokenHash = await hashToken(token);
  return tokenHash === hash;
}
