import type { Metadata } from "next";
import { Quicksand, Noto_Sans_TC } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ApolloProvider } from "@/components/providers/ApolloProvider";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Pantry AI",
  description: "Your smart, AI-powered pantry manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${quicksand.variable} ${notoSansTC.variable} font-sans antialiased`}
        style={{ fontFamily: "var(--font-quicksand), var(--font-noto-sans-tc), sans-serif" }}
      >
        <AuthProvider>
          <ApolloProvider>
            {children}
          </ApolloProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
