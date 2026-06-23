import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Option {
  value: string | number;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface CustomSelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: any) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select option",
  label,
  className = "",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative flex flex-col gap-1.5 w-full text-left ${className}`}>
      {label && (
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full h-11 px-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-700 shadow-xs focus:outline-none transition-all duration-200 active:scale-[0.99] cursor-pointer"
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption?.icon && (
            <selectedOption.icon className="h-4 w-4 text-[#0B2A96]/70" />
          )}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? "transform rotate-180 text-[#0B2A96]" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto"
          >
            <div className="p-1 space-y-0.5">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full h-10 px-3 rounded-lg flex items-center justify-between text-xs font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#0B2A96]/5 text-[#0B2A96] font-bold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span className="truncate flex items-center gap-2">
                      {opt.icon && (
                        <opt.icon className={`h-4 w-4 ${isSelected ? "text-[#0B2A96]" : "text-slate-400"}`} />
                      )}
                      {opt.label}
                    </span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-[#0B2A96]" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
