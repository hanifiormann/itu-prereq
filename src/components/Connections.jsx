import React from 'react';
import Xarrow from 'react-xarrows';

const Connections = ({ 
  semesters, 
  courses,
  highlightedMain,
  highlightedPrereqs, 
  highlightedPostreqs 
}) => {
  // Collect all valid courses currently rendered
  const renderedCourseCodes = new Set();
  const renderedItems = [];
  
  semesters.forEach(sem => {
    sem.forEach(item => {
      if (item.type === 'course') {
        renderedCourseCodes.add(item.code);
        renderedItems.push(item);
      }
    });
  });

  const connections = [];

  renderedItems.forEach(item => {
    const courseData = courses[item.code];
    if (courseData && courseData.reqs) {
      courseData.reqs.forEach(req => {
        if (renderedCourseCodes.has(req)) {
          const isPrereqHighlight = highlightedPrereqs.includes(req) && highlightedPrereqs.includes(item.code);
          const isPostreqHighlight = highlightedPostreqs.includes(req) && highlightedPostreqs.includes(item.code);
          const isAnyHighlight = isPrereqHighlight || isPostreqHighlight;
          
          let color = "rgba(160, 170, 191, 0.2)";
          let zIndex = 0;
          let strokeWidth = 2;
          
          if (isPrereqHighlight) {
            color = "#4cc9f0"; // accentBlue
            zIndex = 20;
            strokeWidth = 3;
          } else if (isPostreqHighlight) {
            color = "#eab308"; // yellow-500
            zIndex = 20;
            strokeWidth = 3;
          }

          // If there is ANY highlight on the board, fade out non-highlighted lines completely
          let opacity = 0.6;
          if (highlightedMain) {
            opacity = isAnyHighlight ? 1 : 0.02;
          }

          connections.push(
            <Xarrow
              key={`${req}-${item.code}`}
              start={`node-${req}`}
              end={`node-${item.code}`}
              color={color}
              strokeWidth={strokeWidth}
              path="smooth"
              showHead={true}
              headSize={4}
              curveness={0.4}
              zIndex={zIndex}
              animateDrawing={isAnyHighlight ? 1 : false}
              passProps={{
                style: {
                  filter: isAnyHighlight ? `drop-shadow(0 0 5px ${color})` : 'none',
                  opacity: opacity,
                  transition: 'all 0.3s ease'
                }
              }}
            />
          );
        }
      });
    }
  });

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
      {connections}
    </div>
  );
};

export default Connections;
