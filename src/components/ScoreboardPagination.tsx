"use client";

const PAGE_SIZE = 20;

export { PAGE_SIZE };

export function pageSlice<T>(items: T[], page: number): T[] {
  const start = (page - 1) * PAGE_SIZE;
  return items.slice(start, start + PAGE_SIZE);
}

export function totalPages(count: number) {
  return Math.max(1, Math.ceil(count / PAGE_SIZE));
}

export function ScoreboardPagination({
  page,
  total,
  onPageChange,
}: {
  page: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  if (total <= PAGE_SIZE) return null;

  const pages = totalPages(total);
  const safePage = Math.min(Math.max(1, page), pages);
  const from = (safePage - 1) * PAGE_SIZE + 1;
  const to = Math.min(safePage * PAGE_SIZE, total);

  const windowStart = Math.max(1, safePage - 2);
  const windowEnd = Math.min(pages, windowStart + 4);
  const nums: number[] = [];
  for (let n = windowStart; n <= windowEnd; n += 1) nums.push(n);

  return (
    <div className="flex flex-col gap-3 border-t border-ink/10 bg-paper-deep/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-stone">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <NavBtn
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          label="Prev"
        />
        {windowStart > 1 ? (
          <>
            <PageBtn n={1} active={false} onClick={() => onPageChange(1)} />
            {windowStart > 2 ? (
              <span className="px-1 text-stone">…</span>
            ) : null}
          </>
        ) : null}
        {nums.map((n) => (
          <PageBtn
            key={n}
            n={n}
            active={n === safePage}
            onClick={() => onPageChange(n)}
          />
        ))}
        {windowEnd < pages ? (
          <>
            {windowEnd < pages - 1 ? (
              <span className="px-1 text-stone">…</span>
            ) : null}
            <PageBtn
              n={pages}
              active={false}
              onClick={() => onPageChange(pages)}
            />
          </>
        ) : null}
        <NavBtn
          disabled={safePage >= pages}
          onClick={() => onPageChange(safePage + 1)}
          label="Next"
        />
      </div>
    </div>
  );
}

function NavBtn({
  disabled,
  onClick,
  label,
}: {
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="border border-ink/15 bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-ink/40 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}

function PageBtn({
  n,
  active,
  onClick,
}: {
  n: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`min-w-9 border px-2.5 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-ink bg-ink text-white"
          : "border-ink/15 bg-white text-ink-soft hover:border-ink/40 hover:text-ink"
      }`}
    >
      {n}
    </button>
  );
}
