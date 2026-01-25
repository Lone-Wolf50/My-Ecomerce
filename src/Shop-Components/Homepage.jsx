import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import useCart from "./useCart";
import { products } from "../Product";

function Homepage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { cartCount } = useCart();
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const communityImages = [
    { id: 0, url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCaO_LALs2EBDmGdlSVgY5zgAkBgK-_UdMJCsbL4rRDxcNo6b2-x-JpTyIzx9fxGhwLYik_Hlc9-3ev3lpKNfcbVtkp8rce1Xuk3lrDNpHH1oIgSx7daCpPKVC5Y_YvtzLhn6FfFwJhv1z9hn87F-WmbNv824ktlhzpzYX7BwH8NWsHRzjYp59ASmc1Q5ZI_NhZfdXrscoOAvX68beROynof5d2sXZ-T-J7J5oiEFFndReSy2GrDRtpv8wdMitzv3RDaiQoyRofQNRB" },
    { id: 1, url: "https://lh3.googleusercontent.com/aida-public/AB6AXuD4ru0F9HdKxDVcgpwILAHi8tSrpeUl_sME2jN0e5ioelOwR6JiTH3s2xNqbgqfKoCMqdPcqfn91_u1XOd5u0hR3UsVR2NOx2I5bTQ0HHYHTrtdtAxj1QzmMZzX4zyJYjz3SxWmPkPIRDrqv_upzCdV2Td4Wf1s-QI0LWQ9jI3XzDDQBsVHhP74RGoHX6Prq6VALB-_g1zMT4Ex2EhrWs3eR9i3YaG4GFkz76yL3ImFMy5H3TtDZhJZztIwPvhMWIVsfM7r_eLcQHLS" },
    { id: 2, url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBNED0C7MdztWGjxuuoAXZqoJt9lpF7ktn-Wq9aC-CTZfkja91zoZu75mR3wW6ryZAvgi8TkVgDYe4I2Aid35BQ3oB9uzUkfi0gylLvRrGtETPfDxU3L3Z-aDrXM3Tr0fuwzrCu2HFfe1nEs4dAlMIukE97yGCZzaffMM8_UxVZE_S1Z5Zenpm2RyqJjrmMijwRg-wB2qWINsdaKs9OD_3OHng8zRajYxB7uZhCFCSmeQpa7bdQu2r1bSVQco5Dti3IHs8wU8QwIrkr" },
    { id: 3, url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAa1S9Um7rKrxmYtsz21zrkWZgzdC5dEdHu7knBkemhqVYr_WR2q3_ANmyeuv_j-Q31IeJTn0J3_LPF8gZyVdZvCjsGCk8w1nIy_QDF-8qBKNKxCaChNGqXRSg_ae_c8CbYYsoBLNZl1aTPC3gyurgAEA_q_ARsPT1AGw_B7zXtBXFJ8Z6PFBr5-60V0qWop168Aw89MnAVAmif8m_BILOa32UUWzeOv-OPL85Be6a0vL_3YhDDJtc2GHhvCY3DWzPKTnO74g4K1nNA" },
    { id: 4, url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCU_QFPGUmN26qDIuE7hxad3VCnfvA_iBqBEPIshFBMhq9iyobQO6FFvdgclPaWM1f20GXnJ7p3p5llBV8L7o4FxB2Z7p3pQgVyZW99EME01n6WyZUtVJT-jtJ5dBvocDsRQwyMkqZOfOS2kkKyv_HaeeEZuY_JFBP9P3uCkLa0_eHFYEoCBeMY23cCnDPeSMbMQFXW6nKTL8iv5KWDdZGdfXZ1s3oYgCdUSo07E-I93YL0Jm2RzHUczVz_zwEs5ewqQj7lTYZnUfNn" },
    { id: 5, url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnmzwGNV5VBmlE-NXOhdeBNLTYezQ5sl6tVIkI-7Re_kfE380_Hrnvzb88CsroL79Xn7piTqRgBTfqoaemOKjSfflv-AQ7We8BKHigU4NSCB4OdryAMy3NR38KbvSIuJitPxkW05D43PmdhH7stMsym5uxAG_QwTgxrNcISfUlbzUwGQcL6Pk31mbHTXCsHzz8v1BJSdrdy9FtYAjc4pHdOXskW2IVihc3hSsM-sNsaPewva-A0hnxhBhhyQcoqlcMeGPw4MdFK_Vy" },
  ];

  const bagCategories = [
    { id: "crossbody", title: "Crossbody", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBy0Fh3JcqhMuxREM6yomrsSxBv7NyDqqHax2Rm-k7tqwhC2_2goZ-UO4YR587jB9pkbtB_MDRY5xxLzMmHv57NZ0mVn2m3xJSPcSvmfZF-eTLhZqd8saN2IxShP1PmdoJJqQgR9q-vZE7ecttdJRiqbiYADLd2b8X2lnZUmfCbcP2h8qwVyDan8_j0l9u-sqhYD9-FFBM8sHogknoissqbMiOnXBqIziV9GRo5dXgN3S2lgro8kSUBiLDQlr1dtm3I17LTk1PxAmnU" },
    { id: "underarm", title: "Underarm", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD8KqTs5jweePuyefQpmI6_ybMt-2XCca5Pv7snNWqt41ypAxx5NcluQiB6JyxHfhyZwFaoZSpDoRGZ9uCvXMRhXr0JnvtbnvUrQ-l5JRLPcyYdvJ96wBN_eOYTNt21-x_s6JiXS48Su_rf42Q-tOvpHITh87q7Ecq062gr1PWjaoQMW70-yRvGJEwM_e6Dj2aIOEP1NIhA2ZH_Do6HFwcUS-189PoGfMn7ru0yVHvb0CMqQiE5k6fMrFdwIadCGV5l20ER-Y_Z4-_D" },
    { id: "picnic", title: "Summer/Picnic", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBk2rRil-xhzH7krZNP0se3pVbnNAeBbsG9Ig68wyWbBSqHGIpMg0HLC8cGEXwh8XgNcjnhh2PH1gMIc8ychmiUa32faj1mBWS6rovEagBX1czkp4Ikw8g2yretiD2tYVEh-y8kb83uUqKio2j3X3-hu6uFWibf-x8TUI9VADVza_7X962M0SkHdZQXefVYU588h1h2bkNpSvb5rXzvPKN05erDqAsUGHUCdopQCvh7Ouz9NoBxb24f0Rq529DIR-xIbb4C3QBtV83l" },
    { id: "limited", title: "Limited Edition", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCz77R6yvmjkHZa4JO-LW3paHQO5tH4j7_QX2Uqz945gDV0Rn-w_o1iPproywm5OllowF19GGdUJA5AKaadX6DHQkrJtxXfqbpPIn6XKYRy3OTqzM0n5TORzwD86kuzCeW-80LrtwUzsXqcHeFWex3qRnDAGlmmEs-Sq4zVA1_uXzNTVWvw7neRB_fVKfc3wTrXfF-IkT2a34M_Ekyfi9kvaKQaYRli1ejrTZjba-xrCPXRMtMELMw_-psKOtv4nh8Xk4lvzkXzMAlk" },
  ];

  return (
    <div className="min-h-screen bg-cream text-black-solid">
      {/* HEADER: Updated with cream backdrop and dark borders */}
      <header className="fixed top-0 left-0 w-full z-50 bg-cream/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-primary">
              <svg className="size-7" fill="currentColor" viewBox="0 0 48 48">
                <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-black tracking-widest text-black-solid">LUXE</h1>
          </div>

          <nav className={`${isMenuOpen ? "flex flex-col absolute top-full left-0 w-full bg-cream/95 p-6 border-b border-black/10" : "hidden"} md:static md:flex md:flex-row items-center gap-12`}>
            <Link className="text-[11px] font-bold uppercase tracking-[0.3em] text-black-solid/60 hover:text-primary transition-colors" to="/">Home</Link>
            <Link className="text-[11px] font-bold uppercase tracking-[0.3em] text-black-solid/60 hover:text-primary transition-colors" to="/shop/underarm">Shop</Link>
            <Link className="text-[11px] font-bold uppercase tracking-[0.3em] text-black-solid/60 hover:text-primary transition-colors" to="/reviews">Reviews</Link>
          </nav>

          <div className="flex items-center gap-4 text-black-solid">
            <Link to="/cart" className="relative p-2 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">shopping_bag</span>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-primary text-white text-[9px] font-black size-4 flex items-center justify-center rounded-full">{cartCount}</span>
              )}
            </Link>
            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <span className="material-symbols-outlined">{isMenuOpen ? "close" : "menu"}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-8 pt-32">
        {/* SEARCH: Adjusted for Light Theme */}
        <section className="mt-12 mb-12 flex justify-center relative z-[40]" ref={searchRef}>
          <div className="relative w-full max-w-2xl group">
            <input
              type="text"
              placeholder="Search name or category..."
              className="w-full bg-white/40 border border-black/5 rounded-2xl py-5 px-8 focus:border-primary/50 outline-none transition-all text-black-solid placeholder:text-black-solid/30 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white border border-black/5 rounded-2xl overflow-hidden z-[60] shadow-2xl">
                {filteredProducts.map(p => (
                  <Link key={p.id} to={`/product/${p.id}`} className="flex items-center gap-4 p-4 hover:bg-cream border-b border-black/5">
                    <img src={p.image} className="size-12 rounded-lg object-cover" alt="" />
                    <span className="text-[11px] font-bold uppercase text-black-solid">{p.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-16 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative group">
              <div className="aspect-[4/5] w-full rounded-[2.5rem] overflow-hidden bg-white/40 border border-black/5 p-4 backdrop-blur-md shadow-2xl">
                <div className="w-full h-full rounded-[2rem] bg-cover bg-center transition-transform duration-1000 group-hover:scale-105" style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuAPdtyLddGcSx22o-5bmHkJikXpK3NhP6LtIRC_3G4g4ZgHbZfFQ2zYspfDf0eItg2kAcorlQal3nrAKcKAGA3Yo9hEra6VFP_u2PpefMqZBpj0U60VM8EFC9Mml-hxPpA6N2bvQ3kuzUlusBmJ8Mi9ebpYXvGej54Ojyh-yUA4bj_INN6vKOWqX-_gGxQ_vtsFyF2w18tK6Od_mQsRdPiDaabJXqzMoInCiaPHjSnxA6RygDqnovNlKA4-pERUUMn0BUB71CfPT5J5")` }}></div>
              </div>
            </div>
            <div className="flex flex-col gap-10 lg:pl-16">
              <div className="flex flex-col gap-6">
                <span className="text-primary font-bold tracking-[0.4em] uppercase text-[10px]">Exclusively Crafted</span>
                <h1 className="text-6xl md:text-8xl font-black leading-[1] tracking-tighter text-black-solid">The Essence <br /> <span className="text-primary">of Elegance</span></h1>
                <p className="text-lg text-black-solid/60 max-w-lg leading-relaxed font-light">Handcrafted for the modern woman who values timeless design and superior quality.</p>
              </div>
              <div className="flex flex-wrap gap-6">
                <Link to="/shop/underarm" className="bg-white/60 backdrop-blur-md border border-black/5 text-primary px-12 py-5 rounded-2xl font-black text-[11px] tracking-[0.2em] uppercase hover:bg-primary hover:text-white transition-all duration-500 shadow-lg">Shop Collection</Link>
                <button className="bg-black-solid/5 backdrop-blur-md border border-black/5 text-black-solid px-12 py-5 rounded-2xl font-bold text-[11px] tracking-[0.2em] uppercase hover:bg-black-solid/10 transition-all duration-300">Our Story</button>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED COLLECTIONS */}
        <section className="py-20 border-t border-black/5">
          <h2 className="text-4xl font-black uppercase mb-12 text-black-solid">Featured Collections</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {bagCategories.map((cat) => (
              <Link key={cat.id} to={`/shop/${cat.id}`} className="group">
                <div className="aspect-[3/4] rounded-[2rem] overflow-hidden bg-white/40 border border-black/5 p-2 mb-4">
                  <div className="w-full h-full rounded-[1.5rem] bg-cover bg-center group-hover:scale-105 transition-all duration-700" style={{ backgroundImage: `url(${cat.image})` }}></div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-black-solid">{cat.title}</h3>
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <span className="text-[9px] font-bold uppercase tracking-widest">Explore More</span>
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* COMMUNITY SECTION */}
        <section className="py-20 border-t border-black/5">
          <h3 className="text-2xl font-black uppercase tracking-widest text-center mb-12 text-black-solid">The Community</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {communityImages.map((img) => (
              <div key={img.id} className="aspect-square rounded-2xl overflow-hidden border border-black/5 grayscale hover:grayscale-0 transition-all">
                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${img.url})` }}></div>
              </div>
            ))}
          </div>
        </section>

        <footer className="w-full bg-white/50 backdrop-blur-sm border-t border-black/5 py-20 mt-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-2 text-primary">
                <svg className="size-6" fill="currentColor" viewBox="0 0 48 48"><path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z"></path></svg>
                <h2 className="text-2xl font-black tracking-widest uppercase text-black-solid">LUXE</h2>
              </div>
              <p className="text-xs text-black-solid/40 leading-relaxed max-w-xs">Ethically crafted luxury since 2012.</p>
            </div>
            <div>
              <h4 className="font-black text-[10px] uppercase tracking-[0.3em] mb-8 text-primary">Shop</h4>
              <ul className="flex flex-col gap-4 text-[13px] text-black-solid/50">
                <li><Link className="hover:text-primary transition-colors" to="/shop/underarm">New Arrivals</Link></li>
                <li><Link className="hover:text-primary transition-colors" to="/shop/crossbody">Bestsellers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-[10px] uppercase tracking-[0.3em] mb-8 text-primary">Support</h4>
              <ul className="flex flex-col gap-4 text-[13px] text-black-solid/50">
                <li><Link className="hover:text-primary transition-colors" to="#">Care</Link></li>
                <li><Link className="hover:text-primary transition-colors" to="#">FAQ</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-20 pt-10 border-t border-black/5 text-[9px] uppercase tracking-[0.4em] text-black-solid/20">
            <p>© 2026 LUXE Handbags. All Rights Reserved.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default Homepage;