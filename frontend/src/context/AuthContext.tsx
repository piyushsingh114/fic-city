import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Employee } from "../types";

interface AuthContextType {
  // Citizen Auth
  citizen: User | null;
  citizenToken: string | null;
  isCitizenAuthenticated: boolean;
  loginCitizen: (data: { user: User; token: string }) => void;
  logoutCitizen: () => void;

  // Admin / Employee Auth
  employee: Employee | null;
  employeeToken: string | null;
  isEmployeeAuthenticated: boolean;
  loginEmployee: (data: { employee: Employee; token: string }) => void;
  logoutEmployee: () => void;

  // Theme & Language
  isDarkMode: boolean;
  toggleTheme: () => void;
  language: "en" | "hi";
  toggleLanguage: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Citizen state
  const [citizen, setCitizen] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("fic_citizen_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [citizenToken, setCitizenToken] = useState<string | null>(() => {
    return localStorage.getItem("fic_citizen_token") || null;
  });

  // Employee state
  const [employee, setEmployee] = useState<Employee | null>(() => {
    try {
      const stored = localStorage.getItem("fic_employee_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [employeeToken, setEmployeeToken] = useState<string | null>(() => {
    return localStorage.getItem("fic_employee_token") || null;
  });

  // Dark mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("fic_theme") === "dark";
  });

  // Language
  const [language, setLanguage] = useState<"en" | "hi">(() => {
    return (localStorage.getItem("fic_lang") as "en" | "hi") || "en";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("fic_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("fic_theme", "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const next = prev === "en" ? "hi" : "en";
      localStorage.setItem("fic_lang", next);
      return next;
    });
  };

  const loginCitizen = (data: { user: User; token: string }) => {
    setCitizen(data.user);
    setCitizenToken(data.token);
    localStorage.setItem("fic_citizen_user", JSON.stringify(data.user));
    localStorage.setItem("fic_citizen_token", data.token);
  };

  const logoutCitizen = () => {
    setCitizen(null);
    setCitizenToken(null);
    localStorage.removeItem("fic_citizen_user");
    localStorage.removeItem("fic_citizen_token");
  };

  const loginEmployee = (data: { employee: Employee; token: string }) => {
    setEmployee(data.employee);
    setEmployeeToken(data.token);
    localStorage.setItem("fic_employee_user", JSON.stringify(data.employee));
    localStorage.setItem("fic_employee_token", data.token);
  };

  const logoutEmployee = () => {
    setEmployee(null);
    setEmployeeToken(null);
    localStorage.removeItem("fic_employee_user");
    localStorage.removeItem("fic_employee_token");
  };

  return (
    <AuthContext.Provider
      value={{
        citizen,
        citizenToken,
        isCitizenAuthenticated: Boolean(citizenToken),
        loginCitizen,
        logoutCitizen,
        employee,
        employeeToken,
        isEmployeeAuthenticated: Boolean(employeeToken),
        loginEmployee,
        logoutEmployee,
        isDarkMode,
        toggleTheme,
        language,
        toggleLanguage
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
