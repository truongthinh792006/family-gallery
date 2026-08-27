import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  variable: "--font-serif",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: "Album Kỷ Niệm Gia Đình | Kho Báu Ký Ức",
  description: "Nơi lưu giữ từng khoảnh khắc yêu thương, nụ cười rạng rỡ và những dấu mốc thời gian quý báu của gia đình chúng ta.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={`${playfair.variable} ${plusJakarta.variable}`}>
      <body className="font-sans bg-[#FAF7F2] text-stone-800 min-h-screen flex flex-col antialiased selection:bg-amber-100 selection:text-amber-900">
        {children}
      </body>
    </html>
  );
}
