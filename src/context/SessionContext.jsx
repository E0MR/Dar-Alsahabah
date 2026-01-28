/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "../db";

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const [activeSessionId, setActiveSessionId] = useState(() => {
    const saved = localStorage.getItem("activeSessionId");
    return saved ? Number(saved) : 0;
  });
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const fetchSessions = async () => {
      const all = await db.examSessions.toArray();
      setSessions(all);
    };
    fetchSessions();
  }, []);

  useEffect(() => {
    localStorage.setItem("activeSessionId", activeSessionId);
  }, [activeSessionId]);

  return (
    <SessionContext.Provider
      value={{
        activeSessionId,
        setActiveSessionId,
        sessions,
        refreshSessions: async () => {
          const all = await db.examSessions.toArray();
          setSessions(all);
        },
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
