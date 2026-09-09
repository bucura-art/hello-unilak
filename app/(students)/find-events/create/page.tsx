'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CreateEventForm from '@/components/moderator/CreateEventForm';
import { createClient } from '@/utils/supabase/client';

type EventForm = {
  title: string;
  category: string;
  startDate: string;
  endDate: string;
  duration: string;
  venue: 'online' | 'on-site';
  venueValue: string;
};

export default function CreateEventPage() {
  const router = useRouter();
  const supabase = createClient();
  const [toast, setToast] = useState<string | null>(null);
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsSignedIn(Boolean(user));
    };

    void checkUser();
  }, [supabase]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async (form: EventForm, flyer: File | null) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      notify('You must be signed in to create an event.');
      return;
    }

    if (!flyer) {
      notify('Please upload an event flyer before publishing.');
      return;
    }

    const safeName = flyer.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage.from('event-flyers').upload(path, flyer, { upsert: false });
    if (uploadError) {
      notify('Failed to upload the flyer. Please try again.');
      return;
    }

    const flyerUrl = supabase.storage.from('event-flyers').getPublicUrl(path).data.publicUrl;

    const { error } = await supabase.from('events_table').insert({
      title: form.title,
      category: form.category,
      flyer_url: flyerUrl,
      start_date: new Date(form.startDate).toISOString(),
      end_date: new Date(form.endDate).toISOString(),
      duration: form.duration,
      venue: form.venue,
      venue_value: form.venueValue,
      created_by: user.id,
      status: 'published',
      published_at: new Date().toISOString(),
    });

    if (error) {
      notify(error.message || 'Failed to create event.');
      return;
    }

    notify('Event created successfully.');
    setTimeout(() => {
      router.push('/find-events');
    }, 800);
  };

  if (isSignedIn === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#535350] px-4 py-12 text-white">
        <div className="max-w-md rounded-2xl border border-white/10 bg-gray-900 p-8 text-center shadow-xl">
          <h2 className="text-2xl font-bold">Join the community to post an event</h2>
          <p className="mt-3 text-white/70">
            Publish an event for the UNILAK students to join you.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/auth?next=/find-events/create"
              className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-5 py-3 font-bold text-white transition hover:bg-blue-400"
            >
              Join Community
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#535350] p-4 text-white">
      {toast && (
        <div className="fixed right-6 top-6 z-60 rounded-lg bg-gray-900 px-5 py-3 font-semibold shadow-xl">
          {toast}
        </div>
      )}

      {isSignedIn ? (
        <CreateEventForm
          event={null}
          onClose={() => router.push('/find-events')}
          onSave={handleSave}
        />
      ) : (
        <div className="flex min-h-[70vh] items-center justify-center">
          <p className="text-white/70">Checking your status...</p>
        </div>
      )}
    </div>
  );
}
