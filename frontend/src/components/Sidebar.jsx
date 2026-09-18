export default function Sidebar({
  territories,
  rulers,
  selectedPolityId,
  selectedRuler,
  onSelectPolity,
  onClearRuler,
}) {
  const selected = territories.find((t) => t.polity?._id === selectedPolityId);

  // A dedicated ruler view takes priority over the polity view — clicking a
  // specific person from search should show exactly that person, not a
  // mixed list of everyone whose reign happens to touch the same year.
  if (selectedRuler) {
    return (
      <aside className="w-[340px] border-l border-stone-800 bg-[#14120f] overflow-y-auto flex flex-col">
        <RulerDetail
          ruler={selectedRuler}
          onBack={onClearRuler}
          onViewPolity={() => {
            onClearRuler();
            if (selectedRuler.polity?._id) onSelectPolity(selectedRuler.polity._id);
          }}
        />
      </aside>
    );
  }

  const matchingRulers = selected
    ? (rulers || [])
        .filter((r) => r.polity === selectedPolityId || r.polity?._id === selectedPolityId)
        .sort((a, b) => a.reignStart - b.reignStart)
    : [];

  return (
    <aside className="w-[340px] border-l border-stone-800 bg-[#14120f] overflow-y-auto flex flex-col">
      {selected ? (
        <PolityDetail territory={selected} rulers={matchingRulers} onBack={() => onSelectPolity(null)} />
      ) : (
        <PolityList territories={territories} onSelectPolity={onSelectPolity} />
      )}
    </aside>
  );
}

function PolityList({ territories, onSelectPolity }) {
  return (
    <div>
      <div className="px-6 pt-7 pb-4 border-b border-stone-800/70">
        <p className="text-[10px] text-stone-500 tracking-[0.2em] uppercase">
          {territories.length} {territories.length === 1 ? "power" : "powers"} on the map
        </p>
      </div>

      {territories.length === 0 && (
        <p className="px-6 py-8 text-[13px] text-stone-500 leading-relaxed italic">
          No recorded territories for this year yet.
        </p>
      )}

      <ul>
        {territories.map((t, i) => (
          <li key={t._id} className={i !== 0 ? "border-t border-stone-800/50" : ""}>
            <button
              onClick={() => onSelectPolity(t.polity._id)}
              className="w-full text-left px-6 py-4 hover:bg-stone-900/60 transition-colors group flex items-start gap-3.5"
            >
              <span
                className="w-[3px] self-stretch rounded-full flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: t.polity.colorHex }}
              />
              <div className="min-w-0 pt-0.5">
                <div className="font-display text-[16px] text-stone-100 leading-snug">{t.polity.name}</div>
                <div className="text-[11.5px] text-stone-500 capitalize mt-0.5 tracking-wide">{t.polity.type}</div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PolityDetail({ territory, rulers, onBack }) {
  const p = territory.polity;

  const sourceMap = new Map();
  (p.sources || []).forEach((s) => s?._id && sourceMap.set(s._id, s));
  (territory.sources || []).forEach((s) => s?._id && sourceMap.set(s._id, s));
  const allSources = Array.from(sourceMap.values());

  return (
    <div>
      <button
        onClick={onBack}
        className="w-full text-left px-6 py-3.5 text-[11px] text-stone-500 hover:text-stone-300 transition-colors border-b border-stone-800/70 tracking-wide"
      >
        ‹ back to territories
      </button>

      <div className="px-6 pt-6 pb-8">
        <div className="w-8 h-[3px] rounded-full mb-4" style={{ backgroundColor: p.colorHex }} />
        <h2 className="font-display text-[24px] text-stone-50 leading-[1.15]">{p.name}</h2>
        <p className="text-[11.5px] text-stone-500 capitalize mt-1.5 tracking-wide">{p.type}</p>

        {rulers.length > 0 && (
          <div className="mt-5 pt-5 border-t border-stone-800/70">
            <p className="text-[10px] text-stone-500 tracking-[0.2em] uppercase mb-2.5">
              {rulers.length > 1 ? "Rulers this year" : "Ruling this year"}
            </p>
            {rulers.length > 1 && (
              <p className="text-[11px] text-stone-600 italic mb-3 leading-snug">
                More than one claimant is recorded for this year — a contested succession, not a data error.
              </p>
            )}
            <div className="space-y-3">
              {rulers.map((r) => (
                <div key={r._id} className="flex gap-3">
                  {r.imageUrl && (
                    <img
                      src={r.imageUrl}
                      alt={r.name}
                      className="w-11 h-11 rounded object-cover flex-shrink-0 border border-stone-800"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  )}
                  <div className="min-w-0">
                    <div className="text-[14px] text-stone-100 leading-snug">{r.name}</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      {r.title || "Ruler"} · {r.reignStart}–{r.reignEnd}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 space-y-4 text-[13px]">
          <Row label="Capital" value={p.capital?.name || "Unknown"} />
          <Row label="Shown for" value={`${territory.validFrom} – ${territory.validTo}`} />
          <ConfidenceRow confidence={territory.confidence} />
        </div>

        {p.description && (
          <p className="text-[13.5px] text-stone-300 mt-6 leading-[1.65] font-light">{p.description}</p>
        )}

        <SourcesList sources={allSources} />
      </div>
    </div>
  );
}

function RulerDetail({ ruler, onBack, onViewPolity }) {
  const sources = (ruler.sources || []).filter((s) => s?._id);

  return (
    <div>
      <button
        onClick={onBack}
        className="w-full text-left px-6 py-3.5 text-[11px] text-stone-500 hover:text-stone-300 transition-colors border-b border-stone-800/70 tracking-wide"
      >
        ‹ back
      </button>

      <div className="px-6 pt-6 pb-8">
        {ruler.imageUrl && (
          <img
            src={ruler.imageUrl}
            alt={ruler.name}
            className="w-20 h-20 rounded-md object-cover border border-stone-800 mb-4"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        )}
        <h2 className="font-display text-[23px] text-stone-50 leading-[1.15]">{ruler.name}</h2>
        <p className="text-[11.5px] text-stone-500 mt-1.5 tracking-wide">
          {ruler.title || "Ruler"} · {ruler.reignStart}–{ruler.reignEnd}
        </p>

        {ruler.polity?.name && (
          <button
            onClick={onViewPolity}
            className="inline-flex items-center gap-1.5 mt-3 text-[11.5px] text-stone-400 hover:text-amber-300 transition-colors group"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: ruler.polity.colorHex || "#8a8578" }}
            />
            {ruler.polity.name}
            <span className="text-stone-600 group-hover:text-amber-400/70">→</span>
          </button>
        )}

        <div className="mt-6 space-y-4 text-[13px]">
          {ruler.birthYear && <Row label="Born" value={ruler.birthYear} />}
          {ruler.deathYear && <Row label="Died" value={ruler.deathYear} />}
        </div>

        {ruler.bio && (
          <p className="text-[13.5px] text-stone-300 mt-6 leading-[1.65] font-light">{ruler.bio}</p>
        )}

        {ruler.places && ruler.places.length > 0 && (
          <div className="mt-7 pt-5 border-t border-stone-800/70">
            <p className="text-[10px] text-stone-500 tracking-[0.2em] uppercase mb-3">
              Notable places
            </p>
            <ul className="space-y-1.5">
              {ruler.places.map((p) => (
                <li key={p._id} className="text-[12.5px] text-stone-300 flex items-baseline gap-2">
                  <span className="text-stone-600 capitalize text-[10.5px]">{p.type}</span>
                  <span>{p.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <SourcesList sources={sources} />
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4 pb-3 border-b border-stone-800/50">
      <span className="text-stone-500 text-[11px] tracking-wide whitespace-nowrap">{label}</span>
      <span className="text-stone-200 text-right">{value}</span>
    </div>
  );
}

function ConfidenceRow({ confidence }) {
  const dotColor = { high: "#7fb069", medium: "#d4a24c", low: "#c1666b" }[confidence] || "#8a8578";
  return (
    <div className="flex items-baseline justify-between gap-4 pb-3 border-b border-stone-800/50">
      <span className="text-stone-500 text-[11px] tracking-wide">boundary confidence</span>
      <span className="text-stone-200 capitalize flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
        {confidence}
      </span>
    </div>
  );
}

function SourcesList({ sources }) {
  if (!sources || sources.length === 0) {
    return <p className="text-[11.5px] text-stone-600 mt-7 italic">No sources recorded for this entry yet.</p>;
  }
  return (
    <div className="mt-7 pt-5 border-t border-stone-800/70">
      <p className="text-[10px] text-stone-500 tracking-[0.2em] uppercase mb-3">Sources</p>
      <ul className="space-y-2.5">
        {sources.map((s) => (
          <li key={s._id}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12.5px] text-stone-400 hover:text-stone-100 transition-colors leading-snug flex items-baseline gap-1.5 group"
            >
              <span className="underline decoration-stone-700 group-hover:decoration-stone-400 underline-offset-2 decoration-1">
                {s.title}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
