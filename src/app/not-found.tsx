import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <div className="eyebrow">404</div>
        <h1 className="h-display mt-3 text-6xl">Not on the map</h1>
        <p className="mt-3 text-muted">This page doesn&apos;t exist, or it isn&apos;t published yet.</p>
        <Link href="/" className="btn-dark mt-6">Back to the Atlas</Link>
      </div>
    </div>
  );
}
