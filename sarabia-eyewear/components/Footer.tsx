import { Facebook, Instagram, Mail, MessageCircle, Music2 } from "lucide-react";
import { nav, site, whatsappLink } from "@/lib/site";
import { Logo } from "./Header";

const legal = [
  { href: "#", label: "Aviso de privacidad" },
  { href: "#", label: "Términos y condiciones" },
  { href: "#", label: "Envíos y devoluciones" },
  { href: "#", label: "Garantía" },
];

export function Footer() {
  const socials = [
    { href: site.social.instagram, label: "Instagram", icon: Instagram },
    { href: site.social.facebook, label: "Facebook", icon: Facebook },
    { href: site.social.tiktok, label: "TikTok", icon: Music2 },
    { href: `mailto:${site.email}`, label: "Correo", icon: Mail },
  ];

  return (
    <footer className="on-dark overflow-hidden bg-ink pb-28 pt-16 text-white md:pb-12">
      <div className="container">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/65">
              Armazones de autor y micas de laboratorio, por el equipo de {site.parent}.
            </p>
            <a
              href={whatsappLink("Hola Sarabia Eyewear, tengo una pregunta.")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold"
            >
              <MessageCircle className="h-4 w-4 text-whatsapp" /> {site.whatsappDisplay}
            </a>
          </div>
          <div>
            <p className="text-sm font-semibold">Explora</p>
            <ul className="mt-4 space-y-2 text-sm text-white/65">
              {nav.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="hover:text-white">{n.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Legal</p>
            <ul className="mt-4 space-y-2 text-sm text-white/65">
              {legal.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="hover:text-white">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Síguenos</p>
            <div className="mt-4 flex gap-2">
              {socials.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 transition hover:bg-white hover:text-ink"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-white/65">{site.address}<br />{site.hours}</p>
          </div>
        </div>

        <p className="display mt-16 select-none whitespace-nowrap text-[12vw] text-white/[0.07] 2xl:text-[10.5rem]" aria-hidden>
          Sarabia
        </p>
        <div className="mt-6 flex flex-col justify-between gap-2 border-t border-white/10 pt-6 text-xs text-white/65 sm:flex-row">
          <p>© {new Date().getFullYear()} {site.name} · {site.endorsement}. Todos los derechos reservados.</p>
          <p>Precios en MXN, IVA incluido · Diseño y desarrollo: Estudio Sarabia.</p>
        </div>
      </div>
    </footer>
  );
}
