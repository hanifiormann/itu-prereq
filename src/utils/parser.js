// URL Constants
const RAW_COURSES_URL = "https://raw.githubusercontent.com/itu-helper/data/main/courses.psv";
const RAW_PLANS_URL = "https://raw.githubusercontent.com/itu-helper/data/main/course_plans.txt";

export const fetchAndParseData = async () => {
  try {
    const [coursesRes, plansRes] = await Promise.all([
      fetch(RAW_COURSES_URL),
      fetch(RAW_PLANS_URL)
    ]);
    
    if(!coursesRes.ok || !plansRes.ok) throw new Error("Veriler çekilemedi.");
    
    const coursesText = await coursesRes.text();
    const plansText = await plansRes.text();
    
    const courses = parseCourses(coursesText);
    const plans = parsePlans(plansText);
    
    return { courses, plans };
  } catch (error) {
    console.error("Data fetch error:", error);
    throw error;
  }
};

const parseCourses = (text) => {
  const lines = text.split('\n');
  const coursesObj = {};
  
  // First pass: Read all courses
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split('|');
    if (parts.length >= 6) {
      const code = parts[0].trim();
      const name = parts[1].trim();
      const lang = parts[2].trim();
      const credits = parts[3].trim();
      const ects = parts[4].trim();
      const prereqStr = parts[5].trim();
      
      let reqs = [];
      if (prereqStr && prereqStr.toUpperCase() !== "YOK" && prereqStr !== "Yok") {
        const matches = prereqStr.match(/[A-Z]{3} \d{3}[A-Z]*/g);
        if (matches) {
          reqs = [...new Set(matches)];
        }
      }
      
      coursesObj[code] = { code, name, lang, credits, ects, prereqStr, reqs };
    }
  }

  // Second pass: Fix missing prerequisites by copying between E and non-E variants
  // This solves the issue where e.g. GEO 392 has no prereqs in the database but GEO 392E does.
  for (const code in coursesObj) {
    const course = coursesObj[code];
    if (course.reqs.length === 0) {
      let alternateCode = "";
      if (code.endsWith("E")) {
        alternateCode = code.slice(0, -1); // e.g. GEO 392E -> GEO 392
      } else {
        alternateCode = code + "E"; // e.g. GEO 392 -> GEO 392E
      }

      if (coursesObj[alternateCode] && coursesObj[alternateCode].reqs.length > 0) {
        course.reqs = [...coursesObj[alternateCode].reqs];
        course.prereqStr = `(Otomatik Düzeltildi) ${coursesObj[alternateCode].prereqStr}`;
      }
    }
  }

  return coursesObj;
};

const parsePlans = (text) => {
  const lines = text.split('\n');
  const globalPlans = {};
  
  let currentFaculty = "";
  let currentProgram = "";
  let currentVersion = "";
  let currentSemesters = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    if (line.startsWith('### ')) {
      if (currentVersion && currentSemesters.length > 0) {
        globalPlans[currentFaculty][currentProgram][currentVersion] = [...currentSemesters];
      }
      currentVersion = line.replace('### ', '').trim();
      currentSemesters = [];
    } else if (line.startsWith('## ')) {
      if (currentVersion && currentSemesters.length > 0) {
        globalPlans[currentFaculty][currentProgram][currentVersion] = [...currentSemesters];
      }
      currentProgram = line.replace('## ', '').trim();
      if (!globalPlans[currentFaculty][currentProgram]) {
        globalPlans[currentFaculty][currentProgram] = {};
      }
      currentVersion = "";
      currentSemesters = [];
    } else if (line.startsWith('# ')) {
      if (currentVersion && currentSemesters.length > 0) {
        globalPlans[currentFaculty][currentProgram][currentVersion] = [...currentSemesters];
      }
      currentFaculty = line.replace('# ', '').trim();
      if (!globalPlans[currentFaculty]) {
        globalPlans[currentFaculty] = {};
      }
      currentProgram = "";
      currentVersion = "";
      currentSemesters = [];
    } else {
      if (currentVersion) {
        const courseItems = line.split('=');
        let parsedCourses = [];
        for (let item of courseItems) {
          item = item.trim();
          if (item.startsWith('[') && item.endsWith(']')) {
            const inner = item.substring(1, item.length - 1);
            const parts = inner.split('*');
            const elName = parts[0];
            const opts = parts.length > 1 ? parts[1].replace('(', '').replace(')', '').split('|') : [];
            parsedCourses.push({ type: 'elective', name: elName, options: opts, id: `${elName}-${currentSemesters.length}` });
          } else {
            parsedCourses.push({ type: 'course', code: item, id: item });
          }
        }
        currentSemesters.push(parsedCourses);
      }
    }
  }
  
  if (currentFaculty && currentProgram && currentVersion && currentSemesters.length > 0) {
    globalPlans[currentFaculty][currentProgram][currentVersion] = currentSemesters;
  }
  
  return globalPlans;
};
