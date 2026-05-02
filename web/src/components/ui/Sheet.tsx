"use client";

import { ReactNode, useEffect } from "react";

export function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 grid items-end md:items-center justify-items-center bg-[rgba(10,30,25,0.55)] animate-[fadeIn_0.2s]"
      style={{ animation: "fadeIn 0.2s" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-[480px] p-6 rounded-t-[28px] md:rounded-[28px] md:mb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] max-h-[90vh] overflow-y-auto"
        style={{ animation: "slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)" }}
      >
        <div className="w-9 h-1 bg-gray-200 rounded mx-auto -mt-2 mb-4" />
        {children}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(40px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  );
}
