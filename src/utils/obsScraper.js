const PROXY_URL = "https://api.allorigins.win/raw?url=";

// Fetch all available branch codes for a given program level (LS = Lisans)
export const fetchBranchCodes = async (seviye = 'LS') => {
  try {
    const url = `https://obs.itu.edu.tr/public/DersProgram/SearchBransKoduByProgramSeviye?programSeviyeTipiAnahtari=${seviye}`;
    const response = await fetch(PROXY_URL + encodeURIComponent(url));
    if (!response.ok) throw new Error("Failed to fetch branch codes.");
    const data = await response.json();
    return data; // Array of { bransKoduId: number, dersBransKodu: string }
  } catch (error) {
    console.error("fetchBranchCodes error:", error);
    return [];
  }
};

// Fetch and parse the course schedule HTML
export const fetchCourseSchedule = async (bransKoduId, seviye = 'LS') => {
  try {
    const url = `https://obs.itu.edu.tr/public/DersProgram/DersProgramSearch?ProgramSeviyeTipiAnahtari=${seviye}&DersBransKoduId=${bransKoduId}`;
    const response = await fetch(PROXY_URL + encodeURIComponent(url));
    if (!response.ok) throw new Error("Failed to fetch schedule.");
    
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    
    const courses = [];
    
    // Find the main table in the returned HTML
    const table = doc.querySelector('.table-responsive table tbody');
    if (!table) return [];
    
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
      const cols = row.querySelectorAll('td');
      if (cols.length < 10) return;
      
      const crn = cols[0].innerText.trim();
      const code = cols[1].innerText.trim();
      const title = cols[2].innerText.trim();
      const instructor = cols[3].innerText.trim();
      const building = cols[4].innerText.trim();
      const day = cols[5].innerText.trim();
      const time = cols[6].innerText.trim();
      const room = cols[7].innerText.trim();
      const capacity = cols[8].innerText.trim();
      const enrolled = cols[9].innerText.trim();
      const restriction = cols[10] ? cols[10].innerText.trim() : "";
      
      // Since some courses have multiple days (e.g. lab), OBS duplicates rows or merges cells. 
      // For simplicity, we just add the entry. We can group by CRN later if needed.
      courses.push({
        crn,
        code,
        title,
        instructor,
        building,
        day,
        time,
        room,
        capacity,
        enrolled,
        restriction
      });
    });
    
    return groupCoursesByCRN(courses);
  } catch (error) {
    console.error("fetchCourseSchedule error:", error);
    return [];
  }
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
    
    if (course.day && course.time) {
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

// Convert OBS time format (e.g. "0830/1129") to standard hours
export const parseTimeSlot = (timeStr) => {
  if (!timeStr) return null;
  const parts = timeStr.split('/');
  if (parts.length !== 2) return null;
  
  const formatTime = (t) => {
    const h = t.substring(0, 2);
    const m = t.substring(2, 4);
    return `${h}:${m}`;
  };
  
  return {
    start: formatTime(parts[0].trim()),
    end: formatTime(parts[1].trim())
  };
};
