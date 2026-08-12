import { create } from "zustand";
import { USER_EMAIL_STORAGE_KEY, isValidEmail } from "../utils/auth";

type AuthState = {
  userEmail: string;
  emailInput: string;
  emailError: string;
  setEmailInput: (emailInput: string) => void;
  submitEmail: () => boolean;
  signOut: () => void;
};

const initialUserEmail = localStorage.getItem(USER_EMAIL_STORAGE_KEY) ?? "";

export const useAuthStore = create<AuthState>((set, get) => ({
  userEmail: initialUserEmail,
  emailInput: initialUserEmail,
  emailError: "",
  setEmailInput: (emailInput) => set({ emailInput }),
  submitEmail: () => {
    const normalizedEmail = get().emailInput.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      set({ emailError: "Enter a valid email address" });
      return false;
    }

    localStorage.setItem(USER_EMAIL_STORAGE_KEY, normalizedEmail);
    set({
      userEmail: normalizedEmail,
      emailInput: normalizedEmail,
      emailError: "",
    });
    return true;
  },
  signOut: () => {
    localStorage.removeItem(USER_EMAIL_STORAGE_KEY);
    set({ userEmail: "", emailInput: "", emailError: "" });
  },
}));
