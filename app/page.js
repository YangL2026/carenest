import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-800">CareNest</h1>
      <p className="mt-2 text-sm text-slate-500">
        Open your household URL at <code className="rounded bg-slate-100 px-1 py-0.5">/h/&lt;householdKey&gt;</code>
      </p>
      <Link
        href="/h/demo"
        className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-white transition-all duration-200 ease-in-out hover:bg-blue-700"
      >
        Open demo route
      </Link>
    </main>
  );
}
