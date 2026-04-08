import React from "react";
import { createContext, useContext } from "react";
import { defaultIncidents, defaultPromoters } from "../data/seed";
import { useLocalStorageState } from "../hooks/useLocalStorageState";

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const [promoters, setPromoters] = useLocalStorageState(
    "promolocationPromoters",
    defaultPromoters,
  );
  const [incidents, setIncidents] = useLocalStorageState(
    "promolocationIncidents",
    defaultIncidents,
  );

  const addPromoter = (promoter) => {
    setPromoters((currentPromoters) => [...currentPromoters, promoter]);
  };

  const updatePromoterStatus = (userId, status) => {
    setPromoters((currentPromoters) =>
      currentPromoters.map((promoter) =>
        promoter.userId === userId ? { ...promoter, status } : promoter,
      ),
    );
  };

  const updateIncidentStatus = (userId, status) => {
    setIncidents((currentIncidents) =>
      currentIncidents.map((incident) =>
        incident.userId === userId ? { ...incident, status } : incident,
      ),
    );
  };

  return (
    <AppDataContext.Provider
      value={{
        promoters,
        incidents,
        addPromoter,
        updatePromoterStatus,
        updateIncidentStatus,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider.");
  }

  return context;
}
