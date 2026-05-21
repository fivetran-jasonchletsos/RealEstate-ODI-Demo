import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <div className="eyebrow mb-3">404</div>
      <h1 className="font-serif text-4xl text-[var(--ink-strong)] mb-3">Page not found</h1>
      <p className="text-[var(--ink-muted)] mb-6">
        The page you're looking for isn't on the desk. Try the home view or the leasing pipeline.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-sm font-semibold text-sm text-[var(--midnight)] px-5 py-3"
        style={{ background: 'var(--gold)' }}
      >
        Back to home
      </Link>
    </div>
  );
}
