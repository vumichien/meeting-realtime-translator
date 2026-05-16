// profile-form-dialog.tsx — Create / Edit meeting profile dialog.
// Validates: name required + max 40 chars. Saves via useProfiles().

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfiles, type MeetingProfile, type ProfileDraft } from "@/hooks/use-profiles";
import { useDevices } from "@/hooks/use-devices";
import { ALLOWED_LANGS, LANGUAGE_LABELS } from "@/config/languages";
import type { MicEnvSetting } from "@/lib/mic-env-detect";

interface ProfileFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided — edit mode. When absent — create mode. */
  editProfile?: MeetingProfile;
}

const MIC_ENVS: { value: MicEnvSetting; label: string }[] = [
  { value: "auto", label: "Auto-detect" },
  { value: "headset", label: "Headset" },
  { value: "laptop", label: "Laptop mic" },
  { value: "room", label: "Room mic" },
];

const EMPTY_DRAFT: ProfileDraft = {
  name: "",
  targetLanguage: "ja",
  micEnv: "auto",
  micDeviceId: "",
  micLabel: "",
  outputDeviceId: "",
  outputLabel: "",
};

export function ProfileFormDialog({
  open,
  onOpenChange,
  editProfile,
}: ProfileFormDialogProps): React.JSX.Element {
  const { create, update } = useProfiles();
  const { mics, outputs } = useDevices();

  const isEdit = !!editProfile;
  const [draft, setDraft] = useState<ProfileDraft>(EMPTY_DRAFT);
  const [nameError, setNameError] = useState<string | null>(null);

  // Populate form when opening for edit, or reset for create.
  useEffect(() => {
    if (open) {
      if (editProfile) {
        setDraft({
          name: editProfile.name,
          targetLanguage: editProfile.targetLanguage,
          micEnv: editProfile.micEnv,
          micDeviceId: editProfile.micDeviceId,
          micLabel: editProfile.micLabel,
          outputDeviceId: editProfile.outputDeviceId,
          outputLabel: editProfile.outputLabel,
        });
      } else {
        setDraft(EMPTY_DRAFT);
      }
      setNameError(null);
    }
  }, [open, editProfile]);

  function handleSet<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    if (key === "name") setNameError(null);
  }

  function handleMicChange(deviceId: string) {
    const device = mics.find((d) => d.deviceId === deviceId);
    setDraft((prev) => ({
      ...prev,
      micDeviceId: deviceId,
      micLabel: device?.label ?? "",
    }));
  }

  function handleOutputChange(deviceId: string) {
    const device = outputs.find((d) => d.deviceId === deviceId);
    setDraft((prev) => ({
      ...prev,
      outputDeviceId: deviceId,
      outputLabel: device?.label ?? "",
    }));
  }

  function validate(): boolean {
    const trimmed = draft.name.trim();
    if (!trimmed) {
      setNameError("Profile name is required.");
      return false;
    }
    if (trimmed.length > 40) {
      setNameError("Name must be 40 characters or fewer.");
      return false;
    }
    return true;
  }

  function handleSave() {
    if (!validate()) return;
    const finalDraft: ProfileDraft = {
      ...draft,
      name: draft.name.trim(),
    };
    if (isEdit && editProfile) {
      update(editProfile.id, finalDraft);
    } else {
      create(finalDraft);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit profile" : "Create profile"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Profile name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pfd-name" className="text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="pfd-name"
              value={draft.name}
              maxLength={40}
              placeholder="e.g. Morning standup"
              onChange={(e) => handleSet("name", e.target.value)}
              aria-invalid={!!nameError}
            />
            {nameError && (
              <p className="text-xs text-destructive">{nameError}</p>
            )}
          </div>

          {/* Target language */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Target language</label>
            <Select
              value={draft.targetLanguage}
              onValueChange={(v) => handleSet("targetLanguage", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALLOWED_LANGS.map((code) => (
                  <SelectItem key={code} value={code}>
                    {LANGUAGE_LABELS[code]} ({code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mic device */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Microphone</label>
            <Select
              value={draft.micDeviceId || "__none__"}
              onValueChange={(v) => handleMicChange(v === "__none__" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="System default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">System default</SelectItem>
                {mics.map((d) => (
                  <SelectItem key={d.deviceId} value={d.deviceId}>
                    {d.label || d.deviceId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Output device */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Output / Speaker</label>
            <Select
              value={draft.outputDeviceId || "__none__"}
              onValueChange={(v) => handleOutputChange(v === "__none__" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="System default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">System default</SelectItem>
                {outputs.map((d) => (
                  <SelectItem key={d.deviceId} value={d.deviceId}>
                    {d.label || d.deviceId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mic environment */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Mic environment</label>
            <Select
              value={draft.micEnv}
              onValueChange={(v) => handleSet("micEnv", v as MicEnvSetting)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MIC_ENVS.map((env) => (
                  <SelectItem key={env.value} value={env.value}>
                    {env.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{isEdit ? "Save changes" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
