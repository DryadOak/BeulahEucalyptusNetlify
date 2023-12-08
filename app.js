import express from "express";
import expressLayouts from "express-ejs-layouts";
import ejs from "ejs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Import custom modules
import headPageData from "./headPageData.js";
import {
    reviewFormValidationRules,
    contactFormValidationRules,
    validationMiddleware,
    sanitizeFormData,
} from "./form-validation.js";
import { sendFormToEmail } from "./email-config-and-sender.js";

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration Settings: Set view engine and layout
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("layout", "layouts/layout");

// // Middleware Setup for serving static files and JSON parsing
app.use(expressLayouts);
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load images srcset data from images.json
try {
    const imagesSrcsetData = JSON.parse(
        fs.readFileSync("responsiveImageGenerator/images.json", "utf8"),
    );
    app.use((req, res, next) => {
        res.locals.images = imagesSrcsetData;
        next();
    });
} catch (error) {
    console.error("Error reading images.json:", error);
}

app.post(
    "/contact",
    contactFormValidationRules,
    validationMiddleware,
    (req, res) => {
        sanitizeFormData(req);
        sendFormToEmail(req, res, "contact");
    },
);

app.post("/", reviewFormValidationRules, validationMiddleware, (req, res) => {
    sanitizeFormData(req);
    sendFormToEmail(req, res, "review");
});

// Common route handler for rendering pages
function renderPage(req, res, pageRoute) {
    const pageKey = pageRoute === "/" ? "index" : pageRoute.substring(1);
    res.render(pageKey, headPageData[pageKey]);
}

// Define the list of page routes
const pageRoutes = [
    "/",
    "/foliage",
    "/arrangements-and-crafts",
    "/oils",
    "/varieties-info",
    "/about",
    "/gallery",
    "/faq",
    "/contact",
    "/terms-of-service",
    "/privacy-policy",
];

// Set up route handlers for each page
pageRoutes.forEach((route) => {
    app.get(route, (req, res) => renderPage(req, res, route));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send("Internal Server Error");
});

app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});
