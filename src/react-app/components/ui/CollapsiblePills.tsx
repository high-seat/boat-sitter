import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

type CollapsiblePillsProps<T> = {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  /** When a selected item would be hidden while collapsed, auto-expand. */
  selectedKeys?: string[];
  rows?: number;
  moreLabel: (hiddenCount: number) => string;
  lessLabel: string;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  moreTestId?: string;
  lessTestId?: string;
  className?: string;
};

/**
 * Flex-wrap pills that collapse to a fixed number of rows, with an inline
 * “+N more” control that expands the full set.
 */
export function CollapsiblePills<T>({
  items,
  getKey,
  renderItem,
  selectedKeys = [],
  rows = 2,
  moreLabel,
  lessLabel,
  expanded,
  onExpandedChange,
  moreTestId,
  lessTestId,
  className = "flex flex-wrap gap-2",
}: CollapsiblePillsProps<T>) {
  const measureRef = useRef<HTMLDivElement>(null);
  const onExpandedChangeRef = useRef(onExpandedChange);
  onExpandedChangeRef.current = onExpandedChange;
  const [visibleCount, setVisibleCount] = useState(items.length);
  const [canCollapse, setCanCollapse] = useState(false);

  useLayoutEffect(() => {
    const root = measureRef.current;
    if (!root) return;

    const measure = () => {
      const kids = [...root.children] as HTMLElement[];
      const moreEl = kids.find((el) => el.dataset.cpMore === "true");
      const pills = kids.filter((el) => el.dataset.cpMore !== "true");
      if (pills.length === 0) {
        setVisibleCount(0);
        setCanCollapse(false);
        return;
      }

      const tops = [...new Set(pills.map((pill) => pill.offsetTop))].sort((a, b) => a - b);
      if (tops.length <= rows) {
        setVisibleCount(pills.length);
        setCanCollapse(false);
        return;
      }

      setCanCollapse(true);
      if (expanded) {
        setVisibleCount(pills.length);
        return;
      }

      const maxTop = tops[rows - 1]!;
      const overflowAt = pills.findIndex((pill) => pill.offsetTop > maxTop);
      if (overflowAt < 0) {
        setVisibleCount(pills.length);
        setCanCollapse(false);
        return;
      }

      const moreWidth = moreEl?.offsetWidth ?? 72;
      const gap = 8;
      const containerWidth = root.clientWidth;
      let count = overflowAt;

      while (count > 0) {
        const last = pills[count - 1]!;
        if (last.offsetTop < maxTop) break;
        const spaceAfter = containerWidth - (last.offsetLeft + last.offsetWidth);
        if (spaceAfter >= moreWidth + gap) break;
        count -= 1;
      }

      setVisibleCount(Math.max(1, count));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [expanded, items, rows]);

  useLayoutEffect(() => {
    if (expanded || selectedKeys.length === 0 || !canCollapse) return;
    const shownKeys = new Set(items.slice(0, visibleCount).map(getKey));
    if (selectedKeys.some((key) => !shownKeys.has(key))) {
      onExpandedChangeRef.current(true);
    }
  }, [canCollapse, expanded, getKey, items, selectedKeys, visibleCount]);

  const hiddenCount = Math.max(0, items.length - visibleCount);
  const shown = expanded ? items : items.slice(0, visibleCount);

  return (
    <div className="relative w-full">
      <div
        aria-hidden
        className={`${className} invisible absolute inset-x-0 top-0`}
        ref={measureRef}
      >
        {items.map((item) => (
          <span className="inline-flex" key={`measure-${getKey(item)}`}>
            {renderItem(item)}
          </span>
        ))}
        <span
          className="rounded-full border border-dashed px-3 py-2 text-xs font-semibold whitespace-nowrap"
          data-cp-more="true"
        >
          {moreLabel(Math.max(1, hiddenCount || 1))}
        </span>
      </div>
      <div className={className} data-collapsible-pills-visible>
        {shown.map((item) => (
          <span className="inline-flex" key={getKey(item)}>
            {renderItem(item)}
          </span>
        ))}
        {!expanded && canCollapse && hiddenCount > 0 ? (
          <button
            aria-expanded={false}
            className="rounded-full border border-dashed border-teal/50 bg-seafoam/50 px-3 py-2 text-xs font-semibold text-teal transition hover:border-teal hover:bg-seafoam"
            data-testid={moreTestId}
            onClick={() => onExpandedChange(true)}
            type="button"
          >
            {moreLabel(hiddenCount)}
          </button>
        ) : null}
        {expanded && canCollapse ? (
          <button
            aria-expanded={true}
            className="rounded-full border border-dashed border-line bg-white px-3 py-2 text-xs font-semibold text-slate transition hover:border-teal hover:text-teal"
            data-testid={lessTestId}
            onClick={() => onExpandedChange(false)}
            type="button"
          >
            {lessLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
