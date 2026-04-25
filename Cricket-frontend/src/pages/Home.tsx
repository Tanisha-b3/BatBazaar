import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Header";
import TopSellers from "./TopSellers";
import Features from "./Featured";
import Hero from "./Hero";

const NAVBAR_HEIGHT = 75;

export default function HomePage() {
  const location = useLocation();
  const heroRef = useRef<HTMLDivElement>(null);
  const topSellersRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (sectionId: string) => {
    const refMap: Record<string, React.RefObject<HTMLDivElement | null>> = {
      home: heroRef,
      topseller: topSellersRef,
      featured: featuredRef,
    };

    const target = refMap[sectionId]?.current ?? document.getElementById(sectionId);

    if (target) {
      const top = target.getBoundingClientRect().top + window.pageYOffset - NAVBAR_HEIGHT;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (!location.hash) return;

    const sectionId = location.hash.substring(1);

    // Wait for full paint before scrolling
    const raf = requestAnimationFrame(() => {
      setTimeout(() => scrollToSection(sectionId), 50);
    });

    return () => cancelAnimationFrame(raf);
  }, [location.hash]);

  return (
    <div className="bg-white">
      <Navbar />

      <div ref={heroRef} id="home">
        <Hero />
      </div>

      <div ref={topSellersRef} id="topseller" className="scroll-mt-[75px]">
        <TopSellers />
      </div>

      <div ref={featuredRef} id="featured" className="scroll-mt-[75px]">
        <Features />
      </div>
    </div>
  );
}