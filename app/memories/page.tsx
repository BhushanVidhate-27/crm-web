import { store } from "@/lib/store";
import { MemoryUpload } from "@/components/MemoryUpload";
import { MemoryGallery } from "@/components/MemoryGallery";

export const dynamic = "force-dynamic";

export default function MemoriesPage() {
  const memories = store.memories();

  return (
    <div className="animate-fade">
      <header className="mb-7">
        <h1 className="text-[26px] font-semibold tracking-tight text-neutral-900">Memories</h1>
        <p className="mt-1 text-[14px] text-neutral-500">
          The fun wall — upload photos from workouts, events and everything in between.
        </p>
      </header>

      <MemoryUpload />
      <div className="mt-6">
        <MemoryGallery memories={memories} />
      </div>
    </div>
  );
}