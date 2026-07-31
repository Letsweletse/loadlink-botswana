import { lazy, Suspense, type ComponentType } from "react";

function PageSpinner() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="h-7 w-7 rounded-full border-2 border-[#C9A05A] border-t-transparent animate-spin" />
    </div>
  );
}

/** Wraps a dynamic import() so its code only downloads when that route is
 *  actually visited, instead of being bundled into the single chunk every
 *  user downloads on first load. */
export function lazyPage(loader: () => Promise<{ default: ComponentType<any> }>) {
  const Lazy = lazy(loader);
  return function LazyPageWrapper(props: any) {
    return (
      <Suspense fallback={<PageSpinner />}>
        <Lazy {...props} />
      </Suspense>
    );
  };
}
