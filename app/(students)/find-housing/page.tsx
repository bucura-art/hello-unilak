import Link from 'next/link';

export default function FindHousingPage() {
  return (
    <div className="min-h-screen bg-[#535350] px-4 py-10 text-white md:px-6">
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl border border-white/10 bg-gray-900/80 p-8 text-center shadow-2xl backdrop-blur-sm">
          <p className="mt-3 text-base text-white">
            Explore student-friendly housing options in Kigali.
          </p>

          <Link
            href="https://wiyorent.com/listings"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-500"
          >
            Try wiyorent
          </Link>
        </div>
      </div>
    </div>
  );
}
