import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Immersion } from "@/components/Immersion";
import { Proof } from "@/components/Proof";
import { CollectionHelix } from "@/components/CollectionHelix";
import { Campaign } from "@/components/Campaign";
import { ModelIndex } from "@/components/ModelIndex";
import { Designer } from "@/components/Designer";
import { Catalog } from "@/components/Catalog";
import { ArtOfSeeing } from "@/components/ArtOfSeeing";
import { Configurator } from "@/components/Configurator";
import { Benefits } from "@/components/Benefits";
import { Testimonials } from "@/components/Testimonials";
import { FAQ } from "@/components/FAQ";
import { faqs } from "@/lib/faqs";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { TryOnRoot } from "@/components/tryon/TryOnRoot";
import { products } from "@/lib/products";
import { site } from "@/lib/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Optician",
      name: "Ópticas Jennifer Sarabia",
      url: site.url,
      email: site.email,
      telephone: site.whatsappDisplay,
      address: site.address,
      brand: { "@type": "Brand", name: site.name },
    },
    {
      "@type": "ItemList",
      itemListElement: products.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Product",
          name: `${p.name} — ${site.name}`,
          description: p.tagline,
          brand: { "@type": "Brand", name: site.name },
          offers: { "@type": "Offer", priceCurrency: "MXN", price: p.price, availability: "https://schema.org/InStock" },
        },
      })),
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ],
};

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Immersion />
        <Proof />
        <CollectionHelix />
        <Campaign />
        <ArtOfSeeing />
        <ModelIndex />
        <Catalog />
        <Configurator />
        <Designer />
        <Benefits />
        <Testimonials />
        <FAQ />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFab />
      <TryOnRoot />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
