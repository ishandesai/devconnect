// src/app/not-found.tsx
export default function NotFound() {
    // Keep this dead-simple: no hooks, no shared components,
    // no Apollo, no app shell imports.
    return (
      <main className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-gray-600 mt-2">
          The page you’re looking for doesn’t exist.
        </p>
        <a
          href="/dashboard"
          className="inline-block mt-6 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Go to Dashboard
        </a>
      </main>
    );
  }
  