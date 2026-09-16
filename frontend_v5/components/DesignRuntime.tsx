"use client";

import { useEffect } from "react";

const STORAGE_KEY = "levaure-live-design-published-v1";

type DesignChange = {
  selector?: string;
  text?: string;
  html?: string;
  src?: string;
  href?: string;
  styles?: Record<string, string>;
  hidden?: boolean;
};

type PublishedDesign = {
  pathname?: string;
  changes?: DesignChange[];
};

export default function DesignRuntime() {
  useEffect(() => {
    if (window.location.pathname.startsWith("/design-studio")) {
      return;
    }

    let raw: string | null = null;

    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      return;
    }

    if (!raw) return;

    try {
      const parsed: PublishedDesign | PublishedDesign[] =
        JSON.parse(raw);

      const designs = Array.isArray(parsed)
        ? parsed
        : [parsed];

      const current =
        designs.find(
          (item) => item.pathname === window.location.pathname
        ) ??
        designs.find((item) => item.pathname === "*");

      if (!current?.changes?.length) return;

      current.changes.forEach((change) => {
        if (!change.selector) return;

        let elements: NodeListOf<HTMLElement>;

        try {
          elements =
            document.querySelectorAll<HTMLElement>(
              change.selector
            );
        } catch {
          return;
        }

        elements.forEach((element) => {
          if (typeof change.text === "string") {
            element.textContent = change.text;
          }

          if (
            typeof change.src === "string" &&
            element instanceof HTMLImageElement
          ) {
            element.src = change.src;
          }

          if (
            typeof change.href === "string" &&
            element instanceof HTMLAnchorElement
          ) {
            element.href = change.href;
          }

          if (change.styles) {
            Object.entries(change.styles).forEach(
              ([property, value]) => {
                element.style.setProperty(property, value);
              }
            );
          }

          if (change.hidden === true) {
            element.style.display = "none";
          }
        });
      });
    } catch {
      // Ignore invalid saved design data.
    }
  }, []);

  return null;
}