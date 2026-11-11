"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  isSponsorExcludedPath,
  sponsorsForBand,
  type SponsorRecord,
} from "@/lib/sponsors/logic";
import SponsorBanner from "./SponsorBanner";
import SponsorPopup from "./SponsorPopup";

export default function SponsorsPublic() {
  const pathname = usePathname() || "/";
  const [sponsors, setSponsors] = useState<SponsorRecord[]>([]);

  useEffect(() => {
    if (isSponsorExcludedPath(pathname)) return;
    let cancelled = false;
    fetch("/api/sponsors")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setSponsors(d.sponsors || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (isSponsorExcludedPath(pathname)) return null;

  const band = sponsorsForBand(sponsors);

  return (
    <>
      <SponsorPopup sponsors={sponsors} />
      <SponsorBanner sponsors={band} />
    </>
  );
}
