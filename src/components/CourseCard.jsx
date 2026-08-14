import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const CourseCard = ({ 
  item, 
  courseData, 
  status, 
  isHighlightedMain, 
  isHighlightedPrereq, 
  isHighlightedPostreq,
  hasActiveHighlight,
  isDimmedBySearch,
  onClick,
  onHover,
  onHoverEnd
}) => {
  const isElective = item.type === 'elective';
  const code = isElective ? item.name : item.code;
  const name = isElective ? "Seçmeli Ders" : (courseData?.name || "Bilinmeyen Ders");

  const bgColor = useMemo(() => {
    if (isElective) return 'bg-courseElective';
    if (code.startsWith('MAT') || code.startsWith('FIZ') || code.startsWith('KIM')) return 'bg-courseCommon';
    if (code.includes('182') || code.includes('282') || code.includes('382')) return 'bg-courseIntern';
    return 'bg-courseCompulsory';
  }, [code, isElective]);

  const statusColor = useMemo(() => {
    switch(status) {
      case 'passed': return 'bg-statusPassed shadow-[0_0_8px_rgba(76,175,80,0.6)]';
      case 'failed': return 'bg-statusFailed shadow-[0_0_8px_rgba(244,67,54,0.6)]';
      case 'locked': return 'bg-statusLocked';
      default: return 'bg-statusAvailable shadow-[0_0_8px_rgba(255,235,59,0.6)]';
    }
  }, [status]);

  let borderHighlight = "border-white/10";
  let glow = "";
  
  if (isHighlightedMain) {
    borderHighlight = "border-accentRed z-30 scale-[1.05]";
    glow = "shadow-[0_0_25px_rgba(230,57,70,0.9)]";
  } else if (isHighlightedPrereq) {
    borderHighlight = "border-accentBlue z-20";
    glow = "shadow-[0_0_20px_rgba(76,201,240,0.8)]";
  } else if (isHighlightedPostreq) {
    borderHighlight = "border-yellow-500 z-20";
    glow = "shadow-[0_0_20px_rgba(234,179,8,0.8)]";
  }

  // Determine opacity and grayscale based on highlight state
  let opacity = 1;
  let filter = 'none';
  const isPartOfChain = isHighlightedMain || isHighlightedPrereq || isHighlightedPostreq;

  if (isDimmedBySearch) {
    opacity = 0.1;
  } else if (hasActiveHighlight) {
    if (!isPartOfChain) {
      opacity = 0.1; // Dim unconnected courses significantly
      filter = 'grayscale(80%)';
    } else {
      opacity = 1;
    }
  } else {
    // Normal state
    opacity = status === 'passed' ? 0.6 : (status === 'locked' ? 0.4 : 1);
    filter = status === 'locked' ? 'grayscale(50%)' : 'none';
  }

  return (
    <motion.div
      id={`node-${item.id}`}
      className={`relative w-40 min-h-[6rem] flex flex-col justify-center items-center rounded-xl p-4 cursor-pointer select-none border-2 transition-all duration-300 ${bgColor} ${borderHighlight} ${glow}`}
      style={{ opacity, filter }}
      whileHover={status !== 'locked' ? { scale: 1.05, y: -5 } : {}}
      whileTap={status !== 'locked' ? { scale: 0.95 } : {}}
      onClick={() => onClick(courseData)}
      onMouseEnter={() => onHover(code)}
      onMouseLeave={onHoverEnd}
    >
      {!isElective && (
        <div className={`absolute -top-2 -right-2 w-4 h-4 rounded-full border-2 border-bgPrimary z-10 transition-opacity duration-300 ${statusColor} ${hasActiveHighlight && !isPartOfChain ? 'opacity-20' : 'opacity-100'}`} />
      )}
      <div className="font-bold text-lg text-center tracking-wide">{code}</div>
      <div className="text-xs text-center text-gray-300 mt-1 line-clamp-3 leading-tight w-full break-words">{name}</div>
    </motion.div>
  );
};

export default CourseCard;
