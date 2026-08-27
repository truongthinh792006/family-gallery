import defaultAlbums from "../../data/albums.json";
import FamilyGalleryApp from "@/components/FamilyGalleryApp";

export default function Home() {
  let initialAlbums = [];
  try {
    initialAlbums = Array.isArray(defaultAlbums) ? defaultAlbums : [];
  } catch (error) {
    console.error("Lỗi khi nạp dữ liệu albums.json ban đầu:", error);
    initialAlbums = [];
  }

  return <FamilyGalleryApp initialAlbums={initialAlbums} />;
}
