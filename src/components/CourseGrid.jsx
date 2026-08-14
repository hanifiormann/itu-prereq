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
    if (item.type === 'elective') return 'available';
    
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
    <div className="flex p-12 gap-16 min-w-max min-h-max" id="curriculum-grid">
      {semesters.map((semester, idx) => (
        <div key={idx} className="flex flex-col gap-6 w-40 relative z-10">
          <div className="sticky top-0 bg-bgPrimary/80 backdrop-blur-sm z-20 text-center font-semibold text-accentBlue pb-3 border-b-2 border-white/10 mb-2">
            {idx + 1}. Dönem
          </div>
          
          {semester.map((item, itemIdx) => {
            const courseData = item.type === 'course' ? courses[item.code] : null;
            const code = item.type === 'course' ? item.code : item.name;
            const name = courseData ? courseData.name : (item.type === 'elective' ? 'Seçmeli Ders' : '');
            
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
      ))}
    </div>
  );
};

export default CourseGrid;
