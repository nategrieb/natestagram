#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
  ".avif",
  ".gif",
  ".tif",
  ".tiff",
]);

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const idx = trimmed.indexOf("=");
  if (idx === -1) {
    return null;
  }

  const key = trimmed.slice(0, idx).trim();
  let value = trimmed.slice(idx + 1).trim();

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

async function loadDotEnv(dotEnvPath) {
  try {
    const raw = await fs.readFile(dotEnvPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const entry = parseEnvLine(line);
      if (!entry) {
        continue;
      }

      if (!process.env[entry.key]) {
        process.env[entry.key] = entry.value;
      }
    }
  } catch {
    // Ignore missing .env.local and rely on shell env.
  }
}

function slugifyFileName(fileName) {
  return fileName.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
}

function captionFromFileName(fileName) {
  const stem = fileName.replace(/\.[^.]+$/, "");
  return stem.replace(/[_-]+/g, " ").trim();
}

async function listImageFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (IMAGE_EXTENSIONS.has(ext)) {
      files.push(path.join(dirPath, entry.name));
    }
  }

  files.sort((a, b) => a.localeCompare(b));
  return files;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

async function main() {
  const inputDir = process.argv[2];
  if (!inputDir) {
    console.error("Usage: npm run bulk:upload -- <directory>");
    process.exit(1);
  }

  await loadDotEnv(path.join(process.cwd(), ".env.local"));

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "photos";

  const resolvedDir = path.resolve(inputDir);
  const files = await listImageFiles(resolvedDir);

  if (files.length === 0) {
    console.error(`No supported image files found in ${resolvedDir}`);
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let successCount = 0;
  const failures = [];

  for (let i = 0; i < files.length; i += 1) {
    const filePath = files[i];
    const fileName = path.basename(filePath);
    const extension = path.extname(fileName).toLowerCase();
    const safeName = slugifyFileName(fileName);

    try {
      const { data: postData, error: postError } = await supabase
        .from("posts")
        .insert({
          caption: captionFromFileName(fileName) || null,
          is_public: true,
        })
        .select("id")
        .single();

      if (postError || !postData) {
        throw postError || new Error("Failed to create post");
      }

      const storagePath = `${postData.id}/0-${Date.now()}-${safeName}`;
      const fileBuffer = await fs.readFile(filePath);

      const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, fileBuffer, {
        contentType: `image/${extension.replace(".", "")}`,
        upsert: false,
      });

      if (uploadError) {
        throw uploadError;
      }

      const { error: insertError } = await supabase.from("post_assets").insert({
        post_id: postData.id,
        storage_path: storagePath,
        position: 0,
      });

      if (insertError) {
        throw insertError;
      }

      successCount += 1;
      console.log(`Uploaded ${fileName}`);
    } catch (error) {
      failures.push({ fileName, error: String(error?.message || error) });
      console.error(`Failed ${fileName}: ${String(error?.message || error)}`);
    }
  }

  console.log(`\nDone. Uploaded ${successCount}/${files.length} files.`);
  if (failures.length > 0) {
    console.log("Failures:");
    for (const failure of failures) {
      console.log(`- ${failure.fileName}: ${failure.error}`);
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
