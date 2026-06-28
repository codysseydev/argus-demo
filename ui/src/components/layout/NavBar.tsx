import { NavLink } from 'react-router-dom';

const links = [
  { to: '/search', label: 'Search' },
  { to: '/failures', label: 'Failures' },
  { to: '/saved-searches', label: 'Saved searches' },
];

/** Top navigation: wordmark plus the primary section links. */
export function NavBar() {
  return (
    <nav className="flex items-center gap-6 border-b border-slate-200 px-4 py-3">
      <span className="text-lg font-bold tracking-tight text-slate-900">Argus</span>
      <ul className="flex items-center gap-4">
        {links.map((l) => (
          <li key={l.to}>
            <NavLink
              to={l.to}
              className={({ isActive }) =>
                isActive
                  ? 'text-sm font-semibold text-slate-900 underline'
                  : 'text-sm text-slate-600 hover:text-slate-900'
              }
            >
              {l.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
