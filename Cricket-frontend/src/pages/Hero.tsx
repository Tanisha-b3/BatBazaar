import React from 'react';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  return (
    <div className="relative w-full h-[350px] md:h-[400px] lg:h-[380px] overflow-hidden bg-black mt-20">
      {/* Background */}
      <div className="absolute inset-0">
        <img 
          src="/stadium.png" 
          alt="Stadium" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Left Image - Cricketer */}
      <img 
        src="/left-kit.png" 
        alt="Cricket Player" 
        className="absolute bottom-0 left-0 md:left-0 lg:left-20 w-32 md:w-48 lg:w-56 xl:w-64 h-auto object-contain z-10"
      />

      {/* Right Image - Ball */}
      <img 
        src="/right-ball.png" 
        alt="Cricket Ball" 
        className="absolute bottom-0 right-0 md:right-0 lg:right-20 w-20 md:w-28 lg:w-36 xl:w-44 h-auto object-contain z-10"
      />

{/* Main Content - All rotated together */}
      <div className="relative z-20 h-full flex flex-col items-center justify-start pt-6 md:pt-10 lg:pt-12 px-4">
        
        {/* Premium Badge - Rotated */}
        <div className="rotate-[-6deg] mb-1">
          <div className="bg-gradient-to-r from-[#3F51B5] to-[#BC67B6] px-6 md:px-10 py-1.5 md:py-2">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-wider">
              PREMIUM
            </h1>
          </div>
        </div>

        {/* White Line - Rotated */}
        <div className="rotate-[-6deg] w-42 md:w-64 h-0.5 bg-white mb-1"></div>

        {/* Title - Rotated */}
        <div className="rotate-[-6deg] mb-2">
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white text-center">
            Cricket Accessories
          </h2>
        </div>

        {/* Buy Now Button - Rotated - moved to the right */}
        <Link 
          to="/products"
          className="rotate-[-6deg] translate-x-12 md:translate-x-12 lg:translate-x-20 bg-gradient-to-r from-[#3F51B5] to-[#BC67B6] hover:opacity-90 transition-opacity px-6 md:px-8 py-2 md:py-2.5 mb-2"
        >
          <span className="text-base md:text-lg lg:text-xl font-bold text-white">
            Buy Now
          </span>
        </Link>

        {/* Button Line - Rotated - moved to the right */}
        <div className="rotate-[-6deg] translate-x-12 md:translate-x-20 lg:translate-x-20 w-30 md:w-38 h-0.5 bg-white mb-4 md:mb-6"></div>

        {/* Product Grid - Not rotated */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 lg:gap-4 max-w-4xl px-2 mt-4">
          <Link
            to="/products"
            className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white rounded-lg shadow-md hover:scale-110 transition-transform flex items-center justify-center p-1"
          >
            <img src="/bat1.png" alt="Bat" className="w-full h-full object-contain" />
          </Link>
          <Link
            to="/products"
            className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white rounded-lg shadow-md hover:scale-110 transition-transform flex items-center justify-center p-1"
          >
            <img src="/bag.png" alt="Bag" className="w-full h-full object-contain" />
          </Link>
          <Link
            to="/products"
            className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white rounded-lg shadow-md hover:scale-110 transition-transform flex items-center justify-center p-1"
          >
            <img src="/helmet.png" alt="Helmet" className="w-full h-full object-contain" />
          </Link>
          <Link
            to="/products"
            className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white rounded-lg shadow-md hover:scale-110 transition-transform flex items-center justify-center p-1"
          >
            <img src="/stumps.png" alt="Stumps" className="w-full h-full object-contain" />
          </Link>
          <Link
            to="/products"
            className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white rounded-lg shadow-md hover:scale-110 transition-transform flex items-center justify-center p-1"
          >
            <img src="/gloves.png" alt="Gloves" className="w-full h-full object-contain" />
          </Link>
          <Link
            to="/products"
            className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white rounded-lg shadow-md hover:scale-110 transition-transform flex items-center justify-center p-1"
          >
            <img src="/kit.png" alt="Kit" className="w-full h-full object-contain" />
          </Link>
        </div>
      </div>

      {/* Sparkle Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="w-full h-full opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        ></div>
      </div>
    </div>
  );
};

export default Hero;