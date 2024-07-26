import { create } from "zustand";
import { persist } from "zustand/middleware";

const useStore = create(
  persist(
    (set) => ({
      username: "",
      setUsername: (username) => set({ username: username }),
      isLoggedIn: false,
      setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn: isLoggedIn }),
    }),
    {
      name: "Tower-defense",
      storage: localStorage,
    }
  )
);

export default useStore;
