import albumsData from "../../data/albums.json";
import FamilyGalleryApp from "@/components/FamilyGalleryApp";

export default function Home() {
  return <FamilyGalleryApp initialAlbums={albumsData} />;
}
