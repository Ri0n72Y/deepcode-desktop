import { create } from "zustand";
import type { SkillInfo } from "../lib/runtime/types";

type SkillState = {
  available: SkillInfo[];
  selected: SkillInfo[];
  setAvailable: (items: SkillInfo[]) => void;
  toggle: (item: SkillInfo) => void;
  remove: (name: string) => void;
  clearSelected: () => void;
};

export const useSkillStore = create<SkillState>((set) => ({
  available: [],
  selected: [],
  setAvailable: (items) => set({ available: items }),
  toggle: (item) =>
    set((state) => {
      const exists = state.selected.some((value) => value.name === item.name);
      return { selected: exists ? state.selected.filter((value) => value.name !== item.name) : [...state.selected, item] };
    }),
  remove: (name) => set((state) => ({ selected: state.selected.filter((value) => value.name !== name) })),
  clearSelected: () => set({ selected: [] }),
}));
