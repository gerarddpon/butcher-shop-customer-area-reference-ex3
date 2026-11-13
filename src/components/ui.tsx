"use client";

import { useEffect, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, LoaderCircle, PackageOpen, Star, X } from "lucide-react";
import { cn, statusClass } from "@/lib/format";

export function StatusBadge({ status }: { status: string }) {
  return <span className={cn("status", statusClass(status))}>{status}</span>;
}

export function ProductThumb({ src, alt, size = 72, className }: { src: string; alt: string; size?: number; className?: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn("product-image", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="back-link"><ArrowLeft size={16} />{children}</Link>;
}

export function PageHeader({ title, description, action }: { title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <motion.header
      className="page-head"
      initial={{ opacity: 0, y: 18, clipPath: "inset(0 0 35% 0)" }}
      animate={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" }}
      transition={{ duration: .55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>{typeof title === "string" ? <h1>{title}</h1> : title}</div>
        {action}
      </div>
      {description ? <p>{description}</p> : null}
    </motion.header>
  );
}

export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 26, scale: .985 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: .12 }}
      transition={{ duration: .55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Stars({ value, onChange, size = 21, label = "Note" }: { value: number; onChange?: (value: number) => void; size?: number; label?: string }) {
  return (
    <span className="stars" aria-label={`${label} : ${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        const icon = <Star size={size} strokeWidth={1.7} fill={filled ? "currentColor" : "none"} aria-hidden="true" />;
        return onChange ? (
          <button key={star} type="button" className="star-button" onClick={() => onChange(star)} aria-label={`${star} étoile${star > 1 ? "s" : ""}`} aria-pressed={value === star}>
            {icon}
          </button>
        ) : <span key={star} aria-hidden="true">{icon}</span>;
      })}
    </span>
  );
}

export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button aria-label="Fermer" className="modal-backdrop border-0" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.section
            className="modal"
            style={wide ? { width: "min(760px, calc(100% - 28px))" } : undefined}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, x: "-50%", y: "-46%", scale: .96 }}
            animate={{ opacity: 1, x: "-50%", y: "-50%", scale: 1 }}
            exit={{ opacity: 0, x: "-50%", y: "-47%", scale: .98 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
          >
            <div className="flex items-center justify-between gap-4 mb-5">
              <h2 className="m-0">{title}</h2>
              <button type="button" className="close-button" onClick={onClose} aria-label="Fermer la fenêtre"><X size={24} /></button>
            </div>
            {children}
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <PackageOpen size={42} strokeWidth={1.3} />
      <h3 className="mt-3 mb-1">{title}</h3>
      <p className="muted">{text}</p>
      {action}
    </div>
  );
}

export function LoadingLabel({ children }: { children: ReactNode }) {
  return <><LoaderCircle size={16} className="spin" />{children}</>;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <span className="switch">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} aria-label={label} />
      <span className="switch-track" aria-hidden="true" />
    </span>
  );
}
