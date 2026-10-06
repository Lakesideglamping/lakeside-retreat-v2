"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackMetaPageView } from "@/lib/analytics";

/**
 * The Pixel base code sends one PageView on the initial load. Next's
 * client-side navigation never reloads the page, so later routes would go
 * unrecorded; this sends a PageView for each one after the first.
 */
export function MetaPageViews() {
  const pathname = usePathname();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    trackMetaPageView();
  }, [pathname]);

  return null;
}
