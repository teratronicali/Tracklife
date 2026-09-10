import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ToasterProvider from "@/components/ToasterProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "TrackLife — Gamifica tu disciplina",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}
