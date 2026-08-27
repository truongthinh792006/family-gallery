import albumsData from "../../data/albums.json";
import Header from "@/components/Header";
import Gallery from "@/components/Gallery";
import Footer from "@/components/Footer";

export default function Home() {
  const totalAlbums = albumsData.length;
  const totalPhotos = albumsData.reduce(
    (acc, album) => acc + (album.photos ? album.photos.length : 0),
    0
  );

  return (
    <main className="flex-1 flex flex-col">
      <Header totalAlbums={totalAlbums} totalPhotos={totalPhotos} />
      <Gallery albums={albumsData} />
      <Footer />
    </main>
  );
}
