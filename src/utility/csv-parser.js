import csv from "csv-parser";
import fs from "fs";
import { Readable } from "stream";

export const parseCSV = (filePath) => {
  console.log('FILE PATH: ' , filePath)
  return new Promise((res, rej) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => res(results))
      .on("error", (error) => rej(error));
  });
};


export const parseCSVBuffer = buffer => {
  console.log(buffer)
    return new Promise((res, rej) => {
        const results = []
        const stream = Readable.from(buffer);

        stream
        .pipe(csv())
        .on('data', data => results.push(data))
        .on('end', () => res(results))
        .on('error' , error => rej(error))
    })
}