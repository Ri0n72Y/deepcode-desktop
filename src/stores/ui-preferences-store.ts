import { create } from "zustand";

type UiPreferencesState = {
  showSkills: boolean;
  setShowSkills: (value: boolean) => void;
};

export const useUiPreferencesStore = create<UiPreferencesState>((set) => ({
  showSkills: false,
  setShowSkills: (value) => set({ showSkills: value }),
}));
