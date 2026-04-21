import React from 'react';
import { X, Award } from 'lucide-react';

/**
 * Demo certificate overlay: shown after the user clicks Certificate on a mission row.
 * Trainee name is fixed per product demo (Rahul O P).
 */
export default function CourseCertificateModal({
  isOpen,
  onClose,
  missionTitle,
  trackLabel,
  accent = 'blue',
}) {
  if (!isOpen) return null;

  const accentRing =
    accent === 'red'
      ? 'border-red-600 shadow-[6px_6px_0_0_rgb(220,38,38)]'
      : 'border-blue-600 shadow-[6px_6px_0_0_rgb(37,99,235)]';
  const badgeBg = accent === 'red' ? 'bg-red-600' : 'bg-blue-600';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cert-title"
    >
      <div
        className={`relative w-full max-w-lg bg-white border-4 ${accentRing} p-6 sm:p-8 md:p-10 my-auto sm:mx-0 mx-3 max-h-[92dvh] overflow-y-auto shadow-2xl rounded-t-2xl sm:rounded-xl`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 min-w-11 min-h-11 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors touch-manipulation rounded-lg hover:bg-slate-100"
          aria-label="Close"
        >
          <X size={22} />
        </button>

        <div className="flex justify-center mb-6">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${badgeBg} text-white`}
          >
            <Award size={32} strokeWidth={2} />
          </div>
        </div>

        <p
          id="cert-title"
          className="text-center text-[10px] font-black uppercase tracking-[0.35em] text-slate-400 mb-2"
        >
          Certificate of completion
        </p>
        <h2 className="text-center text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase leading-tight mb-1">
          {trackLabel}
        </h2>
        <p className="text-center text-sm text-slate-500 mb-8">Thales Edutech — training record</p>

        <div className="border-y-2 border-slate-200 py-6 mb-6">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            This certifies that
          </p>
          <p className="text-center text-2xl font-black text-slate-900">Rahul O P</p>
          <p className="text-center text-sm text-slate-600 mt-4 leading-relaxed">
            has successfully completed the course module
          </p>
          <p className="text-center text-lg font-bold text-slate-900 mt-2 px-2">{missionTitle}</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4 text-center sm:text-left">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
            <p className="text-sm font-black text-green-600 mt-1">ISSUED — VERIFIED</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</p>
            <p className="text-sm font-bold text-slate-900 mt-1">21 April 2026</p>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 text-center mt-8 font-mono">
          REF-{accent === 'red' ? 'CYB' : 'AERO'}-EDU-2026-0421
        </p>
      </div>
    </div>
  );
}
