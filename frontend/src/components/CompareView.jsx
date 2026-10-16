import { useState } from "react";
import CompareMapPanel from "./CompareMapPanel";

export default function CompareView() {
  const [yearA, setYearA] = useState(1739);
  const [yearB, setYearB] = useState(1780);

  return (
    <div className="flex-1 flex overflow-hidden bg-[#FAF5EB]">
      <CompareMapPanel year={yearA} onYearChange={setYearA} label="Year A" />
      <div className="w-[1.5px] bg-[#D4BE98] flex-shrink-0 shadow-xs z-10" />
      <CompareMapPanel year={yearB} onYearChange={setYearB} label="Year B" />
    </div>
  );
}
