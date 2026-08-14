import React from 'react';
import CourseCard from './CourseCard';

const CourseGrid = ({ 
  semesters, 
  courses, 
  courseStatuses,
  searchTerm,
  highlightedMain,
  highlightedPrereqs,
  highlightedPostreqs,
  onCourseClick,
  onCourseHover,
  onCourseHoverEnd
}) => {

  const checkStatus = (item) => {
    if (item.type === 'elective') {
      if (courseStatuses[item.name] === 'passed') return 'passed';
      if (item.options && item.options.some(opt => courseStatuses[opt.split('(')[0].trim()] === 'passed')) return 'passed';
      if (courseStatuses[item.name] === 'failed') return 'failed';
      return 'available';
    }
    
    let status = courseStatuses[item.code];
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
      status = prereqsMet ? 'available' : 'locked';
    }
    return status;
  };

  const isDimmedBySearch = (code, name) => {
    if (!searchTerm) return false;
    const term = searchTerm.toLowerCase();
    const cCode = code?.toLowerCase() || "";
    const cName = name?.toLowerCase() || "";
    return !(cCode.includes(term) || cName.includes(term));
  };

  return (
    <div className="flex flex-col p-12 gap-12 min-w-max min-h-max" id="curriculum-grid">
      {semesters.map((semester, idx) => (
        <div key={idx} className="flex flex-row items-center gap-10 relative z-10">
          <div className="w-24 shrink-0 text-right font-semibold text-accentBlue pr-4 border-r-2 border-white/10">
            {idx + 1}. Dönem
          </div>
          <div className="flex flex-row gap-6">
            {semester.map((item, itemIdx) => {
              const isElective = item.type === 'elective';
              const courseData = isElective ? {
                code: item.name,
                name: "Seçmeli Ders Grubu",
                credits: "3",
                ects: "4",
                prereqStr: "Seçenekler: " + (item.options?.join(', ') || "Belirtilmemiş")
              } : courses[item.code];
              
              const code = isElective ? item.name : item.code;
              const name = courseData ? courseData.name : '';
              
              return (
                <CourseCard 
                  key={`${item.id}-${itemIdx}`}
                  item={item}
                  courseData={courseData}
                  status={checkStatus(item)}
                  isHighlightedMain={highlightedMain === code}
                  isHighlightedPrereq={highlightedPrereqs.includes(code)}
                  isHighlightedPostreq={highlightedPostreqs.includes(code)}
                  hasActiveHighlight={!!highlightedMain}
                  isDimmedBySearch={isDimmedBySearch(code, name)}
                  onClick={onCourseClick}
                  onHover={onCourseHover}
                  onHoverEnd={onCourseHoverEnd}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CourseGrid;
