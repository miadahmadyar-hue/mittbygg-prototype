import { ReactNode } from "react";

interface Props {
  selected: boolean;
  onClick: () => void;
  title: string;
  desc?: string;
  leadIcon?: ReactNode;
}

export function RadioCard({ selected, onClick, title, desc, leadIcon }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 p-4 rounded-xl bg-white text-left w-full transition-all ${
        selected
          ? "border-[1.5px] border-green-500 bg-green-50 shadow-[0_0_0_1px_var(--color-green-500)_inset]"
          : "border-[1.5px] border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      {leadIcon && (
        <div className="w-10 h-10 rounded-[10px] bg-gray-100 grid place-items-center shrink-0">
          {leadIcon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[15px]">{title}</div>
        {desc && (
          <div className="text-[13px] text-gray-500 mt-0.5">{desc}</div>
        )}
      </div>
      <div
        className={`w-[22px] h-[22px] rounded-full grid place-items-center shrink-0 transition-all ${
          selected
            ? "bg-green-500 border-2 border-green-500"
            : "border-2 border-gray-300"
        }`}
      >
        {selected && <div className="w-2 h-2 bg-white rounded-full" />}
      </div>
    </button>
  );
}
