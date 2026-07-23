import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/** Reset window scroll on route changes so new screens open at the top. */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }, []);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
