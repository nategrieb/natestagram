#!/usr/bin/env node
/**
 * Backfill width/height for post_assets rows that have null dimensions.
 *
 * Usage:
 *   node scripts/backfill-dimensions.mjs
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

// Load .env.local
const envPath = path.join(process.cwd(), ".env.local");
const envText = await fs.readFile(envPath, "utf8").catch(() => "");
for (const line of envText.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
  if (!process.env[key]) process.env[key] = val;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

// Fetch all assets with missing dimensions or dominant_color
const { data: assets, error } = await supabase
  .from("post_assets")
  .select("id, storage_path")
  .or("width.is.null,height.is.null,dominant_color.is.null");

if (error) {
  console.error("Failed to fetch assets:", error.message);
  process.exit(1);
}

console.log(`Found ${assets.length} assets needing dimension backfill.`);

let updated = 0;
let failed = 0;

for (const asset of assets) {
  const { data: urlData } = supabase.storage
    .from("photos")
    .getPublicUrl(asset.storage_path);

  const publicUrl = urlData?.publicUrl;
  if (!publicUrl) {
    console.warn(`  [skip] ${asset.id} — no public URL`);
    failed++;
    continue;
  }

  try {
    const response = await fetch(publicUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const metadata = await sharp(buffer).metadata();

    const width = metadata.width ?? null;
    const height = metadata.height ?? null;

    // Get dominant color by resizing to 1x1
    let dominant_color = null;
    try {
      const { data: pixel } = await sharp(buffer)
        .resize(1, 1, { fit: 'cover' })
        .flatten({ background: { r: 128, g: 128, b: 128 } })
        .raw()
        .toBuffer({ resolveWithObject: true });
      const [r, g, b] = pixel;
      dominant_color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch { /* leave null */ }

    if (!width || !height) {
      console.warn(`  [skip] ${asset.id} — sharp couldn't read dimensions`);
      failed++;
      continue;
    }

    const { error: updateError } = await supabase
      .from("post_assets")
      .update({ width, height, dominant_color })
      .eq("id", asset.id);

    if (updateError) {
      console.error(`  [fail] ${asset.id} — ${updateError.message}`);
      failed++;
    } else {
      console.log(`  [ok]   ${asset.id} — ${width}x${height} ${dominant_color ?? '(no color)'}`);
      updated++;
    }
  } catch (err) {
    console.error(`  [fail] ${asset.id} — ${err.message}`);
    failed++;
  }
}

console.log(`\nDone. Updated: ${updated}, Failed/Skipped: ${failed}`);
