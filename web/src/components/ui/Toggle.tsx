interface Props {
  on: boolean;
  onChange: () => void;
  title: string;
  desc?: string;
}

export function ToggleRow({ on, onChange, title, desc }: Props) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={on}
      className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl w-full text-left"
    >
      <div className="flex-1">
        <div className="font-semibold text-[15px]">{title}</div>
        {desc && <div className="text-[13px] text-gray-500 mt-0.5">{desc}</div>}
      </div>
      <span
        className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
          on ? "bg-green-500" : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute top-[3px] left-[3px] w-[22px] h-[22px] bg-white rounded-full shadow-md transition-transform ${
            on ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}
