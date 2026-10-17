import { useState, useEffect } from "react";
import CompareMapPanel from "./CompareMapPanel";

export default function CompareView({ initialYearA = 1739, initialYearB = 1780 }) {
  const [yearA, setYearA] = useState(initialYearA);
  const [yearB, setYearB] = useState(initialYearB);

  useEffect(() => {
    if (initialYearA) setYearA(initialYearA);
  }, [initialYearA]);

  useEffect(() => {
    if (initialYearB) setYearB(initialYearB);
  }, [initialYearB]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#FAF5EB] overflow-hidden">
      {/* Mobile view switcher for small screens */}
      <div className="flex md:hidden items-center justify-between px-3 py-1.5 bg-[#F2E8D5] border-b border-[#D4BE98] text-[11px] shrink-0">
        <span className="font-semibold text-[#7C6A52] uppercase tracking-wider text-[10px]">
          Compare Mode
        </span>
        <div className="flex items-center gap-1 bg-[#FAF5EB] border border-[#D4BE98] rounded-md p-0.5">
          <button
            onClick={() => setMobileActivePanel("split")}
            className={`px-2 py-0.5 rounded transition-colors cursor-pointer text-[11px] ${
              mobileActivePanel === "split"
                ? "bg-[#A8523B] text-[#FAF5EB] font-medium"
                : "text-[#7C6A52] hover:text-[#34291F]"
            }`}
          >
            Split
          </button>
          <button
            onClick={() => setMobileActivePanel("A")}
            className={`px-2 py-0.5 rounded transition-colors cursor-pointer text-[11px] ${
              mobileActivePanel === "A"
                ? "bg-[#A8523B] text-[#FAF5EB] font-medium"
                : "text-[#7C6A52] hover:text-[#34291F]"
            }`}
          >
            Year A ({yearA})
          </button>
          <button
            onClick={() => setMobileActivePanel("B")}
            className={`px-2 py-0.5 rounded transition-colors cursor-pointer text-[11px] ${
              mobileActivePanel === "B"
                ? "bg-[#A8523B] text-[#FAF5EB] font-medium"
                : "text-[#7C6A52] hover:text-[#34291F]"
            }`}
          >
            Year B ({yearB})
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        <div
          className={`flex-1 flex flex-col min-h-0 ${
            mobileActivePanel === "B" ? "hidden md:flex" : "flex"
          }`}
        >
          <CompareMapPanel year={yearA} onYearChange={setYearA} label="Year A" />
        </div>
        <div className="h-[2px] md:h-auto md:w-[1.5px] bg-[#D4BE98] flex-shrink-0 shadow-xs z-10" />
        <div
          className={`flex-1 flex flex-col min-h-0 ${
            mobileActivePanel === "A" ? "hidden md:flex" : "flex"
          }`}
        >
          <CompareMapPanel year={yearB} onYearChange={setYearB} label="Year B" />
        </div>
      </div>
    </div>
  );
}

