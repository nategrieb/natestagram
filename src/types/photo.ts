export type PostAsset = {
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
