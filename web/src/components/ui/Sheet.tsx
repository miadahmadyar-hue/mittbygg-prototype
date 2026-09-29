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
      className="fixed inset-0 z-50 grid items-end justify-items-center bg-[rgba(13,25,20,0.62)] p-0 backdrop-blur-[2px] md:items-center md:p-6"
      style={{ animation: "fadeIn 0.2s" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-t-[10px] bg-white p-6 shadow-lg md:rounded-[8px] md:p-8"
        style={{ animation: "slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)" }}
      >
        <div className="mx-auto -mt-2 mb-5 h-1 w-9 rounded bg-gray-200 md:hidden" />
        {children}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(40px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  );
}
