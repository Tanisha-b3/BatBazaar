const Footer = () => {
  const relatedLinks = [
    { name: "Home", href: "#" },
    { name: "Sale", href: "#" },
    { name: "Accessories", href: "#" },
    { name: "All Products", href: "#" },
    { name: "Contact Us", href: "#" },
  ];

  const policies = [
    { name: "Privacy Policy", href: "#" },
    { name: "Terms & Conditions", href: "#" },
    { name: "Shipping Policy", href: "#" },
    { name: "Refund Policy", href: "#" },
  ];

  return (
    <section id="footer">
    <footer className="w-full bg-[#3F51B5] py-16">
      <div className="max-w-[1200px] mx-auto px-6">
        
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Left */}
          <div>
            <div className="flex items-center gap-2">
  <img
    src="./image1.png"
    alt="Logo"
    className="w-[90px] h-[80px] object-contain"
  />
  <h2 className="text-white font-semibold text-lg">
    QUALITY CRICKET
  </h2>
</div>

            <p className="text-white text-sm leading-6 mb-4">
              Lorem Ipsum is simply dummy text of the printing and typesetting industry.
            </p>

            <div className="flex items-center gap-2 mb-4">
              <img src="./phone.png" alt="Phone" className="w-5 h-5" />
              <span className="text-white text-sm">236526352632</span>
            </div>

            {/* Map */}
            <img
              src="./map.png"
              alt="Map"
              className="w-[200px] rounded-md"
            />
          </div>

          {/* Middle */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              RELATED LINKS
            </h3>
            <ul className="space-y-2">
              {relatedLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-white text-sm hover:text-gray-300">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Right */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              POLICY
            </h3>
            <ul className="space-y-2">
              {policies.map((policy) => (
                <li key={policy.name}>
                  <a href={policy.href} className="text-white text-sm hover:text-gray-300">
                    {policy.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-4">
          <p className="text-white text-sm">
            Get the latest updates via email.
          </p>

          <div className="flex w-full md:w-auto gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 md:w-[350px] h-[40px] px-3 bg-gray-200 rounded-md outline-none text-sm"
            />
            <button className="px-6 h-[40px] bg-black text-white rounded-md text-sm hover:bg-gray-800">
              Subscribe
            </button>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 border-t border-gray-500 pt-6 text-center">
          <p className="text-xs text-white">
            © {new Date().getFullYear()} Quality Cricket. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
    </section>
  );
};

export default Footer;