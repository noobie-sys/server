import Course from "../models/Course.js";
import { parseCSVBuffer } from "../utility/csv-parser.js";

export const uploadCourses = async (req, res) => {
    console.log(req.file)
  try {
    //check if file is uploded
    const file = req.body.file;

    if (!file) {
      return res.status(400).json({
        message: "CSV file is required",
        data: null,
      });
    }

    // console.log(file.endsWith(".csv") , "Hello developer")
    //check if it's CSV fole
    if (!file.endsWith(".csv")) {
      return res.status(400).json({
        message: "Only CSV files are allowed!",
        error : errors
      });
    }
    // Parse CSV from Buffer
    console.log(file.buffer, "File buffer")
    const csvData = await parseCSVBuffer(file.buffer);
    console.log("CSV DATA:", csvData)
    if (!csvData || csvData.length === 0) {
      return res.status(400).json({
        message: "CSV file is empty or invalid",
        data: errors,
      });
    }

    // Validate and Transform CSV data
    const course = [];
    const errors = [];

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      console.log(row)

      if (
        !row.course_id ||
        !row.title ||
        !row.category ||
        !!row.instructor ||
        !row.duration
      ) {
        errors.push(`Row ${i + 1}: Missing required field`);
        continue;
      }
    }
    
    // Transform duration to number if it's a string

    const duration = parseFloat(row.duration)
    if (NaN(duration)) {
        errors.push(`Row ${i + 1}: Invalid duration value`);
    }


    course.push({
      course_id: row.course_id.toString().trim(),
      title: row.title.toString().trim(),
      category: row.category.toString().trim(),
      description: row.description ? row.description.toString().trim() : "",
      instructor: row.instructor.toString().trim(),
      duration: duration,
    });


    if(course.length === 0 ){
        return res.status(400).json({
            message : "No valid course dound in CSV!",
            errors : errors
        })
    }

    // Add to the DB
    // handle partial success

    return res.status(200).json({
      message: "Course uploaded successfully",
      data: req.body,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "something went wrong while uploading course",
      data: error.message,
    });
  }
};
