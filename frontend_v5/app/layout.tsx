import "./globals.css";
import DesignRuntime from "@/components/DesignRuntime";
import SiteChrome from "@/components/SiteChrome";

export const metadata = {
  title: "LE VAURÉ",
  description: "Premium Armenian fashion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="site-layout">
        <DesignRuntime />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}