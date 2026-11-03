import { useWindowSize } from "@/hooks/use-window-size";

export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

export function useBreakpoint(): Breakpoint {
  const { width } = useWindowSize();

  if (width >= breakpoints["2xl"]) return "2xl";
  if (width >= breakpoints.xl) return "xl";
  if (width >= breakpoints.lg) return "lg";
  if (width >= breakpoints.md) return "md";
  if (width >= breakpoints.sm) return "sm";
  return "xs";
}

export function useIsMobile(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === "xs" || breakpoint === "sm";
}

export function useIsTablet(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === "md";
}

export function useIsDesktop(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === "lg" || breakpoint === "xl" || breakpoint === "2xl";
}

export function useBreakpointValue<T>(values: Partial<Record<Breakpoint, T>>, defaultValue: T): T {
  const breakpoint = useBreakpoint();
  return values[breakpoint] ?? defaultValue;
}

// Responsive grid helpers
export function getGridColumns(breakpoint: Breakpoint): number {
  const gridMap: Record<Breakpoint, number> = {
    xs: 1,
    sm: 2,
    md: 2,
    lg: 3,
    xl: 4,
    "2xl": 4,
  };
  return gridMap[breakpoint];
}

export function getCardSpacing(breakpoint: Breakpoint): string {
  const spacingMap: Record<Breakpoint, string> = {
    xs: "space-y-4",
    sm: "grid-cols-2 gap-4",
    md: "grid-cols-2 gap-6",
    lg: "grid-cols-3 gap-6",
    xl: "grid-cols-4 gap-6",
    "2xl": "grid-cols-4 gap-8",
  };
  return spacingMap[breakpoint];
}

// Touch device detection
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

// Safe area for mobile devices with notches
export function getSafeAreaInset(): {
  top: string;
  right: string;
  bottom: string;
  left: string;
} {
  if (typeof window === "undefined") {
    return { top: "0px", right: "0px", bottom: "0px", left: "0px" };
  }

  const style = getComputedStyle(document.documentElement);
  return {
    top: style.getPropertyValue("safe-area-inset-top") || "0px",
    right: style.getPropertyValue("safe-area-inset-right") || "0px",
    bottom: style.getPropertyValue("safe-area-inset-bottom") || "0px",
    left: style.getPropertyValue("safe-area-inset-left") || "0px",
  };
}

// Reduced motion preference
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// High contrast mode
export function prefersHighContrast(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-contrast: high)").matches;
}

// Dark mode preference
export function prefersDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}
