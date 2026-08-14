// Fetch and parse the course schedule from the open source itu-helper data repository
// This avoids the OBS CORS/Cloudflare blocks completely.

const DATA_URL = "https://raw.githubusercontent.com/itu-helper/data/main/lessons.psv";

// We keep fetchBranchCodes just to keep the TimetableBuilder interface happy if it calls it,
// but we don't really need branch codes if we have all courses in one file.
// We'll return a dummy array so it doesn't fail.
export const fetchBranchCodes = async () => {
  return [{ bransKoduId: 1, dersBransKodu: "ALL" }];
};

// Instead of fetching per branch, we will fetch the entire DB once and cache it.
let cachedScheduleData = null;

export const fetchCourseSchedule = async () => {
  if (cachedScheduleData) return cachedScheduleData;

  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error("Failed to fetch schedule data from GitHub.");
    
    const text = await response.text();
    const lines = text.split('\n');
    
    const courses = [];
    
    lines.forEach(line => {
      if (!line.trim()) return;
      const cols = line.split('|');
      if (cols.length < 10) return;
      
      const crn = cols[0].trim();
      const code = cols[1].trim();
      // title is not in this dump, we'll use code as title
      const title = cols[1].trim(); 
      const instructor = cols[2].trim();
      const building = cols[4].trim();
      const day = translateDay(cols[5].trim());
      const time = cols[6].trim();
      const room = cols[7].trim();
      const capacity = cols[8].trim();
      const enrolled = cols[9].trim();
      const restriction = cols[10] ? cols[10].trim() : "";
      
      courses.push({
        crn, code, title, instructor, building, day, time, room, capacity, enrolled, restriction
      });
    });
    
    const grouped = groupCoursesByCRN(courses);
    cachedScheduleData = grouped;
    return grouped;
  } catch (error) {
    console.error("fetchCourseSchedule error:", error);
    return [];
  }
};

const translateDay = (engDay) => {
  const map = {
    'Monday': 'Pazartesi',
    'Tuesday': 'Salı',
    'Wednesday': 'Çarşamba',
    'Thursday': 'Perşembe',
    'Friday': 'Cuma',
    'Saturday': 'Cumartesi',
    'Sunday': 'Pazar'
  };
  return map[engDay] || engDay;
};

// Group multiple schedule lines (e.g. theoretical + lab on different days) into single CRN objects
const groupCoursesByCRN = (flatCourses) => {
  const grouped = {};
  
  flatCourses.forEach(course => {
    if (!grouped[course.crn]) {
      grouped[course.crn] = {
        crn: course.crn,
        code: course.code,
        title: course.title,
        instructor: course.instructor,
        capacity: course.capacity,
        enrolled: course.enrolled,
        restriction: course.restriction,
        schedules: []
      };
    }
    
    if (course.day && course.time && course.time !== 'TBA') {
      grouped[course.crn].schedules.push({
        day: course.day,
        time: course.time,
        building: course.building,
        room: course.room
      });
    }
  });
  
  return Object.values(grouped);
};

// Convert OBS time format (e.g. "0830/1129" or "08:30/11:29") to standard hours
export const parseTimeSlot = (timeStr) => {
  if (!timeStr || timeStr === 'TBA' || timeStr === '--') return null;
  const parts = timeStr.split('/');
  if (parts.length !== 2) return null;
  
  const formatTime = (t) => {
    let clean = t.trim().replace(':', '');
    if (clean.length === 3) clean = '0' + clean;
    if (clean.length !== 4) return null;
    const h = clean.substring(0, 2);
    const m = clean.substring(2, 4);
    return `${h}:${m}`;
  };
  
  const start = formatTime(parts[0]);
  const end = formatTime(parts[1]);
  if (!start || !end) return null;
  
  return { start, end };
};
