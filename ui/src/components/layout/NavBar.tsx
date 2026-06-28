import { NavLink } from 'react-router-dom';

const links = [
  { to: '/search', label: 'Search' },
  { to: '/failures', label: 'Failures' },
  { to: '/alerts', label: 'Alerts' },
  { to: '/saved-searches', label: 'Saved searches' },
];

/** Top navigation: wordmark plus the primary section links. */
export function NavBar() {
  return (
    <nav className="flex items-center gap-6 border-b border-blue-20 bg-blue-cosmic px-5 py-3">
      <span className="text-lg font-bold tracking-tight text-white">Argus</span>
      <ul className="flex items-center gap-1">
        {links.map((l) => (
          <li key={l.to}>
            <NavLink
              to={l.to}
              className={({ isActive }) =>
                isActive
                  ? 'rounded-full bg-blue-royalty px-3 py-1.5 text-sm font-semibold text-white'
                  : 'rounded-full px-3 py-1.5 text-sm font-medium text-blue-40 transition-colors hover:bg-blue-10 hover:text-white'
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
