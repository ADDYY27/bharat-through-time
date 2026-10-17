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
    <div className="flex-1 flex overflow-hidden bg-[#FAF5EB]">
      <CompareMapPanel year={yearA} onYearChange={setYearA} label="Year A" />
      <div className="w-[1.5px] bg-[#D4BE98] flex-shrink-0 shadow-xs z-10" />
      <CompareMapPanel year={yearB} onYearChange={setYearB} label="Year B" />
    </div>
  );
}

