"use client";

import { useRef, useState, type FormEvent, type MouseEvent } from "react";
import { Clock, Instagram, Mail, MapPin, MessageCircle } from "lucide-react";
import { site, whatsappLink } from "@/lib/site";
import { Reveal, SectionHeading } from "./ui";

const reasons = ["Hacer un pedido", "Enviar mi receta", "Agendar examen de la vista", "Estado de mi pedido"];

export function Contact() {
  const [name, setName] = useState("");
  const [reason, setReason] = useState(reasons[0]);
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);

  const text = `Hola Sarabia Eyewear, soy ${name.trim() || "un cliente"}.\nMotivo: ${reason}.${message.trim() ? `\n${message.trim()}` : ""}`;

  // Se usa un enlace real (no window.open) para que funcione en navegadores dentro de apps
  // y con bloqueadores de ventanas emergentes.
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    linkRef.current?.click();
  };

  const onLinkClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!formRef.current?.reportValidity()) e.preventDefault();
  };

  return (
    <section id="contacto" className="scroll-mt-20 py-20 md:py-28">
      <div className="container">
        <div className="grid overflow-hidden rounded-[1.5rem] bg-night-2 text-paper sm:rounded-[2rem] lg:grid-cols-2">
          <div className="p-6 sm:p-12 lg:p-16">
            <SectionHeading
              eyebrow="Contacto"
              title={<>Habla con<br />un asesor real.</>}
              description="Optometristas y asesores de Ópticas Jennifer Sarabia. Te ayudamos a elegir, leer tu receta y confirmar tu pedido."
            />
            <ul className="mt-10 space-y-4 text-sm text-paper/80">
              <li className="flex items-center gap-3"><MapPin className="h-4 w-4 text-volt" /> {site.address}</li>
              <li className="flex items-center gap-3"><Clock className="h-4 w-4 text-volt" /> {site.hours}</li>
              <li className="flex items-center gap-3"><MessageCircle className="h-4 w-4 text-volt" /> <a href={whatsappLink("Hola Sarabia Eyewear")} target="_blank" rel="noopener noreferrer" className="link-underline">{site.whatsappDisplay}</a></li>
              <li className="flex items-center gap-3"><Mail className="h-4 w-4 text-volt" /> <a href={`mailto:${site.email}`} className="link-underline">{site.email}</a></li>
              <li className="flex items-center gap-3"><Instagram className="h-4 w-4 text-volt" /> <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" className="link-underline">@opticasjennifersarabia</a></li>
            </ul>
          </div>

          <Reveal className="bg-night-3 p-6 sm:p-12 lg:p-16">
            <form ref={formRef} onSubmit={onSubmit} className="space-y-5">
              <label className="block">
                <span className="text-sm font-medium text-paper/70">Nombre</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="¿Cómo te llamas?"
                  className="field"
                />
              </label>
              <fieldset>
                <legend className="text-sm font-medium text-paper/70">Motivo</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {reasons.map((r) => (
                    <button
                      key={r}
                      type="button"
                      aria-pressed={reason === r}
                      onClick={() => setReason(r)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${reason === r ? "border-paper bg-paper text-night" : "border-white/15 text-paper/80 hover:border-white/40"}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="block">
                <span className="text-sm font-medium text-paper/70">Mensaje (opcional)</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Día y hora preferidos, modelo que te interesa…"
                  className="field resize-none"
                />
              </label>
              <a
                ref={linkRef}
                href={whatsappLink(text)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onLinkClick}
                className="btn-paper h-14 w-full text-base"
              >
                <MessageCircle className="h-5 w-5" /> Enviar por WhatsApp
              </a>
              <p className="text-center text-xs text-paper/50">Respondemos en menos de 15 minutos en horario de tienda.</p>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
