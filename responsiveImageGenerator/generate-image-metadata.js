// run this script to update images.json
// Please ensure you have used the responsive-image-generator.js to create image in the correct format; Images must have a unique file name with words separated by a hyphen (-), and the width at the end. For example file-name-600.jpg.
// subdirs that contain the images should be name based on the format of the image. For example, webp, jpg or png:
// images/
// ├── three-column/
// │   ├── webp/
// │   │   ├── camphora-256.webp
// │   │   ├── camphora-455.webp
// │   │   ├── ...
// │   ├── jpg/
// │   │   ├── camphora-256.jpg
// │   │   ├── camphora-455.jpg
// │   │   ├── ...
// ├── another-directory/
// │   ├── webp/
// │   │   ├── ...
// │   ├── jpg/
// │   │   ├── ...

// If the new images you are adding do not fit an existing directory in the mediaQueriesConfig, please create and new one and add a comment clearly outlining its logic.

"use strict";
const fs = require("fs").promises;
const path = require("path");
const sharp = require("sharp");

// Configuration
const config = {
    rootImagePath: "../public/images",
    excludedDirectories: ["logo-icons-avatars", "background"],
    outputFileName: "images.json",
};

const mediaQueriesConfig = {
    // images in these directories take up one third of the container above 999px
    "/images/three-column":
        "(min-width: 999px) min(calc((100vw - 6.4rem) / 3), calc((111rem - 6.4) / 3)), (min-width: 847px) calc(50vw -4rem), calc(100vw -4rem)",
    "/images/gallery":
        "(min-width: 999px) min(calc((100vw - 6.4rem) / 3), calc((111rem - 6.4) / 3)), (min-width: 847px) calc(50vw -4rem), calc(100vw -4rem)",
    // images in these directories take up one third of the of the smaller container with the class column-ratio-2-1
    "/images/three-column-small":
        "(min-width: 848px) calc((85em - 11.2em) / 3), calc(100vw - 4em)",
    // images in this directory cover two thirds of the container, spanning two columns
    "/images/gallery-span-two":
        "(min-width: 1000px) calc(min(66vw, 766px) -4rem), calc(100vw -4rem)",
    // images in this directory cover half of the container
    "/images/two-column":
        "(min-width: 848px) min(calc(50vw - 4rem), calc(107rem / 2)), calc(100vw - 4rem)",
    // images in this directory are specifically for the leaf table in foliage.ejs
    "/images/leaf-shape":
        "(min-width: 848px) min(calc(38vw - 4rem), 40rem), calc(75vw -4rem)",
    // Add more paths as needed
};

// Function to read a directory with error handling
async function readDirectory(directoryPath) {
    try {
        const files = await fs.readdir(directoryPath);
        return files;
    } catch (error) {
        console.error(
            `Error reading directory '${directoryPath}': ${error.message}`
        );
        throw error;
    }
}

// Function to read file metadata with error handling
async function readFileMetadata(filePath) {
    try {
        const stats = await fs.stat(filePath);
        return stats;
    } catch (error) {
        console.error(
            `Error reading file metadata for '${filePath}': ${error.message}`
        );
        throw error;
    }
}

// Function to process an image file and extract metadata
async function processImage(filePath, metadata) {
    const fileName = path.basename(filePath, path.extname(filePath));
    const widthIndex = fileName.lastIndexOf("-");
    const imageId = fileName.substring(0, widthIndex);
    const width = fileName.substring(widthIndex + 1);
    const imgAlt = imageId.split("-").join(" ");
    const format = path.basename(path.dirname(filePath)); // Get the format from the directory name
    const imageKey = `${imageId}-${format}-${imgAlt}`;

    const metadataInfo = await getImageMetadata(filePath);
    const aspectRatio = calculateAspectRatio(metadataInfo);

    if (!metadata[imageKey]) {
        metadata[imageKey] = {
            id: imageId,
            imagePath: `/images/${
                path.relative(config.rootImagePath, filePath).split(path.sep)[0]
            }`,
            widths: [],
            format: format,
            aspectRatio: aspectRatio,
            alt: imgAlt,
        };
    }

    metadata[imageKey].widths.push(parseInt(width, 10));

    return metadata;
}

// Promisify sharp metadata extraction
async function getImageMetadata(filePath) {
    return sharp(filePath).metadata();
}

// Function to group images by metadata
function groupImagesByMetadata(imageMetadataArray) {
    const groupedImagesById = {};

    for (const metadata of imageMetadataArray) {
        const imageIdentifier = metadata.id;

        if (!groupedImagesById[imageIdentifier]) {
            groupedImagesById[imageIdentifier] = { ...metadata };
            groupedImagesById[imageIdentifier].format = [metadata.format];
            groupedImagesById[imageIdentifier].breakPoint =
                assignMediaQueriesForSizes(
                    metadata.imagePath,
                    mediaQueriesConfig
                );
        } else {
            groupedImagesById[imageIdentifier].widths = mergeWidths(
                groupedImagesById[imageIdentifier].widths,
                metadata.widths
            );
            groupedImagesById[imageIdentifier].format.push(metadata.format);
            groupedImagesById[imageIdentifier].breakPoint =
                assignMediaQueriesForSizes(
                    metadata.imagePath,
                    mediaQueriesConfig
                );
        }
    }

    return groupedImagesById;
}

// Function to merge and compare widths
function mergeWidths(existingWidths, newWidths) {
    for (const width of newWidths) {
        if (!existingWidths.includes(width)) {
            console.error(`Width ${width} is missing for an image.`);
            existingWidths.push(width);
        }
    }

    return existingWidths.sort((a, b) => a - b);
}

// Determine the aspect ratio based on image orientation
function calculateAspectRatio(metadataInfo) {
    if (metadataInfo.orientation && metadataInfo.orientation >= 5) {
        return (metadataInfo.height / metadataInfo.width).toFixed(2);
    } else {
        return (metadataInfo.width / metadataInfo.height).toFixed(2);
    }
}

// Function to assign media queries for the 'sizes' attribute based on image path.
function assignMediaQueriesForSizes(imagePath, mediaQueriesConfig) {
    const defaultQuery =
        "no imagePath logic in assignMediaQueriesForSizes function";
    const mediaQuery = mediaQueriesConfig[imagePath] || defaultQuery;
    return mediaQuery;
}

// Main function to generate image metadata
async function generateImageMetadata(directoryPath, imageMetadata) {
    try {
        const files = await readDirectory(directoryPath);

        // Process files and extract metadata
        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            const stats = await readFileMetadata(filePath);

            if (stats.isDirectory()) {
                if (
                    config.excludedDirectories.includes(path.basename(filePath))
                ) {
                    continue;
                }

                await generateImageMetadata(filePath, imageMetadata);
            } else {
                imageMetadata = await processImage(filePath, imageMetadata);
            }
        }
    } catch (error) {
        console.error(`An error occurred: ${error.message}`);
    }
}

// Entry point
(async () => {
    const imageMetadata = {};

    // Start collecting image metadata from the base directory
    await generateImageMetadata(config.rootImagePath, imageMetadata);

    // Convert the metadata object to an array of objects
    const imageMetadataArray = Object.values(imageMetadata);

    // Group images by 'id' and assign media queries for sizes
    const groupedImagesById = groupImagesByMetadata(
        imageMetadataArray,
        mediaQueriesConfig
    );

    // Convert the grouped images back to an array
    const groupedImageArray = Object.values(groupedImagesById);

    // Convert the metadata to JSON and save it to a file
    const jsonData = JSON.stringify(groupedImageArray, null, 2);
    await fs.writeFile(config.outputFileName, jsonData);
    console.log("Image metadata has been generated and saved to images.json.");
})();
