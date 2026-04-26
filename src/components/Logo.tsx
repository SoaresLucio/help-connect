import { motion } from "framer-motion";
import { HandshakeIcon } from "lucide-react";
import { Link } from "react-router-dom";

export function Logo({ variant = "dark", className = "" }: { variant?: "dark" | "light"; className?: string }) {
  const text = variant === "light" ? "text-primary-foreground" : "text-foreground";
  const sub = variant === "light" ? "text-primary-foreground/70" : "text-muted-foreground";
  return (
    <Link to="/" className={`group inline-flex items-center gap-2.5 ${className}`}>
      <motion.div
        whileHover={{ rotate: -8, scale: 1.05 }}
        transition={{ type: "spring", stiffness: 350, damping: 18 }}
        className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-accent shadow-glow"
      >
        <HandshakeIcon className="h-5 w-5 text-accent-foreground" strokeWidth={2.5} />
      </motion.div>
      <div className="flex flex-col leading-none">
        <span className={`font-display text-lg font-extrabold tracking-tight ${text}`}>
          Help<span className="text-accent">Aqui</span>
        </span>
        <span className={`text-[10px] font-medium uppercase tracking-[0.18em] ${sub}`}>serviços locais</span>
      </div>
    </Link>
  );
}
