import { useState } from "react";
import CompareMapPanel from "./CompareMapPanel";

export default function CompareView() {
  const [yearA, setYearA] = useState(1720);
  const [yearB, setYearB] = useState(1800);

  return (
    <div className="flex-1 flex overflow-hidden">
      <CompareMapPanel year={yearA} onYearChange={setYearA} label="then" />
      <div className="w-px bg-stone-800 flex-shrink-0" />
      <CompareMapPanel year={yearB} onYearChange={setYearB} label="now" />
    </div>
  );
}
