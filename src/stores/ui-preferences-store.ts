import { create } from "zustand";
import { persist } from "zustand/middleware";

type UiPreferencesState = {
  showSkills: boolean;
  showTools: boolean;
  setShowSkills: (value: boolean) => void;
  setShowTools: (value: boolean) => void;
};

export const useUiPreferencesStore = create<UiPreferencesState>()(
  persist(
    (set) => ({
      showSkills: true,
      showTools: true,
      setShowSkills: (value) => set({ showSkills: value }),
      setShowTools: (value) => set({ showTools: value }),
    }),
    { name: "deepcode-ui-preferences" },
  ),
);
