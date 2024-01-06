const express = require("express");
const path = require("path");
const serverless = require("serverless-http")

// Import custom modules
const {
    reviewFormValidationRules,
    contactFormValidationRules,
    reCaptchaValidation,
    validationMiddleware,
    sanitizeFormData,
} = require("../form-validation.js");
const { sendFormToEmail } = require("../email-config-and-sender.js");

const app = express();
const router = express.Router()

// // Middleware Setup for serving static files and JSON parsing
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



router.post("/contact", contactFormValidationRules, validationMiddleware, reCaptchaValidation, (req, res) => {
    sanitizeFormData(req);
    sendFormToEmail(req, res, "contact");
});

router.post("/", reviewFormValidationRules, validationMiddleware, reCaptchaValidation, (req, res) => {
    sanitizeFormData(req);
    sendFormToEmail(req, res, "review");
});

function createRoutes(paths) {
  paths.forEach((route) => {
    router.get(route, (req, res) => {
      // Construct the absolute path to the HTML file based on the route
      const filePath = path.join(__dirname, 'public', route === "/" ? "index.html" :`${route}.html`);

      // Send the file
      res.sendFile(filePath, (err) => {
        if (err) {
          // Handle error, e.g., file not found
          res.status(404).send('File not found:', route, filePath);
        }
      });
    });
  });
}

// Specify the routes you want to create
const routesToCreate = [
  '/',
  '/foliage',
  '/arrangements-and-crafts',
  '/oils',
  '/varieties-info',
  '/about',
  '/gallery',
  '/faq',
  '/contact',
  '/terms-of-service',
  '/privacy-policy',
];

// Create the routes
createRoutes(routesToCreate);


// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send("Internal Server Error");
});


app.use("/app/", router);

// For development use: comment out for production
// const PORT = process.env.PORT || 3000 
// app.listen(PORT, () => {
//     console.log(`server running on port ${PORT}`);
// });

module.exports.handler = serverless(app)