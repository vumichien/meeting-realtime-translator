// profiles-screen.tsx — List + CRUD for meeting profiles.
// Uses useProfiles() for reactive state. Create/edit via ProfileFormDialog.

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfiles, type MeetingProfile } from "@/hooks/use-profiles";
import { ProfileCard } from "./profile-card";
import { ProfileFormDialog } from "./profile-form-dialog";

export function ProfilesScreen(): React.JSX.Element {
  const { profiles, activeId, setActive, remove } = useProfiles();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MeetingProfile | undefined>(undefined);

  function handleCreate() {
    setEditTarget(undefined);
    setDialogOpen(true);
  }

  function handleEdit(profile: MeetingProfile) {
    setEditTarget(profile);
    setDialogOpen(true);
  }

  function handleDialogClose(open: boolean) {
    setDialogOpen(open);
    if (!open) setEditTarget(undefined);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Profiles</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Save device and language settings as reusable meeting presets.
          </p>
        </div>
        <Button onClick={handleCreate} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          New profile
        </Button>
      </div>

      {profiles.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">
            No profiles yet. Create one to quickly restore your device and language settings.
          </p>
          <Button variant="outline" onClick={handleCreate} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Create first profile
          </Button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              isActive={profile.id === activeId}
              onUse={setActive}
              onEdit={handleEdit}
              onDelete={remove}
            />
          ))}
        </div>
      )}

      <ProfileFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        editProfile={editTarget}
      />
    </div>
  );
}
