import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const zipPath = path.join(process.cwd(), "wp-bridge-plugin.zip");
  if (!fs.existsSync(zipPath)) {
    return NextResponse.json({ error: "Plugin file not found" }, { status: 404 });
  }
  const fileBuffer = fs.readFileSync(zipPath);
  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="wp-dash-bridge.zip"',
    },
  });
}
