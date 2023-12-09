const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const headPageData = require("./headPageData.js");

function ejs2html({ filePath, outPath, data, options }) {
  ejs.renderFile(
    filePath,
    { ...data, ...options }, // Pass both data and options to the template
    {
      filename: filePath,
      views: [path.join(__dirname, 'views')],
      layout: 'layouts/layout',
      partials: { partialsDir: path.join(__dirname, 'views/partials') },
    },
    (err, html) => {
      if (err) {
        console.log("Error during rendering:", err);
        return false;
      }
    //   layouts config!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      const fileNameNoExt = path.parse(filePath).name
      const layoutContent = { body: html, headPageData: headPageData[fileNameNoExt]};

      ejs.renderFile(
        path.join(__dirname, 'views/layouts/layout.ejs'),
        layoutContent,
        { filename: path.join(__dirname, 'views/layouts/layout.ejs') },
        (err, layoutHtml) => {
          if (err) {
            console.log("Error during rendering layout:", err);
            return false;
          }

          fs.writeFile(outPath, layoutHtml, function (err) {
            if (err) {
              console.log("Error during writing:", err);
              return false;
            }
            console.log(`File ${outPath} has been saved.`);
          });
        }
      );
    }
  );
}



const baseDir = __dirname + '/views';
const outputDir = __dirname + '/public';

// Read all files in the views directory
fs.readdir(baseDir, (err, files) => {
  if (err) {
    console.error('Error reading directory:', err);
    return;
  }

  // Filter out only the EJS files
  const ejsFiles = files.filter(file => path.extname(file) === '.ejs');

    // Read the images.json file
  const imagesSrcsetDataPath = "responsiveImageGenerator/images.json";
  const imagesSrcsetData = JSON.parse(
    fs.readFileSync(imagesSrcsetDataPath, "utf8"),
  );



  ejsFiles.forEach((fileName) => {
    const ejsFilePath = path.join(baseDir, fileName);
    const htmlOutputPath = path.join(outputDir, path.parse(fileName).name + '.html');

    ejs2html({
      filePath: ejsFilePath,
      outPath: htmlOutputPath,
      options: {
        images: imagesSrcsetData,
        // Add any other options you need
    },
    });
  });
});
