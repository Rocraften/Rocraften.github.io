import "@/styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCEDU Experiments Web Editor",
  description: "A temporary fix to enable Minecraft Educaition experimental features directly in your browser.",
  openGraph: {
    type: "website",
    title: "MCEDU Experiments Web Editor",
    description: "A temporary fix to enable Minecraft Educaition experimental features directly in your browser.",
    images: ["https://rocraften.github.io/favicon.ico"],
    url: "https://rocraften.github.io",
  },
  twitter: {
    card: "summary_large_image",
    title: "MCEDU Experiments Web Editor",
    description: "A temporary fix to enable Minecraft Educaition experimental features directly in your browser.",
    images: ["https://rocraften.github.io/favicon.ico"],
  },
  metadataBase: new URL("https://rocraften.github.io"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main style={{
      background: "radial-gradient(circle at top, #2c3e50, #1a252f)",
      color: "#ecf0f1",
      minHeight: "100vh",
      fontFamily: "'Segoe UI', sans-serif",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "2rem"
    }}>
      {children}
    </main>
  );
}
