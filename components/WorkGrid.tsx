"use client";

import { useState } from "react";
import { work, type WorkKind } from "@/content/work";
import Media from "./Media";

const filters: ("All" | WorkKind)[] = ["All", "Reels", "Photos", "Launches"];

export default function WorkGrid() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const items = work.filter((w) => filter === "All" || w.kind === filter);
  return (
    <>
      <div className="section-head">
        <div>
          <div className="caps">The work</div>
          <h2 className="h2">Made for the feed.</h2>
        </div>
        <div className="tabs" role="group" aria-label="Show work">
          {filters.map((f) => (
            <button key={f} type="button" className="tab" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="masonry">
        {items.map((w, i) => (
          <Media key={`${filter}-${i}`} item={w} />
        ))}
      </div>
    </>
  );
}
