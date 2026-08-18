import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

const CourseDetailPanel = ({ course, status, toggleStatus, onClose }) => {
  if (!course) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 right-0 h-full w-full md:w-[350px] glass-panel z-50 shadow-2xl border-l border-white/10 p-6 flex flex-col"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-textMuted hover:text-accentRed transition-colors p-1"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mt-8 mb-6">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider mb-3 bg-white/10 text-textMuted uppercase">
            Ders Detayı
          </div>
          <h2 className="text-3xl font-bold text-accentBlue mb-2">{course.code}</h2>
          <h3 className="text-lg text-textMain/90 leading-tight">{course.name}</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-textMuted text-xs mb-1">Kredi</div>
            <div className="text-2xl font-bold text-white">{course.credits || '-'}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-textMuted text-xs mb-1">AKTS</div>
            <div className="text-2xl font-bold text-white">{course.ects || '-'}</div>
          </div>
        </div>

        <div className="mb-8 flex-grow">
          <h4 className="text-sm font-semibold text-textMuted mb-3 uppercase tracking-wider">Ön Koşullar</h4>
          <div className="bg-black/20 rounded-xl p-4 border border-white/5 h-32 overflow-y-auto custom-scrollbar">
            <p className="text-sm text-white/80 leading-relaxed">
              {course.prereqStr || 'Bu ders için herhangi bir ön koşul bulunmamaktadır.'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-auto">
          <h4 className="text-sm font-semibold text-textMuted mb-1 uppercase tracking-wider text-center">Durum Güncelle</h4>
          
          <button 
            onClick={() => toggleStatus(course.code, 'passed')} 
            className={`flex items-center justify-center gap-2 p-3 rounded-xl transition-all duration-300 font-bold ${status === 'passed' ? 'bg-statusPassed text-white shadow-[0_0_15px_rgba(76,175,80,0.5)] scale-[1.02]' : 'bg-statusPassed/20 text-statusPassed hover:bg-statusPassed/40 border border-statusPassed/30'}`}
          >
            <CheckCircle className="w-5 h-5" /> Geçtim
          </button>
          
          <button 
            onClick={() => toggleStatus(course.code, 'failed')} 
            className={`flex items-center justify-center gap-2 p-3 rounded-xl transition-all duration-300 font-bold ${status === 'failed' ? 'bg-statusFailed text-white shadow-[0_0_15px_rgba(244,67,54,0.5)] scale-[1.02]' : 'bg-statusFailed/20 text-statusFailed hover:bg-statusFailed/40 border border-statusFailed/30'}`}
          >
            <XCircle className="w-5 h-5" /> Kaldım / Alıyorum
          </button>
          
          <button 
            onClick={() => toggleStatus(course.code, 'reset')} 
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-600/30 text-gray-300 hover:bg-gray-600/50 transition border border-gray-500/30 font-bold mt-2"
          >
            <RotateCcw className="w-5 h-5" /> Sıfırla
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CourseDetailPanel;
