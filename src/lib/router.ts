import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'problems' }
  | { name: 'problem'; slug: string }
  | { name: 'profile'; userId?: string }
  | { name: 'league' }
  | { name: 'submissions' }
  | { name: 'admin' };

function parseHash(): Route {
  const h = window.location.hash.replace(/^#\/?/, '');
  const parts = h.split('/').filter(Boolean);
  if (parts.length === 0) return { name: 'home' };
  if (parts[0] === 'problems') return { name: 'problems' };
  if (parts[0] === 'problem' && parts[1]) return { name: 'problem', slug: parts[1] };
  if (parts[0] === 'profile') return { name: 'profile', userId: parts[1] };
  if (parts[0] === 'league') return { name: 'league' };
  if (parts[0] === 'submissions') return { name: 'submissions' };
  if (parts[0] === 'admin') return { name: 'admin' };
  return { name: 'home' };
}

export function navigate(path: string) {
  window.location.hash = path;
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parseHash());
  useEffect(() => {
    const handler = () => {
      setRoute(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  return route;
}
