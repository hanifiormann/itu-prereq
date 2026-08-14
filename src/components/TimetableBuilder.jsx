import React, { useState, useEffect, useMemo } from 'react';
import { fetchBranchCodes, fetchCourseSchedule, parseTimeSlot } from '../utils/obsScraper';
import { CalendarDays, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
const TIMES = [
  '08:30', '09:30', '10:30', '11:30', '12:30', 
  '13:30', '14:30', '15:30', '16:30', '17:30'
];

const timeToIndex = (time) => TIMES.indexOf(time);

const checkConflict = (sched1, sched2) => {
  for (let s1 of sched1) {
    for (let s2 of sched2) {
      if (s1.day === s2.day) {
        const t1 = parseTimeSlot(s1.time);
        const t2 = parseTimeSlot(s2.time);
        if (!t1 || !t2) continue;
        
        // Simple overlap check
        if (t1.start < t2.end && t1.end > t2.start) return true;
      }
    }
  }
  return false;
};

const TimetableBuilder = ({ semesters, courses, courseStatuses }) => {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [availableCoursesData, setAvailableCoursesData] = useState({});
  const [combinations, setCombinations] = useState([]);
  const [currentComboIdx, setCurrentComboIdx] = useState(0);
  const [maxCourses, setMaxCourses] = useState(5);

  // 1. Identify which courses the user can take this semester
  const availableCourses = useMemo(() => {
    const list = [];
    semesters.flat().forEach(item => {
      if (item.type === 'course') {
        const status = courseStatuses[item.code];
        if (!status) {
          const courseData = courses[item.code];
          let prereqsMet = true;
          if (courseData && courseData.reqs) {
            for (let req of courseData.reqs) {
              if (courseStatuses[req] !== 'passed') {
                prereqsMet = false;
                break;
              }
            }
          }
          if (prereqsMet) list.push(item.code);
        }
      }
    });
    return list;
  }, [semesters, courses, courseStatuses]);

  // 2. Fetch data from OBS
  const loadScheduleData = async () => {
    if (availableCourses.length === 0) {
      alert("Alabileceğiniz bir ders bulunamadı.");
      return;
    }

    setLoading(true);
    setStatusMsg("OBS üzerinden ders programları indiriliyor...");
    
    try {
      // Fetch all courses from GitHub
      const crnList = await fetchCourseSchedule();
      if (!crnList || crnList.length === 0) {
        throw new Error("Ders verileri çekilemedi.");
      }

      setStatusMsg("Kendi alınabilir dersleriniz filtreleniyor...");
      
      const scheduleData = {};
      
      // Filter to only the courses we need
      crnList.forEach(c => {
        if (availableCourses.includes(c.code)) {
          if (!scheduleData[c.code]) scheduleData[c.code] = [];
          scheduleData[c.code].push(c);
        }
      });

      setAvailableCoursesData(scheduleData);
      generateCombinations(scheduleData);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
      setStatusMsg("");
    }
  };

  // 3. Backtracking to find non-overlapping combinations
  const generateCombinations = (data) => {
    setStatusMsg("Kombinasyonlar hesaplanıyor...");
    const courseKeys = Object.keys(data).filter(k => data[k].length > 0);
    
    if (courseKeys.length < maxCourses) {
      alert(`Sadece ${courseKeys.length} adet alınabilir dersiniz bulundu, fakat siz ${maxCourses} ders istediniz.`);
    }

    const validCombos = [];

    const backtrack = (courseIndex, currentSchedule) => {
      if (validCombos.length > 50) return; // Limit to 50 combinations
      if (currentSchedule.length === maxCourses || currentSchedule.length === courseKeys.length) {
        // If we reached the desired count, or we took all available courses
        validCombos.push([...currentSchedule]);
        return;
      }
      if (courseIndex >= courseKeys.length) return;

      const code = courseKeys[courseIndex];
      const crns = data[code];
      
      // Option 1: Try adding a CRN from this course
      for (let crnObj of crns) {
        let conflict = false;
        for (let existing of currentSchedule) {
          if (checkConflict(existing.schedules, crnObj.schedules)) {
            conflict = true;
            break;
          }
        }
        
        if (!conflict) {
          currentSchedule.push(crnObj);
          backtrack(courseIndex + 1, currentSchedule);
          currentSchedule.pop();
        }
      }

      // Option 2: Skip this course entirely, if we still have enough remaining courses to reach the target
      const remainingCourses = courseKeys.length - courseIndex - 1;
      const neededCourses = Math.min(maxCourses, courseKeys.length) - currentSchedule.length;
      if (remainingCourses >= neededCourses) {
        backtrack(courseIndex + 1, currentSchedule);
      }
    };

    backtrack(0, []);
    
    // Sort combos by number of courses (descending)
    validCombos.sort((a,b) => b.length - a.length);
    // Remove exact duplicates just in case
    const uniqueCombos = [];
    const seen = new Set();
    validCombos.forEach(c => {
      const signature = c.map(x => x.crn).sort().join('-');
      if (!seen.has(signature)) {
        seen.add(signature);
        uniqueCombos.push(c);
      }
    });

    setCombinations(uniqueCombos);
    setCurrentComboIdx(0);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <RefreshCw className="w-12 h-12 text-accentBlue animate-spin mb-4" />
        <h2 className="text-xl font-bold">{statusMsg}</h2>
        <p className="text-textMuted mt-2">Lütfen bekleyin, OBS üzerinden güncel veriler taranıyor...</p>
      </div>
    );
  }

  const currentCombo = combinations[currentComboIdx];

  return (
    <div className="flex flex-col w-full h-full p-6 lg:p-12 gap-6 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-accentBlue" />
            Program Oluşturucu
          </h2>
          <p className="text-textMuted mt-1">Zincirde <b>alabileceğiniz</b> derslere göre otomatik çakışmayan program kombinasyonları.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="glass-panel px-4 py-3 rounded-xl flex items-center gap-3">
            <label className="text-sm font-bold text-textMuted">Hedef Ders Sayısı:</label>
            <select 
              value={maxCourses} 
              onChange={(e) => setMaxCourses(Number(e.target.value))}
              className="bg-bgPrimary text-white font-bold border border-white/10 rounded-lg px-2 py-1 outline-none focus:border-accentBlue"
            >
              {[3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} Ders</option>)}
            </select>
          </div>
          <button 
            onClick={loadScheduleData}
            className="glass-panel px-6 py-3 rounded-xl font-bold hover:bg-accentBlue hover:text-white transition shadow-lg flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" /> Program Üret
          </button>
        </div>
      </div>

      {!currentCombo && Object.keys(availableCoursesData).length === 0 && (
        <div className="glass-panel p-12 rounded-xl flex flex-col items-center justify-center text-center mt-12 border border-white/5">
          <AlertCircle className="w-16 h-16 text-textMuted mb-4 opacity-50" />
          <h3 className="text-xl font-bold mb-2">Henüz Program Üretilmedi</h3>
          <p className="text-textMuted max-w-md">Yukarıdaki "Program Üret" butonuna basarak, OBS üzerinden güncel açılan dersleri çekebilir ve çakışmayan alternatif programlar oluşturabilirsiniz.</p>
        </div>
      )}

      {currentCombo && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center glass-panel p-4 rounded-xl">
            <button 
              disabled={currentComboIdx === 0}
              onClick={() => setCurrentComboIdx(i => i - 1)}
              className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30 transition"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="text-center">
              <span className="block font-bold text-lg text-accentBlue">Alternatif {currentComboIdx + 1} / {combinations.length}</span>
              <span className="text-sm text-textMuted">Seçilen Ders Sayısı: {currentCombo.length}</span>
            </div>
            <button 
              disabled={currentComboIdx === combinations.length - 1}
              onClick={() => setCurrentComboIdx(i => i + 1)}
              className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30 transition"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-6 gap-2 bg-bgPanel p-4 rounded-2xl border border-white/10 shadow-2xl min-w-[800px] overflow-x-auto">
            {/* Header */}
            <div className="text-center font-bold p-2 text-textMuted border-b border-white/10">Saat</div>
            {DAYS.map(day => (
              <div key={day} className="text-center font-bold p-2 text-textMuted border-b border-white/10">{day}</div>
            ))}

            {/* Time Grid */}
            {TIMES.map((time, tIdx) => (
              <React.Fragment key={time}>
                <div className="text-center font-bold p-2 text-textMuted border-r border-white/5 flex items-center justify-center text-sm">{time}</div>
                {DAYS.map((day, dIdx) => {
                  // Find if any class in currentCombo matches this day and time
                  const cellClasses = [];
                  currentCombo.forEach(c => {
                    c.schedules.forEach(s => {
                      if (s.day === day) {
                        const t = parseTimeSlot(s.time);
                        if (t && t.start <= time && t.end > time) {
                          cellClasses.push(c);
                        }
                      }
                    });
                  });

                  return (
                    <div key={`${day}-${time}`} className="relative p-1 border-b border-r border-white/5 min-h-[60px] bg-white/5 hover:bg-white/10 transition">
                      {cellClasses.map((c, i) => (
                        <div key={i} className="absolute inset-1 bg-accentBlue/20 border border-accentBlue rounded-md p-1 overflow-hidden shadow-lg flex flex-col justify-center">
                          <span className="font-bold text-xs block text-white truncate">{c.code}</span>
                          <span className="text-[10px] text-textMuted truncate">CRN: {c.crn}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          <div className="glass-panel p-6 rounded-xl">
            <h3 className="font-bold text-xl mb-4 border-b border-white/10 pb-2">Program Detayları</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentCombo.map(c => (
                <div key={c.crn} className="bg-bgPrimary p-4 rounded-lg border border-white/5 flex flex-col gap-1">
                  <span className="font-bold text-accentBlue">{c.code} - {c.title}</span>
                  <span className="text-sm">CRN: {c.crn}</span>
                  <span className="text-sm text-textMuted">Hoca: {c.instructor}</span>
                  <span className="text-sm text-textMuted">Kontenjan: {c.enrolled} / {c.capacity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableBuilder;
