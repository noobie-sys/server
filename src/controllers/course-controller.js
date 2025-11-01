import Course from "../models/Course.js";
import { parseCSVBuffer } from "../utility/csv-parser.js";
import { getFromCache, setCache, CACHE_EXPIRY } from "../utils/cache.js";

// Helper function to get column value with multiple possible names (case-insensitive)
const getColumnValue = (row, possibleNames) => {
  for (const name of possibleNames) {
    // Try exact match first
    if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
      return row[name];
    }
    // Try case-insensitive match
    const lowerName = name.toLowerCase();
    for (const key of Object.keys(row)) {
      if (key.toLowerCase() === lowerName && row[key] !== undefined && row[key] !== null && row[key] !== '') {
        return row[key];
      }
    }
  }
  return null;
};

export const uploadCourses = async (req, res) => {
  
  let courses = []; // Declare outside try for access in catch
  
  try {
    // Check if file is uploaded - use req.file from multer, not req.body.file
    const file = req.file;

    if (!file) {
      
      return res.status(400).json({
        message: "CSV file is required",
        error: "req.file is undefined. Make sure you're sending the file with field name 'file' using multipart/form-data",
        debug: {
          hasFile: !!req.file,
          contentType: req.headers['content-type'],
          bodyKeys: Object.keys(req.body || {}),
        },
      });
    }

    // Check if it's a CSV file
    if (!file.originalname.endsWith(".csv") && file.mimetype !== 'text/csv') {
      return res.status(400).json({
        message: "Only CSV files are allowed!",
      });
    }
    
    // Parse CSV from Buffer - file.buffer is available from multer memoryStorage
    // console.log("File buffer:", file.buffer);
    const csvData = await parseCSVBuffer(file.buffer);
    
    if (!csvData || csvData.length === 0) {
      return res.status(400).json({
        message: "CSV file is empty or invalid",
        data: null,
      });
    }

    // Validate and Transform CSV data
    courses = [];
    const errors = [];

    // Log first row to see the structure
    if (csvData.length > 0) {
      console.log("Sample CSV row keys:", Object.keys(csvData[0]));
      console.log("First row sample (first 3 keys):", 
        Object.keys(csvData[0]).slice(0, 3).reduce((acc, key) => {
          acc[key] = csvData[0][key];
          return acc;
        }, {}));
    }

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      
      // Map CSV columns to model fields using helper function
      const courseId = getColumnValue(row, ["Unique ID", "unique id", "Course ID", "course id"]);
      const title = getColumnValue(row, ["Course Name", "course name", "Title", "title"]);
      const description = getColumnValue(row, [
        "Overview/Description", 
        "overview/description", 
        "Overview/Description",
        "Description",
        "description",
        "Summary",
        "summary"
      ]) || "";
      const category = getColumnValue(row, [
        "Discipline/Major",
        "discipline/major",
        "Department/School",
        "department/school",
        "Specialization",
        "specialization",
        "Category",
        "category"
      ]) || "General";
      const instructor = getColumnValue(row, [
        "Professor Name",
        "professor name",
        "Instructor",
        "instructor",
        "Professor Email",
        "professor email"
      ]);
      const durationStr = getColumnValue(row, [
        "Duration (Months)",
        "duration (months)",
        "Duration",
        "duration",
        "Duration (Hours)",
        "duration (hours)"
      ]);

      // Validate required fields
      if (!courseId || !title || !instructor || !durationStr) {
        const missingFields = [];
        if (!courseId) missingFields.push("Unique ID");
        if (!title) missingFields.push("Course Name");
        if (!instructor) missingFields.push("Professor Name");
        if (!durationStr) missingFields.push("Duration (Months)");
        
        // Log available columns for debugging (only on first error)
        if (errors.length === 0 && i === 0) {
          console.log("Available CSV columns:", Object.keys(row));
          console.log("Row data sample:", {
            "Unique ID": courseId,
            "Course Name": title,
            "Professor Name": instructor,
            "Duration (Months)": durationStr
          });
        }
        
        errors.push(`Row ${i + 2}: Missing required field(s): ${missingFields.join(", ")}`);
        continue;
      }
      
      // Transform duration to number (convert months to number)
      const duration = parseFloat(durationStr);
      if (isNaN(duration) || duration <= 0) {
        errors.push(`Row ${i + 2}: Invalid duration value: "${durationStr}"`);
        continue;
      }

      courses.push({
        course_id: courseId.toString().trim(),
        title: title.toString().trim(),
        category: category.toString().trim() || "General",
        description: description ? description.toString().trim() : "",
        instructor: instructor.toString().trim(),
        duration: duration,
      });
    }

    if (courses.length === 0) {
      return res.status(400).json({
        message: "No valid courses found in CSV!",
        errors: errors
      });
    }

    // Insert courses to DB
    const result = await Course.insertMany(courses, {
      ordered: false, // Continue even if some fail (duplicates)
    });

    return res.status(200).json({
      message: "Courses uploaded successfully",
      data: {
        total: courses.length,
        inserted: result.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.log("Upload error:", error);
    
    // Handle duplicate key errors
    if (error.code === 11000 || error.writeErrors) {
      const insertedCount = error.insertedDocs ? error.insertedDocs.length : 0;
      return res.status(207).json({
        message: "Partial success: Some courses already exist!",
        data: {
          inserted: insertedCount,
          skipped: courses.length - insertedCount,
        },
      });
    }
    
    return res.status(500).json({
      message: "Something went wrong while uploading courses",
      error: error.message,
    });
  }
};

// Example: Get course by ID with caching
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `course:id:${id}`;

    // Step 1: Try to get from cache first
    const cachedCourse = await getFromCache(cacheKey);
    
    if (cachedCourse) {
      return res.status(200).json({
        message: "Course retrieved from cache",
        data: cachedCourse,
      });
    }

    // Step 2: If not in cache, fetch from MongoDB
    const course = await Course.findOne({ course_id: id });
    
    if (!course) {
      return res.status(404).json({
        message: "Course not found",
        data: null,
      });
    }

    // Step 3: Store in cache for future requests
    const courseObject = course.toObject();
    await setCache(cacheKey, courseObject, CACHE_EXPIRY.COURSE_BY_ID);

    return res.status(200).json({
      message: "Course retrieved successfully",
      data: courseObject,
    });
  } catch (error) {
    console.error("Get course by ID error:", error);
    return res.status(500).json({
      message: "Something went wrong while fetching course",
      error: error.message,
    });
  }
};


/**
 * Get all courses with Redis caching
 */
export const getAllCourses = async (req, res) => {
    try {
      const cacheKey = `course:all`;
  
      // Step 1: Try to get from cache first
      const cachedCourses = await getFromCache(cacheKey);
      
      if (cachedCourses) {
        return res.status(200).json({
          message: "Courses retrieved from cache",
          data: cachedCourses,
        });
      }
  
      // Step 2: If not in cache, fetch from MongoDB
      const courses = await Course.find().lean();
  
      // Step 3: Store in cache for future requests
      await setCache(cacheKey, courses, CACHE_EXPIRY.ALL_COURSES);
  
      return res.status(200).json({
        message: "Courses retrieved successfully",
        data: courses,
      });
    } catch (error) {
      console.error("Get all courses error:", error);
      return res.status(500).json({
        message: "Something went wrong while fetching courses",
        error: error.message,
      });
    }
  };