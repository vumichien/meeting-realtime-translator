// profile-card.tsx — Displays a single meeting profile with Use/Edit/Delete actions.
// Delete requires AlertDialog confirmation before removing.

import React from "react";
import { MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LANGUAGE_LABELS } from "@/config/languages";
import type { MeetingProfile } from "@/hooks/use-profiles";
import type { AllowedLang } from "@/config/languages";

interface ProfileCardProps {
  profile: MeetingProfile;
  isActive: boolean;
  onUse: (id: string) => void;
  onEdit: (profile: MeetingProfile) => void;
  onDelete: (id: string) => void;
}

export function ProfileCard({
  profile,
  isActive,
  onUse,
  onEdit,
  onDelete,
}: ProfileCardProps): React.JSX.Element {
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const langLabel =
    LANGUAGE_LABELS[profile.targetLanguage as AllowedLang] ?? profile.targetLanguage;

  const micDisplay = profile.micLabel || profile.micDeviceId || "System default";
  const envDisplay = profile.micEnv === "auto" ? "Auto-detect" : profile.micEnv;

  return (
    <>
      <Card className="relative">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <CardTitle className="text-base truncate">{profile.name}</CardTitle>
              {isActive && (
                <Badge variant="default" className="shrink-0 text-xs">
                  Active
                </Badge>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  aria-label="Profile actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isActive && (
                  <DropdownMenuItem onClick={() => onUse(profile.id)}>
                    Use this profile
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onEdit(profile)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-xs font-normal">
              {langLabel}
            </Badge>
            <Badge variant="outline" className="text-xs font-normal truncate max-w-[160px]">
              {micDisplay}
            </Badge>
            <Badge variant="outline" className="text-xs font-normal">
              {envDisplay}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete profile?</AlertDialogTitle>
            <AlertDialogDescription>
              "{profile.name}" will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete(profile.id);
                setDeleteOpen(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
