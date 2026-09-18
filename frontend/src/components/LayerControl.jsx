const LAYERS = [
  { id: "political", label: "Political", sublabel: "territories & borders", available: true },
  { id: "battle", label: "Battle", sublabel: "events & conflicts", available: true },
  { id: "cities", label: "Cities", sublabel: "capitals & settlements", available: true },
  { id: "trade", label: "Trade", sublabel: "routes & centres", available: false },
  { id: "culture", label: "Culture", sublabel: "sites & knowledge", available: false },
];

export default function LayerControl({ activeLayers, onToggle }) {
  return (
    <div className="absolute top-3 right-3 z-[1000] bg-[#14120f]/95 border border-stone-800 rounded-md overflow-hidden backdrop-blur-sm shadow-lg shadow-black/30">
      <p className="text-[10px] text-stone-500 tracking-[0.18em] uppercase px-3.5 pt-3 pb-2">
        Layers
      </p>
      <ul>
        {LAYERS.map((layer) => {
          const isOn = activeLayers.includes(layer.id);
          return (
            <li key={layer.id}>
              <button
                disabled={!layer.available}
                onClick={() => layer.available && onToggle(layer.id)}
                className={[
                  "w-full flex items-center justify-between gap-6 px-3.5 py-2 text-left transition-colors",
                  layer.available ? "hover:bg-stone-900/70 cursor-pointer" : "cursor-default",
                ].join(" ")}
              >
                <div>
                  <div className={`text-[12.5px] ${layer.available ? "text-stone-200" : "text-stone-600"}`}>
                    {layer.label}
                  </div>
                  <div className="text-[10px] text-stone-600 mt-0.5">
                    {layer.available ? layer.sublabel : "coming soon"}
                  </div>
                </div>
                <span
                  className={[
                    "w-7 h-[15px] rounded-full flex-shrink-0 relative transition-colors",
                    !layer.available
                      ? "bg-stone-800"
                      : isOn
                      ? "bg-amber-600/80"
                      : "bg-stone-700",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "absolute top-[2px] w-[11px] h-[11px] rounded-full bg-stone-200 transition-all",
                      isOn && layer.available ? "left-[14px]" : "left-[2px]",
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
