import React, { useState, useRef, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import CourseGrid from './components/CourseGrid';
import Connections from './components/Connections';
import CourseDetailPanel from './components/CourseDetailPanel';
import { useItuData } from './hooks/useItuData';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Xwrapper } from 'react-xarrows';
import html2canvas from 'html2canvas';
import { ZoomIn, ZoomOut, Maximize, Sun, Moon, Download } from 'lucide-react';

function App() {
  const { courses, plans, loading, error } = useItuData();
  const [courseStatuses, setCourseStatuses] = useLocalStorage('itu-prereq-status-v2', {});
  
  const [faculty, setFaculty] = useState('');
  const [program, setProgram] = useState('');
  const [version, setVersion] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCourse, setActiveCourse] = useState(null);
  const [obsLive, setObsLive] = useState(false);
  
  // Theme State
  const [theme, setTheme] = useState('dark');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Highlighting State
  const [highlightedMain, setHighlightedMain] = useState(null);
  const [highlightedPrereqs, setHighlightedPrereqs] = useState([]);
  const [highlightedPostreqs, setHighlightedPostreqs] = useState([]);

  // Canvas State
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Get currently selected semesters
  const currentSemesters = faculty && program && version && plans[faculty]?.[program]?.[version] 
    ? plans[faculty][program][version] 
    : [];

  const handleToggleStatus = (code, status) => {
    setCourseStatuses(prev => {
      const next = { ...prev };
      if (status === 'reset') {
        delete next[code];
      } else {
        next[code] = status;
      }
      return next;
    });
  };

  const handleCourseHover = useCallback((code) => {
    setHighlightedMain(code);
    
    // Find all prereqs recursively
    const prereqs = new Set();
    const findPrereqs = (c) => {
      if(courses[c] && courses[c].reqs) {
        courses[c].reqs.forEach(req => {
          prereqs.add(req);
          findPrereqs(req);
        });
      }
    };
    findPrereqs(code);
    
    // Find all postreqs recursively
    const postreqs = new Set();
    const findPostreqs = (c) => {
      currentSemesters.flat().forEach(item => {
        if (item.type === 'course' && courses[item.code]?.reqs?.includes(c)) {
          postreqs.add(item.code);
          findPostreqs(item.code);
        }
      });
    };
    findPostreqs(code);

    setHighlightedPrereqs([...prereqs]);
    setHighlightedPostreqs([...postreqs]);
  }, [courses, currentSemesters]);

  const handleCourseHoverEnd = useCallback(() => {
    setHighlightedMain(null);
    setHighlightedPrereqs([]);
    setHighlightedPostreqs([]);
  }, []);

  // Calculate Progress Stats
  const curriculumStats = React.useMemo(() => {
    let totalCredits = 0;
    let totalEcts = 0;
    let passedCredits = 0;
    let passedEcts = 0;

    currentSemesters.flat().forEach(item => {
      if (item.type === 'course' && courses[item.code]) {
        const c = parseFloat(courses[item.code].credits) || 0;
        const e = parseFloat(courses[item.code].ects) || 0;
        totalCredits += c;
        totalEcts += e;
        
        if (courseStatuses[item.code] === 'passed') {
          passedCredits += c;
          passedEcts += e;
        }
      }
    });

    return { totalCredits, totalEcts, passedCredits, passedEcts };
  }, [currentSemesters, courses, courseStatuses]);

  // Pan functionality
  const handleMouseDown = (e) => {
    if(e.target.closest('.course-card')) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - canvasRef.current.offsetLeft,
      y: e.clientY - canvasRef.current.offsetTop,
      scrollLeft: canvasRef.current.scrollLeft,
      scrollTop: canvasRef.current.scrollTop
    });
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.clientX - canvasRef.current.offsetLeft;
    const y = e.clientY - canvasRef.current.offsetTop;
    const walkX = (x - dragStart.x) * 1.5;
    const walkY = (y - dragStart.y) * 1.5;
    canvasRef.current.scrollLeft = dragStart.scrollLeft - walkX;
    canvasRef.current.scrollTop = dragStart.scrollTop - walkY;
  };

  const handleExport = async () => {
    if (!canvasRef.current) return;
    try {
      const element = canvasRef.current.children[0]; // The div containing Xwrapper
      const canvas = await html2canvas(element, {
        backgroundColor: theme === 'dark' ? '#0a1128' : '#f8fafc',
        scale: 2, // High resolution
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `ITU-Zincir-${program.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
      alert("Görüntü dışa aktarılamadı.");
    }
  };

  if (loading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-bgPrimary">
        <div className="w-16 h-16 border-4 border-white/10 border-t-accentBlue rounded-full animate-spin mb-6"></div>
        <p className="text-lg text-textMuted font-medium tracking-wide">Müfredat ve ders verileri yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-bgPrimary">
        <div className="bg-bgPanel p-8 rounded-xl border border-accentRed/50 text-center">
          <p className="text-accentRed text-lg mb-2">Veriler yüklenirken hata oluştu!</p>
          <p className="text-textMuted text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Sidebar 
        plans={plans}
        faculty={faculty} setFaculty={setFaculty}
        program={program} setProgram={setProgram}
        version={version} setVersion={setVersion}
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        activeCourse={activeCourse}
        courseStatuses={courseStatuses}
        toggleStatus={handleToggleStatus}
        obsLive={obsLive} setObsLive={setObsLive}
      />
      
      <main className="flex-grow relative bg-gradient-to-br from-bgSecondary to-bgPrimary overflow-hidden">
        
        {/* Progress Bar */}
        {currentSemesters.length > 0 && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-4 pointer-events-none">
            <div className="glass-panel p-4 rounded-xl flex flex-col gap-2 pointer-events-auto shadow-2xl">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span>Mezuniyet İlerlemesi</span>
                <span className="text-accentBlue">{((curriculumStats.passedEcts / (curriculumStats.totalEcts || 1)) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden border border-white/5 relative">
                <div 
                  className="bg-accentBlue h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(76,201,240,0.8)]"
                  style={{ width: `${Math.min(100, (curriculumStats.passedEcts / (curriculumStats.totalEcts || 1)) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-textMuted mt-1">
                <span>Kredi: <strong className="text-white">{curriculumStats.passedCredits}</strong> / {curriculumStats.totalCredits}</span>
                <span>AKTS: <strong className="text-white">{curriculumStats.passedEcts}</strong> / {curriculumStats.totalEcts}</span>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="absolute top-6 right-6 z-30 flex gap-2">
          <button onClick={handleExport} className="w-10 h-10 flex items-center justify-center glass-panel rounded-lg hover:bg-accentBlue hover:text-white transition group mr-2" title="Görüntüyü İndir (PNG)">
            <Download className="w-5 h-5 group-hover:scale-110 transition" />
          </button>
          <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className="w-10 h-10 flex items-center justify-center glass-panel rounded-lg hover:bg-accentBlue hover:text-white transition group mr-4" title="Tema Değiştir">
            {theme === 'dark' ? <Sun className="w-5 h-5 group-hover:scale-110 transition" /> : <Moon className="w-5 h-5 group-hover:scale-110 transition" />}
          </button>
          <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="w-10 h-10 flex items-center justify-center glass-panel rounded-lg hover:bg-accentBlue hover:text-white transition group"><ZoomIn className="w-5 h-5 group-hover:scale-110 transition" /></button>
          <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))} className="w-10 h-10 flex items-center justify-center glass-panel rounded-lg hover:bg-accentBlue hover:text-white transition group"><ZoomOut className="w-5 h-5 group-hover:scale-110 transition" /></button>
          <button onClick={() => setZoom(1)} className="w-10 h-10 flex items-center justify-center glass-panel rounded-lg hover:bg-accentBlue hover:text-white transition group"><Maximize className="w-5 h-5 group-hover:scale-110 transition" /></button>
        </div>

        {/* Canvas */}
        <div 
          ref={canvasRef}
          className={`w-full h-full overflow-auto custom-scrollbar relative ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {currentSemesters.length > 0 ? (
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', position: 'relative' }}>
              <Xwrapper>
                <CourseGrid 
                  semesters={currentSemesters}
                  courses={courses}
                  courseStatuses={courseStatuses}
                  searchTerm={searchTerm}
                  highlightedMain={highlightedMain}
                  highlightedPrereqs={highlightedPrereqs}
                  highlightedPostreqs={highlightedPostreqs}
                  onCourseClick={(course) => setActiveCourse(course)}
                  onCourseHover={handleCourseHover}
                  onCourseHoverEnd={handleCourseHoverEnd}
                />
                <Connections 
                  semesters={currentSemesters}
                  courses={courses}
                  highlightedMain={highlightedMain}
                  highlightedPrereqs={highlightedPrereqs}
                  highlightedPostreqs={highlightedPostreqs}
                />
              </Xwrapper>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-textMuted/50 text-xl font-medium pointer-events-none">
              Önce sol menüden müfredat seçimi yapınız.
            </div>
          )}
        </div>

        {/* Course Detail Panel */}
        {activeCourse && (
          <CourseDetailPanel 
            course={activeCourse} 
            status={courseStatuses[activeCourse.code]}
            toggleStatus={handleToggleStatus}
            onClose={() => setActiveCourse(null)} 
          />
        )}
      </main>
    </>
  );
}

export default App;
