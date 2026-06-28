// Shared presentational class strings so the dark theme (borrowed from
// codyssey-frontend) stays consistent and lives in one place. Buttons and pills
// are rounded-full (the codyssey signature); surfaces are rounded-2xl cards.

export const card = 'rounded-2xl border border-blue-20 bg-blue-cosmic p-5';

export const btnPrimary =
  'rounded-full bg-blue-royalty px-4 py-2 text-sm font-semibold text-white shadow-sm ' +
  'transition-colors hover:bg-blue-royalty-hover disabled:cursor-not-allowed disabled:opacity-50';

export const btnGhost =
  'rounded-full border border-blue-30 px-3 py-1.5 text-xs font-semibold text-white-whisper ' +
  'transition-colors hover:bg-blue-10 disabled:cursor-not-allowed disabled:opacity-40';

export const btnDanger =
  'rounded-full border border-red-400/40 px-3 py-1.5 text-xs font-semibold text-red-300 ' +
  'transition-colors hover:bg-red-500/10';

export const pageHeading = 'text-lg font-semibold text-white';
export const sectionHeading = 'text-base font-semibold text-white';
export const muted = 'text-blue-40';

// Dense table primitives, shared by every table in the app.
export const tableCls = 'w-full border-collapse text-sm';
export const theadRowCls = 'border-b border-blue-20 text-left text-xs uppercase tracking-wide text-blue-40';
export const thCls = 'px-3 py-2 font-medium';
export const tbodyRowCls = 'border-b border-blue-10';
export const tdCls = 'px-3 py-2';
