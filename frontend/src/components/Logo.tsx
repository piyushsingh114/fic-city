import React from "react";
import logoSvg from "../assets/logo.svg";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  textClassName?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className = "",
  size = "md",
  showText = true,
  textClassName = ""
}) => {
  const sizeMap = {
    sm: "w-7 h-7",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20"
  };

  const textMap = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-4xl"
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <img
        src={logoSvg}
        alt="Fic City Logo"
        className={`${sizeMap[size]} object-contain drop-shadow-sm rounded-xl transition-transform hover:scale-105`}
      />
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black tracking-tight text-slate-900 dark:text-white ${textMap[size]} ${textClassName}`}
            >
              FIC <span className="text-emerald-600 dark:text-emerald-400">CITY</span>
            </span>
            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
              MCD 311
            </span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-tight mt-0.5">
            Civic Grievance Redressal
          </span>
        </div>
      )}
    </div>
  );
};
