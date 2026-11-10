import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useTranslation, LANGUAGES } from '../../i18n/LanguageContext';

const LanguageSwitcher = ({ className = '', compact = false }) => {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-surface-container hover:bg-surface-variant text-on-surface text-xs font-semibold border border-outline-variant/40 transition-colors focus:outline-none focus:ring-1 focus:ring-primary ${
          compact ? 'px-2 py-1 text-[11px]' : ''
        }`}
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-secondary shrink-0" />
        <span className="font-medium">{currentLang.nativeLabel}</span>
        <ChevronDown className={`w-3 h-3 text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-36 rounded-[14px] bg-surface border border-outline-variant/40 shadow-lg py-1.5 z-50 text-xs overflow-hidden soil-shadow animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary/80 font-mono border-b border-surface-variant mb-1">
            Language / भाषा
          </div>
          {LANGUAGES.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-on-surface hover:bg-surface-container font-medium'
                }`}
              >
                <div className="flex flex-col leading-tight">
                  <span className="text-xs">{lang.nativeLabel}</span>
                  <span className="text-[10px] text-on-surface-variant font-normal">
                    {lang.label}
                  </span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
