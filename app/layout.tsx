import type { Metadata } from "next";
import { Montserrat, Open_Sans } from "next/font/google";
import "./globals.css";
import ToasterProvider from "@/components/ToasterProvider";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["500", "600", "700", "800"],
});
const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TrackLife — Rastrea tu vida",
  description: "Habitos, finanzas, entrenamiento, metas y tareas en un solo lugar. Gana XP, sube de nivel y compite en el ranking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${montserrat.variable} ${openSans.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}
