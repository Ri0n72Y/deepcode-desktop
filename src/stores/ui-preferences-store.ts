import { create } from "zustand";

type UiPreferencesState = {
  showSkills: boolean;
  showTools: boolean;
  setShowSkills: (value: boolean) => void;
  setShowTools: (value: boolean) => void;
};

export const useUiPreferencesStore = create<UiPreferencesState>((set) => ({
  showSkills: false,
  showTools: true,
  setShowSkills: (value) => set({ showSkills: value }),
  setShowTools: (value) => set({ showTools: value }),
}));
