import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Header";
import TopSellers from "./TopSellers";
import Features from "./Featured";
import Hero from "./Hero";

export default function HomePage() {
  const location = useLocation();
  const heroRef = useRef<HTMLDivElement>(null);
  const topSellersRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);

  // Scroll to section function
  const scrollToSection = (sectionId: string) => {
    const navbarHeight = 75;
    let targetElement: HTMLElement | null = null;
    
    switch(sectionId) {
      case 'home':
        targetElement = heroRef.current;
        break;
      case 'topseller':
        targetElement = topSellersRef.current;
        break;
      case 'featured':
        targetElement = featuredRef.current;
        break;
      default:
        targetElement = document.getElementById(sectionId);
    }
    
    if (targetElement) {
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    if (location.hash) {
      const sectionId = location.hash.substring(1);
      // Small delay to ensure refs are set
      setTimeout(() => {
        scrollToSection(sectionId);
      }, 100);
    }
  }, [location]);

  return (
    <div className="bg-white">
      <Navbar />

      {/* Hero Section */}
      <div ref={heroRef} id="home " className="scroll-mt-[75px]">
        <Hero />
      </div>

      {/* Top Sellers Section */}
      <div ref={topSellersRef} id="topseller" className="scroll-mt-[75px]">
        <TopSellers />
      </div>

      {/* Featured Products Section */}
      <div ref={featuredRef} id="featured" className="scroll-mt-[75px] ">
        <Features />
      </div>
    </div>
  );
}