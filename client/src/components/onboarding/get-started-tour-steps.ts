import type { Placement } from "react-joyride";
import type { View } from "@/components/shell/shell-types";

export type TourStepView = View | "current";

export interface GetStartedTourStep {
  id: string;
  target: string;
  title: string;
  content: string;
  view: TourStepView;
  placement?: Placement | "center";
}

export const TOUR_IDS = {
  sidebarNav: "sidebar-nav",
  navTranslate: "nav-translate",
  translateMain: "translate-main",
  firstRunHero: "first-run-hero",
  sourceMicSelect: "source-mic-select",
  outputDeviceSelect: "output-device-select",
  targetLanguageSelect: "target-language-select",
  startTranslationButton: "start-translation-button",
  clearButton: "clear-button",
  devicesAudioCard: "devices-audio-card",
  providersList: "providers-list",
  setupDoctor: "setup-doctor",
  profilesList: "profiles-list",
  transcriptsList: "transcripts-list",
  settingsSections: "settings-sections",
} as const;

const tourTarget = (id: string) => `[data-tour-id="${id}"]`;

export const GET_STARTED_TOUR_STEPS: GetStartedTourStep[] = [
  {
    id: "welcome",
    target: "body",
    title: "Welcome to Babel Mic",
    content: "Take a quick tour of the controls you need before your first meeting.",
    view: "translate",
    placement: "center",
  },
  {
    id: "main-places",
    target: tourTarget(TOUR_IDS.sidebarNav),
    title: "Main places",
    content: "Use this sidebar to move between translation, setup, diagnostics, and saved sessions.",
    view: "current",
    placement: "right",
  },
  {
    id: "translate-area",
    target: tourTarget(TOUR_IDS.firstRunHero),
    title: "Ready to translate",
    content: "This checklist confirms your mic, output device, and provider are set. All three green unlocks the Start button.",
    view: "translate",
    placement: "bottom",
  },
  {
    id: "source-mic",
    target: tourTarget(TOUR_IDS.sourceMicSelect),
    title: "Choose your real mic",
    content: "Pick the microphone you speak into. Do not choose the virtual cable here.",
    view: "translate",
    placement: "top",
  },
  {
    id: "meeting-output",
    target: tourTarget(TOUR_IDS.outputDeviceSelect),
    title: "Send audio to the meeting",
    content: "Choose the virtual cable playback side so Zoom or Meet can hear the translation.",
    view: "translate",
    placement: "top",
  },
  {
    id: "target-language",
    target: tourTarget(TOUR_IDS.targetLanguageSelect),
    title: "Pick listener language",
    content: "Set the language your meeting participants should hear.",
    view: "translate",
    placement: "top",
  },
  {
    id: "start-session",
    target: tourTarget(TOUR_IDS.startTranslationButton),
    title: "Start when ready",
    content: "Start begins the realtime session. Run setup checks first for important meetings.",
    view: "translate",
    placement: "top",
  },
  {
    id: "clear-session",
    target: tourTarget(TOUR_IDS.clearButton),
    title: "Clear saves your session",
    content: "After a meeting, Clear automatically saves the full transcript to the Transcripts screen.",
    view: "translate",
    placement: "top",
  },
  {
    id: "devices",
    target: tourTarget(TOUR_IDS.devicesAudioCard),
    title: "Device setup",
    content: "Use Devices to confirm your microphone, virtual cable output, and test tone routing.",
    view: "devices",
  },
  {
    id: "providers",
    target: tourTarget(TOUR_IDS.providersList),
    title: "Provider keys",
    content: "Configure your translation provider here. Keys stay local to this app.",
    view: "providers",
  },
  {
    id: "setup-doctor",
    target: tourTarget(TOUR_IDS.setupDoctor),
    title: "Setup Doctor",
    content: "Run these checks before a real meeting to catch audio routing problems early.",
    view: "diagnostics",
  },
  {
    id: "profiles",
    target: tourTarget(TOUR_IDS.profilesList),
    title: "Meeting profiles",
    content: "Save recurring device and language setups so future meetings take less time.",
    view: "profiles",
  },
  {
    id: "transcripts",
    target: tourTarget(TOUR_IDS.transcriptsList),
    title: "Session history",
    content: "Sessions saved by Clear appear here. Export as TXT, SRT, or JSON for records.",
    view: "transcripts",
  },
  {
    id: "settings",
    target: tourTarget(TOUR_IDS.settingsSections),
    title: "Fine tune behavior",
    content: "Adjust captions, cost guardrails, appearance, and app information from Settings.",
    view: "settings",
    placement: "right",
  },
];
