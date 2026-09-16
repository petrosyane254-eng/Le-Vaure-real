"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isDesignStudio = pathname.startsWith("/design-studio");

  if (isDesignStudio) {
    return <>{children}</>;
  }

  return (
    <>
      <Suspense fallback={null}>
        <Header />
      </Suspense>

      <main className="site-main">{children}</main>

      <Footer />
    </>
  );
}