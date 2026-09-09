import { store } from "@/lib/store";
import { MembersGrid } from "@/components/MembersGrid";
import { AddMemberForm } from "@/components/AddMemberForm";

export const dynamic = "force-dynamic";

export default function MembersPage() {
  const members = store.members();
  const gyms = store.gyms();

  return (
    <div className="animate-fade">
      <header className="mb-7">
        <h1 className="text-[26px] font-semibold tracking-tight text-neutral-900">Members</h1>
        <p className="mt-1 text-[14px] text-neutral-500">
          Every member across all your branches, in one place.
        </p>
      </header>

      <AddMemberForm gyms={gyms} />
      <div className="mt-6">
        <MembersGrid members={members} gyms={gyms} />
      </div>
    </div>
  );
}