import React, { useState, useEffect } from 'react';
import { Search, GraduationCap } from 'lucide-react';

const Sidebar = ({ 
  plans, 
  faculty, setFaculty, 
  program, setProgram, 
  version, setVersion,
  searchTerm, setSearchTerm,
  activeCourse,
  courseStatuses,
  toggleStatus,
  obsLive, setObsLive,
  isMobileMenuOpen, setIsMobileMenuOpen
}) => {

  const faculties = Object.keys(plans).sort();
  const programs = faculty && plans[faculty] ? Object.keys(plans[faculty]).sort() : [];
  const versions = faculty && program && plans[faculty][program] ? Object.keys(plans[faculty][program]).sort((a,b) => b.localeCompare(a)) : [];

  // Auto-select Geomatics as default
  useEffect(() => {
    if (faculties.includes("İnşaat Fakültesi") && !faculty) {
      setFaculty("İnşaat Fakültesi");
      setTimeout(() => {
        setProgram("Geomatik Mühendisliği Lisans");
        setTimeout(() => {
          setVersion("2021-2022 / Güz Dönemi Sonrası");
        }, 50);
      }, 50);
    }
  }, [plans]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-bgSecondary/95 backdrop-blur-md border-r border-white/10 h-full flex flex-col p-6 shadow-2xl shrink-0 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto custom-scrollbar`}>
        
        {/* Mobile Close Button */}
        <button 
          className="md:hidden absolute top-4 right-4 p-2 text-textMuted hover:text-white transition bg-bgPrimary/50 rounded-lg"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight">İTÜ<span className="text-accentRed">Zincir</span></h2>
          <p className="text-textMuted text-sm mt-1">Ön Koşul Görselleştirici V2</p>
        </div>

        <div className="space-y-4 flex-grow">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-textMuted font-medium">Fakülte:</label>
          <select 
            className="p-2 bg-bgPrimary border border-white/10 rounded-md outline-none focus:border-accentBlue transition-colors text-sm"
            value={faculty} onChange={(e) => { setFaculty(e.target.value); setProgram(''); setVersion(''); }}
          >
            <option value="">Seçiniz...</option>
            {faculties.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-textMuted font-medium">Program:</label>
          <select 
            className="p-2 bg-bgPrimary border border-white/10 rounded-md outline-none focus:border-accentBlue transition-colors text-sm"
            value={program} onChange={(e) => { setProgram(e.target.value); setVersion(''); }}
            disabled={!faculty}
          >
            <option value="">Seçiniz...</option>
            {programs.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-textMuted font-medium">Müfredat Yılı:</label>
          <select 
            className="p-2 bg-bgPrimary border border-white/10 rounded-md outline-none focus:border-accentBlue transition-colors text-sm"
            value={version} 
            onChange={(e) => {
              setVersion(e.target.value);
              // Close mobile menu when a full curriculum is selected
              if (window.innerWidth < 768 && e.target.value !== "") {
                setIsMobileMenuOpen(false);
              }
            }}
            disabled={!program}
          >
            <option value="">Seçiniz...</option>
            {versions.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div className="relative mt-6">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-textMuted" />
          <input 
            type="text" 
            placeholder="Ders Ara (Örn: GEO 201)" 
            className="w-full p-2 pl-9 bg-bgPrimary border border-white/10 rounded-md outline-none focus:border-accentBlue transition-colors text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={!version}
          />
        </div>

        <div className="mt-8 bg-bgPanel p-4 rounded-xl border border-white/5">
          <h3 className="text-sm font-semibold mb-3 border-b border-white/10 pb-2">Lejant</h3>
          <div className="space-y-2 text-sm text-textMain/80">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-statusPassed shadow-[0_0_8px_rgba(76,175,80,0.6)]"></div> Geçildi</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-statusFailed shadow-[0_0_8px_rgba(244,67,54,0.6)]"></div> Kalındı</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-statusAvailable shadow-[0_0_8px_rgba(255,235,59,0.6)]"></div> Alınabilir</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-statusLocked"></div> Kilitli (Ön Koşul)</div>
          </div>
        </div>

        <div className="mt-4 bg-bgPanel p-4 rounded-xl border border-white/5 flex-grow flex items-center justify-center text-center">
          <p className="text-sm text-textMuted italic flex flex-col items-center gap-2">
            <GraduationCap className="w-8 h-8 opacity-50" />
            Detayları ve AKTS bilgilerini görmek, dersi "Geçti" olarak işaretlemek için sağdaki haritadan bir derse tıklayın.
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 text-sm text-textMuted bg-bgPrimary p-3 rounded-lg border border-white/5">
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={obsLive} onChange={(e) => setObsLive(e.target.checked)} />
          <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accentRed"></div>
        </label>
        <span className="font-medium">OBS Canlı Veri (Deneysel)</span>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
