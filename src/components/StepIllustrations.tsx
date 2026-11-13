import React from 'react';

/**
 * Minimalist flat SVG illustration for Step 1: Dental Floss (Fio Dental)
 */
export const FlossIllustration: React.FC = () => {
  return (
    <div className="w-40 h-40 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto">
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Gum base */}
        <rect x="16" y="76" width="88" height="24" rx="10" fill="#FDA4AF" stroke="#0F172A" strokeWidth="3" />
        {/* Left Tooth */}
        <path
          d="M26 42C26 33.1634 33.1634 26 42 26H46C52.6274 26 58 31.3726 58 38V78H26V42Z"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="3"
        />
        {/* Right Tooth */}
        <path
          d="M62 38C62 31.3726 67.3726 26 74 26H78C86.8366 26 94 33.1634 94 42V78H62V38Z"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="3"
        />
        {/* Floss line forming a C shape around the tooth */}
        <path
          d="M12 20L52 44C60 52 60 66 52 74L108 20"
          stroke="#0D9488"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Floss handle nodes */}
        <circle cx="12" cy="20" r="5" fill="#0D9488" />
        <circle cx="108" cy="20" r="5" fill="#0D9488" />
      </svg>
    </div>
  );
};

/**
 * Minimalist flat SVG illustration for Step 3: Mouthwash (Enxaguante Bucal)
 */
export const MouthwashIllustration: React.FC = () => {
  return (
    <div className="w-40 h-40 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto">
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Cap */}
        <rect x="46" y="16" width="28" height="14" rx="4" fill="#0284C7" stroke="#0F172A" strokeWidth="3" />
        {/* Neck */}
        <rect x="50" y="30" width="20" height="10" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3" />
        {/* Bottle body */}
        <rect x="32" y="40" width="56" height="64" rx="12" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3" />
        {/* Liquid level */}
        <path
          d="M35 62H85V92C85 97.5228 80.5228 102 75 102H45C39.4772 102 35 97.5228 35 92V62Z"
          fill="#38BDF8"
        />
        {/* Plus / Fresh cross symbol */}
        <path d="M60 72V88M52 80H68" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  );
};

