export default function About() {
  return (
    <div className="bg-white py-16 px-6">

      <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-10 items-center">

        {/* LEFT IMAGE */}
        <div className="flex justify-center">
          <img
            src="/about-cricket.png"
            alt="cricket"
            className="w-[350px] md:w-[420px]"
          />
        </div>

        {/* RIGHT CONTENT */}
        <div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-800 mb-6">
            About Us
          </h2>

          {/* Section 1 */}
          <h3 className="text-lg font-semibold mb-2">
            Select your Bat from our collection of 100’s of actual pictures with weights.
          </h3>
          <p className="text-gray-600 mb-6 text-sm leading-6">
            Every Bat that arrives in the UAE is weighed, catalogued and uploaded on Cricketarabia with their actual weight and pictures. All items listed online are in stock in the UAE and will be packed & delivered within 48 hours.
          </p>

          {/* Section 2 */}
          <h3 className="text-lg font-semibold mb-2">
            Who Are We?
          </h3>
          <p className="text-gray-600 mb-6 text-sm leading-6">
            We are the authorised dealers of MRF Sports Equipment & SS Sports (Sareen Sports Industries) in the UAE. We provide cricketers an easy-to-shop, safe and secure experience with fast deliveries at their doorstep.
          </p>

          {/* Section 3 */}
          <h3 className="text-lg font-semibold mb-2">
            Why you should buy from us?
          </h3>
          <p className="text-gray-600 text-sm leading-6">
            Being a 100% Dubai based e-commerce business and sourcing our products direct from the manufacturer, we keep our overheads low and pass on these savings to our customers.
          </p>

        </div>
      </div>
    </div>
  );
}