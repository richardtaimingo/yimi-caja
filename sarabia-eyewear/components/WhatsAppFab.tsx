"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/site";

export function WhatsAppFab() {
  return (
    <motion.a
      href={whatsappLink("Hola Sarabia Eyewear, quiero asesoría para elegir mis lentes.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Asesoría en línea por WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.2, type: "spring" }}
      whileHover={{ scale: 1.04 }}
      className="fixed bottom-5 right-5 z-30 flex items-center gap-3"
    >
      <span className="hidden items-center gap-2 rounded-full bg-white py-2 pl-3 pr-4 text-sm font-semibold text-ink shadow-lift sm:flex">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366] opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#25D366]" />
        </span>
        Asesoría en línea
      </span>
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lift">
        <MessageCircle className="h-6 w-6" />
        <span className="absolute -right-1 -top-1 rounded-full bg-ink px-1.5 py-0.5 text-[0.6rem] font-semibold text-bone sm:hidden">En línea</span>
      </span>
    </motion.a>
  );
}
