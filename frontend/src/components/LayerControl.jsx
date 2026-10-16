const LAYERS = [
  { id: "political", label: "Political", available: true },
  { id: "battle", label: "Battle", available: true },
  { id: "cities", label: "Cities", available: true },
  { id: "trade", label: "Trade (soon)", available: false },
  { id: "culture", label: "Culture (soon)", available: false },
];

export default function LayerControl({ activeLayers, onToggle }) {
  return (
    <div className="absolute top-4 right-4 z-[1000] bg-[#FAF5EB]/96 border border-[#D4BE98] rounded-md overflow-hidden backdrop-blur-md shadow-md shadow-black/25 w-44">
      <div className="px-3.5 pt-2.5 pb-1 border-b border-[#E8D8B8]/60">
        <p className="text-[9.5px] font-semibold text-[#7C6A52] tracking-[0.18em] uppercase">
          Layers
        </p>
      </div>
      <ul className="py-1">
        {LAYERS.map((layer) => {
          const isOn = activeLayers.includes(layer.id);
          return (
            <li key={layer.id}>
              <button
                disabled={!layer.available}
                onClick={() => layer.available && onToggle(layer.id)}
                className={[
                  "w-full flex items-center justify-between px-3.5 py-1.5 text-left transition-colors",
                  layer.available
                    ? "hover:bg-[#EFE4CE]/80 cursor-pointer"
                    : "cursor-default opacity-60",
                ].join(" ")}
                aria-label={`Toggle ${layer.label} layer`}
              >
                <span
                  className={[
                    "text-[12px] font-medium leading-tight",
                    layer.available ? "text-[#34291F]" : "text-[#7C6A52]",
                  ].join(" ")}
                >
                  {layer.label}
                </span>

                <span
                  className={[
                    "w-7 h-[16px] rounded-full flex-shrink-0 relative transition-colors duration-150 ease-in-out",
                    !layer.available
                      ? "bg-[#D8C7A5]"
                      : isOn
                      ? "bg-[#A8523B]"
                      : "bg-[#D4BE98]",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "absolute top-[2px] w-[12px] h-[12px] rounded-full bg-[#FAF5EB] shadow-xs transition-all duration-150 ease-in-out",
                      isOn && layer.available ? "left-[13px]" : "left-[2px]",
                    ].join(" ")}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
