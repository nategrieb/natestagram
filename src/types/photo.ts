export type PostAsset = {
  id: string;
  post_id: string;
  storage_path: string;
  width: number | null;
  height: number | null;
  position: number;
  created_at: string;
  imageUrl: string;
};

export type PhotoPost = {
  id: string;
  caption: string | null;
  taken_at: string | null;
  is_public: boolean;
  sort_order: number | null;
  created_at: string;
  assets: PostAsset[];
  coverImageUrl: string;
};
