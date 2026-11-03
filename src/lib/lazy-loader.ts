import dynamic from "next/dynamic";

// Helper function for lazy loading components
export function createLazyComponent(
  importFn: () => Promise<{ default: React.ComponentType }>,
  options: { ssr?: boolean } = {}
) {
  return dynamic(importFn, {
    ssr: options.ssr ?? true,
  });
}
