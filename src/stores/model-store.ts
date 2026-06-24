import { create } from "zustand";
import type { ModelConfig } from "../lib/runtime/types";

type ModelState = {
  value: ModelConfig | null;
  setValue: (nextValue: ModelConfig | null) => void;
};

export const useModelStore = create<ModelState>((set) => ({
  value: null,
  setValue: (nextValue) => set({ value: nextValue }),
}));
