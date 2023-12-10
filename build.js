const fs = require("fs").promises;
const path = require("path");
const ejs = require("ejs");
const headPageData = require("./headPageData.js");

class PageBuilder {
    constructor() {
        this.baseDir = path.join(__dirname, "views");
        this.outputDir = path.join(__dirname, "public");
        this.layoutFilePath = path.join(__dirname, "views/layouts/layout.ejs");
        this.imagesSrcsetDataPath = "responsiveImageGenerator/images.json";
    }
     // Initialize the PageBuilder
    async init() {
        try {
            const files = await fs.readdir(this.baseDir);
            const ejsFiles = files.filter(
                (file) => path.extname(file) === ".ejs",
            );
            this.imagesSrcsetData = JSON.parse(
                await fs.readFile(this.imagesSrcsetDataPath, "utf8"),
            );

            for (const fileName of ejsFiles) {
                await this.buildPage(fileName);
            }
        } catch (err) {
            console.error("Error during initialization:", err);
        }
    }
    // Build a page using EJS template
    async buildPage(fileName) {
        try {
            const ejsFilePath = path.join(this.baseDir, fileName);
            const htmlOutputPath = path.join(
                this.outputDir,
                path.parse(fileName).name + ".html",
            );

            const html = await this.renderFile(ejsFilePath, {
                images: this.imagesSrcsetData,
                views: [path.join(__dirname, "views")],
                layout: "layouts/layout",
                partials: {
                    partialsDir: path.join(__dirname, "views/partials"),
                },
            });

            const fileNameNoExt = path.parse(fileName).name;
            const layoutHtml = await this.renderLayout(html, fileNameNoExt);
            await this.writeFile(htmlOutputPath, layoutHtml);
        } catch (err) {
            console.error("Error building page:", err);
        }
    }
    // Render an EJS file
    async renderFile(filePath, data) {
        try {
            return await ejs.renderFile(filePath, data);
        } catch (err) {
            throw err;
        }
    }
     // Render the layout with the provided bodyHtml
    async renderLayout(bodyHtml, fileNameNoExt) {
        const layoutOptions = {
            body: bodyHtml,
            headPageData: headPageData[fileNameNoExt],
        };

        return this.renderFile(this.layoutFilePath, layoutOptions);
    }
    // Write content to a file
    async writeFile(outPath, content) {
        await fs.writeFile(outPath, content);
        console.log(`File ${outPath} has been saved.`);
    }
}

// Usage
const pageBuilder = new PageBuilder();
pageBuilder.init();