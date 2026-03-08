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

type AssetRow = {
  id: string;
  post_id: string;
  storage_path: string;
  width: number | null;
  height: number | null;
  dominant_color: string | null;
  camera_make: string | null;
  camera_model: string | null;
  focal_length: string | null;
  aperture: string | null;
  shutter_speed: string | null;
  iso: number | null;
  position: number;
  created_at: string;
};

export async function getPublicPosts(): Promise<PhotoPost[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return [];
  }

  try {
    const supabase = createSupabaseServerClient();
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "photos";

    const { data: postsData, error: postsError } = await supabase
      .from("posts")
      .select("id, caption, taken_at, is_public, sort_order, created_at")
      .eq("is_public", true)
      .order("sort_order", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (postsError) {
      console.error("Failed to fetch posts:", postsError.message);
      return [];
    }

    const posts = (postsData ?? []) as PostRow[];
    if (posts.length === 0) {
      return [];
    }

    const postIds = posts.map((post) => post.id);

    const { data: assetsData, error: assetsError } = await supabase
      .from("post_assets")
      .select("id, post_id, storage_path, width, height, dominant_color, camera_make, camera_model, focal_length, aperture, shutter_speed, iso, position, created_at")
      .in("post_id", postIds)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });

    if (assetsError) {
      console.error("Failed to fetch post assets:", assetsError.message);
      return [];
    }

    const assetsByPostId = new Map<string, PostAsset[]>();

    for (const rawAsset of (assetsData ?? []) as AssetRow[]) {
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(rawAsset.storage_path);

      const asset: PostAsset = {
        ...rawAsset,
        imageUrl: publicUrlData.publicUrl,
      };

      const list = assetsByPostId.get(rawAsset.post_id) ?? [];
      list.push(asset);
      assetsByPostId.set(rawAsset.post_id, list);
    }

    return posts
      .map((post) => {
        const assets = assetsByPostId.get(post.id) ?? [];
        const coverImageUrl = assets[0]?.imageUrl ?? "";

        return {
          ...post,
          assets,
          coverImageUrl,
        };
      })
      .filter((post) => post.assets.length > 0);
  } catch (error) {
    console.error("Post query failed:", error);
    return [];
  }
}

export async function getAdminPosts(): Promise<PhotoPost[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "photos";

    const { data: postsData, error: postsError } = await supabase
      .from("posts")
      .select("id, caption, taken_at, is_public, sort_order, created_at")
      .order("sort_order", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (postsError) {
      console.error("Failed to fetch admin posts:", postsError.message);
      return [];
    }

    const posts = (postsData ?? []) as PostRow[];
    if (posts.length === 0) {
      return [];
    }

    const postIds = posts.map((post) => post.id);

    const { data: assetsData, error: assetsError } = await supabase
      .from("post_assets")
      .select("id, post_id, storage_path, width, height, dominant_color, camera_make, camera_model, focal_length, aperture, shutter_speed, iso, position, created_at")
      .in("post_id", postIds)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });

    if (assetsError) {
      console.error("Failed to fetch admin post assets:", assetsError.message);
      return [];
    }

    const assetsByPostId = new Map<string, PostAsset[]>();

    for (const rawAsset of (assetsData ?? []) as AssetRow[]) {
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(rawAsset.storage_path);

      const asset: PostAsset = {
        ...rawAsset,
        imageUrl: publicUrlData.publicUrl,
      };

      const list = assetsByPostId.get(rawAsset.post_id) ?? [];
      list.push(asset);
      assetsByPostId.set(rawAsset.post_id, list);
    }

    return posts
      .map((post) => {
        const assets = assetsByPostId.get(post.id) ?? [];
        const coverImageUrl = assets[0]?.imageUrl ?? "";

        return {
          ...post,
          assets,
          coverImageUrl,
        };
      })
      .filter((post) => post.assets.length > 0);
  } catch (error) {
    console.error("Admin post query failed:", error);
    return [];
  }
}
