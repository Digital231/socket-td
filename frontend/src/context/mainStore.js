import { create } from "zustand";
import { persist } from "zustand/middleware";

const useStore = create(
  persist(
    (set) => ({
      username: "",
      setUsername: (username) => set({ username }),
      isLoggedIn: false,
      setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
      gameId: "",
      setGameId: (gameId) => set({ gameId }),
      gold: 100,
      setGold: (gold) => set({ gold }),
      goldPerSecond: 1,
      setGoldPerSecond: (goldPerSecond) => set({ goldPerSecond }),
    }),
    {
      name: "Tower-defense",
      storage: localStorage,
    }
  )
);

export default useStore;
