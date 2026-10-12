import { cache } from "react";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase";
import type { PhotoPost, PostAsset } from "@/types/photo";

type PostRow = {
  id: string;
  caption: string | null;
  taken_at: string | null;
  is_public: boolean;
  sort_order: number | null;
  created_at: string;
};

type AssetRow = Omit<PostAsset, "imageUrl">;

const POST_COLUMNS = "id, caption, taken_at, is_public, sort_order, created_at";
const ASSET_COLUMNS =
  "id, post_id, storage_path, width, height, dominant_color, camera_make, camera_model, focal_length, aperture, shutter_speed, iso, position, created_at";

function hasPublicSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  );
}

/** Fetch assets for the given posts and stitch them into PhotoPost objects. */
async function attachAssets(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  posts: PostRow[],
  label: string
): Promise<PhotoPost[]> {
  if (posts.length === 0) {
    return [];
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "photos";

  const { data: assetsData, error: assetsError } = await supabase
    .from("post_assets")
    .select(ASSET_COLUMNS)
    .in(
      "post_id",
      posts.map((post) => post.id)
    )
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (assetsError) {
    console.error(`Failed to fetch ${label} assets:`, assetsError.message);
    return [];
  }

  const assetsByPostId = new Map<string, PostAsset[]>();

  for (const rawAsset of (assetsData ?? []) as AssetRow[]) {
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(rawAsset.storage_path);

    const list = assetsByPostId.get(rawAsset.post_id) ?? [];
    list.push({ ...rawAsset, imageUrl: publicUrlData.publicUrl });
    assetsByPostId.set(rawAsset.post_id, list);
  }

  return posts
    .map((post) => {
      const assets = assetsByPostId.get(post.id) ?? [];
      return { ...post, assets, coverImageUrl: assets[0]?.imageUrl ?? "" };
    })
    .filter((post) => post.assets.length > 0);
}

export async function getPublicPosts(): Promise<PhotoPost[]> {
  if (!hasPublicSupabaseEnv()) {
    return [];
  }

  try {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("posts")
      .select(POST_COLUMNS)
      .eq("is_public", true)
      .order("sort_order", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch posts:", error.message);
      return [];
    }

    return await attachAssets(supabase, (data ?? []) as PostRow[], "post");
  } catch (error) {
    console.error("Post query failed:", error);
    return [];
  }
}

export type PostWithNeighbors = {
  post: PhotoPost;
  previousId: string | null;
  nextId: string | null;
  /** A small set of other posts (with assets) for a "keep browsing" grid. */
  more: PhotoPost[];
};

const MORE_POSTS_LIMIT = 12;

/**
 * Loads a single public post plus prev/next ids and a handful of other posts,
 * without pulling every asset in the library like getPublicPosts() does.
 * Wrapped in React cache() so generateMetadata and the page share one fetch.
 */
export const getPublicPostWithNeighbors = cache(
  async (id: string): Promise<PostWithNeighbors | null> => {
    if (!hasPublicSupabaseEnv()) {
      return null;
    }

    try {
      const supabase = createSupabaseServerClient();

      // Lightweight ordered list of ids only; used for prev/next and "more".
      const { data: orderData, error: orderError } = await supabase
        .from("posts")
        .select("id")
        .eq("is_public", true)
        .order("sort_order", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (orderError) {
        console.error("Failed to fetch post order:", orderError.message);
        return null;
      }

      const ids = ((orderData ?? []) as { id: string }[]).map((row) => row.id);
      const index = ids.indexOf(id);
      if (index === -1) {
        return null;
      }

      const moreIds = ids.filter((other) => other !== id).slice(0, MORE_POSTS_LIMIT);
      const wantedIds = [id, ...moreIds];

      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(POST_COLUMNS)
        .in("id", wantedIds);

      if (postsError) {
        console.error("Failed to fetch post:", postsError.message);
        return null;
      }

      const rowsById = new Map(((postsData ?? []) as PostRow[]).map((row) => [row.id, row]));
      const orderedRows = wantedIds.map((wanted) => rowsById.get(wanted)).filter((row): row is PostRow => Boolean(row));
      const posts = await attachAssets(supabase, orderedRows, "post");

      const post = posts.find((candidate) => candidate.id === id);
      if (!post) {
        return null;
      }

      return {
        post,
        previousId: ids[index - 1] ?? null,
        nextId: ids[index + 1] ?? null,
        more: posts.filter((candidate) => candidate.id !== id),
      };
    } catch (error) {
      console.error("Post query failed:", error);
      return null;
    }
  }
);

export async function getAdminPosts(): Promise<PhotoPost[]> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("posts")
      .select(POST_COLUMNS)
      .order("sort_order", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch admin posts:", error.message);
      return [];
    }

    return await attachAssets(supabase, (data ?? []) as PostRow[], "admin post");
  } catch (error) {
    console.error("Admin post query failed:", error);
    return [];
  }
}
