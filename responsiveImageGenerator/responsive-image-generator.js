// this script is for converting the original image files into specified widths. First a copy of the original files are created in webp format. The widths are configured with widths parameters. The images genarated are in the current format of the original file (jpg or png currently supported) as well as webp.
// after new image files are generated and added to the relevant dir in /public/images, images.json must be updated by executing generateImageMetadata.js


"use strict";

import fs from "fs";
import path from "path";
import { promisify } from "util";
import { execSync } from "child_process";
import sharp from "sharp";
import sizeOf from "image-size";

const readdir = fs.promises.readdir;
const { stat, unlink } = fs.promises;

class ImageProcessor {
    constructor() {
        this.scriptDir = path.dirname(decodeURI(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)\//, '$1/')));
        this.sourceDir = path.join(
            this.scriptDir,
            process.env.SOURCE_DIR || "original"
        );
        this.imageQuality = 80;
        this.webpImageQuality = 90;
        this.widths = [256, 455, 640, 768, 960, 1024, 1366, 1920];
        this.imageExtensions = this.getImageExtensions();
        this.outputDirs = this.getOutputDirectories();
    }

    getImageExtensions() {
        const uniqueExtensions = Array.from(
            new Set(
                fs
                    .readdirSync(this.sourceDir)
                    .map((file) => path.extname(file).toLowerCase())
            )
        );
        uniqueExtensions.push(".webp");
        return uniqueExtensions;
    }

    getOutputDirectories() {
        const outputDirs = {
            webp: path.join(this.scriptDir, "webp"),
        };

        this.imageExtensions.forEach((ext) => {
            outputDirs[ext.slice(1)] = path.join(this.scriptDir, ext.slice(1));
            fs.mkdirSync(outputDirs[ext.slice(1)], { recursive: true });
        });

        return outputDirs;
    }

    async getImageOrientation(filePath) {
        try {
            const dimensions = sizeOf(filePath);
            return dimensions.orientation;
        } catch (error) {
            throw error;
        }
    }

    async removeMetadataFromImageFile(filePath) {
        try {
            const imageBuffer = await sharp(filePath).toBuffer();
            const initialOrientation = await this.getImageOrientation(filePath);
            let rotatedImageBuffer;

            switch (initialOrientation) {
                case 3:
                    rotatedImageBuffer = await sharp(imageBuffer)
                        .rotate(180)
                        .toBuffer();
                    break;
                case 6:
                    rotatedImageBuffer = await sharp(imageBuffer)
                        .rotate(90)
                        .toBuffer();
                    break;
                case 8:
                    rotatedImageBuffer = await sharp(imageBuffer)
                        .rotate(-90)
                        .toBuffer();
                    break;
                default:
                    rotatedImageBuffer = imageBuffer;
                    break;
            }

            await sharp(rotatedImageBuffer).toFile(filePath, {
                orientation: 1,
            });
            console.log(
                `Metadata removed (except orientation) from ${filePath}`
            );
        } catch (error) {
            console.error(`Error removing metadata from ${filePath}:`, error);
        }
    }

    async initializeMetadataRemoval() {
        try {
            console.log("Removing metadata from image files.");
            const originalFiles = await readdir(this.sourceDir);

            await Promise.all(
                originalFiles.map(async (file) => {
                    const filePath = path.join(this.sourceDir, file);

                    if (
                        this.imageExtensions.includes(
                            path.extname(filePath).toLowerCase()
                        )
                    ) {
                        await this.removeMetadataFromImageFile(filePath);
                    } else {
                        console.log(`Skipping non-image file: ${filePath}`);
                    }
                })
            );

            console.log("Metadata removal complete.");
        } catch (error) {
            console.error("Error removing metadata from image files:", error);
        }
    }

    formatFileExtensionToLowercase(fileExtension) {
        return fileExtension.toLowerCase();
    }

    async generateResizedImages() {
        try {
            console.log("Generating resized images.");
            const originalFiles = await readdir(this.sourceDir);

            await Promise.all(
                originalFiles.map(async (file) => {
                    const filePath = path.join(this.sourceDir, file);
                    const { name, ext } = path.parse(file);
                    const formattedExt =
                        this.formatFileExtensionToLowercase(ext);

                    if (this.imageExtensions.includes(formattedExt)) {
                        const outputDir =
                            this.outputDirs[formattedExt.slice(1)];
                        if (!fs.existsSync(outputDir)) {
                            fs.mkdirSync(outputDir, { recursive: true });
                        }

                        const dimensions = sizeOf(filePath);

                        await Promise.all(
                            this.widths.map(async (width) => {
                                const resizedOutputPath = path.join(
                                    outputDir,
                                    `${name}-${width}${formattedExt}`
                                );
                                try {
                                    await sharp(filePath)
                                        .resize({
                                            width,
                                            withoutEnlargement: true,
                                        })
                                        .toFile(resizedOutputPath, {
                                            quality: this.imageQuality,
                                        });
                                    console.log(
                                        `Generated ${resizedOutputPath}`
                                    );
                                } catch (error) {
                                    console.error(
                                        `Error resizing ${file} to ${name}-${width}.${formattedExt}:`,
                                        error
                                    );
                                }
                            })
                        );
                    } else {
                        console.log(`Skipping non-image file: ${filePath}`);
                    }
                })
            );

            console.log("Resized image generation complete.");
        } catch (error) {
            console.error("Error generating resized images:", error);
        }
    }

    async preserveOrientationForWebp(inputFile, tempFile) {
        try {
            execSync(
                `magick convert "${inputFile}" -auto-orient "${tempFile}"`
            );
        } catch (error) {
            console.error(
                `Error preserving orientation for ${inputFile}:`,
                error
            );
        }
    }

    async convertOriginalImagesToWebP() {
        try {
            console.log(`Processing files in ${this.sourceDir}`);
            const files = await readdir(this.sourceDir);

            await Promise.all(
                files.map(async (file) => {
                    const filePath = path.join(this.sourceDir, file);
                    const { name, ext } = path.parse(file);

                    try {
                        const fileStat = await stat(filePath);
                        if (
                            fileStat.isFile() &&
                            this.imageExtensions.includes(ext.toLowerCase())
                        ) {
                            const tempFile = path.join(
                                this.scriptDir,
                                `temp_${name}${ext}`
                            );
                            await this.preserveOrientationForWebp(
                                filePath,
                                tempFile
                            );

                            console.log(`Converting ${file} to ${name}.webp`);
                            const webpOutputPath = path.join(
                                this.outputDirs.webp,
                                `${name}.webp`
                            );

                            try {
                                execSync(
                                    `cwebp "${tempFile}" -o "${webpOutputPath}" -q 100`
                                );
                            } catch (error) {
                                console.error(
                                    `Error converting ${file} to ${name}.webp:`,
                                    error
                                );
                            }

                            this.widths.forEach(async (width) => {
                                const resizedOutputPath = path.join(
                                    this.outputDirs.webp,
                                    `${name}-${width}.webp`
                                );
                                try {
                                    execSync(
                                        `cwebp "${tempFile}" -o "${resizedOutputPath}" -q ${this.webpImageQuality} -resize ${width} 0`
                                    );
                                } catch (error) {
                                    console.error(
                                        `Error resizing ${file} to ${name}-${width}.webp:`,
                                        error
                                    );
                                }
                            });

                            try {
                                await unlink(tempFile);
                            } catch (error) {
                                console.error(
                                    `Error deleting temporary file ${tempFile}:`,
                                    error
                                );
                            }
                        }
                    } catch (error) {
                        console.error(
                            `Error processing file ${file} in convertOriginalImagesToWebP:`,
                            error
                        );
                    }
                })
            );

            console.log("Conversion complete.");
        } catch (err) {
            console.error("Error reading directory:", err);
        }
    }

    async processImages() {
        try {
            await this.initializeMetadataRemoval();
            await this.generateResizedImages();
            await this.convertOriginalImagesToWebP();
        } catch (error) {
            console.error("Error:", error);
        }
    }
}

// Usage
const imageProcessor = new ImageProcessor();
imageProcessor.processImages();

// 'use strict';

// const fs = require('fs');
// const path = require('path');
// const { promisify } = require('util');
// const { execSync } = require('child_process');
// const sharp = require('sharp');
// const sizeOf = require('image-size');

// const readdir = fs.promises.readdir;
// const { stat, unlink } = fs.promises;

// const scriptDir = path.dirname(require.main.filename);
// const sourceDir = path.join(scriptDir, process.env.SOURCE_DIR || 'original');

// // Configurable image parameters
// const imageQuality = 80
// const webpImageQuality = 90
// const widths = [256, 455, 640, 768, 960, 1024, 1366, 1920];

// // Get the unique image extensions in the source directory
// const imageExtensions = Array.from(new Set(fs.readdirSync(sourceDir).map(file => path.extname(file).toLowerCase())));
// // Add the "webp" extension to the array
// imageExtensions.push('.webp');

// // Generate output directories dynamically based on image extensions
// const OUTPUT_DIRS = {
//     webp: path.join(scriptDir, 'webp'),
// };

// imageExtensions.forEach(ext => {
//   OUTPUT_DIRS[ext.slice(1)] = path.join(scriptDir, ext.slice(1));
//   fs.mkdirSync(OUTPUT_DIRS[ext.slice(1)], { recursive: true });
// });

// /******************************************
// /* Removing image metadata while maintaining orientation
// /*******************************************/

// async function getImageOrientation(filePath) {
//   return new Promise((resolve, reject) => {
//     try {
//       const dimensions = sizeOf(filePath);
//       resolve(dimensions.orientation);
//     } catch (error) {
//       reject(error);
//     }
//   });
// }

// async function removeMetadataFromImageFile(filePath) {
//   try {
//     // Read the image with metadata
//     const imageBuffer = await sharp(filePath).toBuffer();

//     // Extract initial orientation information
//     const initialOrientation = await getImageOrientation(filePath);

//     // debugging issues, remove when done!!!
//     console.log(`Initial Orientation for ${filePath}: ${initialOrientation}`);

//     // Rotate the image based on the initial orientation
//     let rotatedImageBuffer;
//     switch (initialOrientation) {
//       case 3:
//         rotatedImageBuffer = await sharp(imageBuffer).rotate(180).toBuffer();
//         break;
//       case 6:
//         rotatedImageBuffer = await sharp(imageBuffer).rotate(90).toBuffer();
//         break;
//       case 8:
//         rotatedImageBuffer = await sharp(imageBuffer).rotate(-90).toBuffer();
//         break;
//       default:
//         rotatedImageBuffer = imageBuffer;
//         break;
//     }

//     // Write the image back with only the orientation metadata
//     await sharp(rotatedImageBuffer).toFile(filePath, { orientation: 1 });

//     console.log(`Metadata removed (except orientation) from ${filePath}`);
//   } catch (error) {
//     console.error(`Error removing metadata from ${filePath}:`, error);
//   }
// }

// async function initializeMetadataRemoval() {
//   try {
//     console.log('Removing metadata from image files.');

//     // Get the files in the original directory
//     const originalFiles = await readdir(sourceDir);

//     await Promise.all(originalFiles.map(async (file) => {
//       const filePath = path.join(sourceDir, file);

//       // Check if the file is an image before attempting metadata removal
//       if (imageExtensions.includes(path.extname(filePath).toLowerCase())) {
//         await removeMetadataFromImageFile(filePath);
//       } else {
//         console.log(`Skipping non-image file: ${filePath}`);
//       }
//     }));

//     console.log('Metadata removal complete.');
//   } catch (error) {
//     console.error('Error removing metadata from image files:', error);
//   }
// }

// /******************************************
// /* generating original format images
// /*******************************************/

// function formatFileExtensionToLowercase(fileExtension) {
//   return fileExtension.toLowerCase();
// }

// async function generateResizedImages() {
//   try {
//     console.log('Generating resized images.');

//     // Get the files in the original directory
//     const originalFiles = await readdir(sourceDir);

//     await Promise.all(originalFiles.map(async (file) => {
//       const filePath = path.join(sourceDir, file);
//       const { name, ext } = path.parse(file);

//       // Format the file extension to lowercase
//       const formattedExt = formatFileExtensionToLowercase(ext);

//       // Check if the file is an image before attempting to generate resized images
//       if (imageExtensions.includes(formattedExt)) {
//         // Ensure the output directory exists
//         const outputDir = OUTPUT_DIRS[formattedExt.slice(1)];
//         if (!fs.existsSync(outputDir)) {
//           fs.mkdirSync(outputDir, { recursive: true });
//         }

//         // Read the image dimensions
//         const dimensions = sizeOf(filePath);

//         // Generate images based on widths
//         await Promise.all(widths.map(async (width) => {
//           const resizedOutputPath = path.join(outputDir, `${name}-${width}${formattedExt}`);
//           try {
//             await sharp(filePath)
//               .resize({ width, withoutEnlargement: true })
//               .toFile(resizedOutputPath, { quality: imageQuality });
//             console.log(`Generated ${resizedOutputPath}`);
//           } catch (error) {
//             console.error(`Error resizing ${file} to ${name}-${width}.${formattedExt}:`, error);
//           }
//         }));
//       } else {
//         console.log(`Skipping non-image file: ${filePath}`);
//       }
//     }));

//     console.log('Resized image generation complete.');
//   } catch (error) {
//     console.error('Error generating resized images:', error);
//   }
// }

// /******************************************
// /* converting to, and generating webp images
// /*******************************************/

// async function preserveOrientationForWebp(inputFile, tempFile) {
//   try {
//     execSync(`magick convert "${inputFile}" -auto-orient "${tempFile}"`);
//   } catch (error) {
//     console.error(`Error preserving orientation for ${inputFile}:`, error);
//   }
// }

// async function convertOriginalImagesToWebP() {
//   try {
//     console.log(`Processing files in ${sourceDir}`);
//     const files = await readdir(sourceDir);

//     await Promise.all(files.map(async (file) => {
//       const filePath = path.join(sourceDir, file);
//       const { name, ext } = path.parse(file);

//       try {
//         const fileStat = await stat(filePath);
//         if (fileStat.isFile() && imageExtensions.includes(ext.toLowerCase())) {
//           const tempFile = path.join(scriptDir, `temp_${name}${ext}`);

//           await preserveOrientationForWebp(filePath, tempFile);

//           // Convert to webp
//           console.log(`Converting ${file} to ${name}.webp`);
//           const webpOutputPath = path.join(OUTPUT_DIRS.webp, `${name}.webp`);
//           try {
//             execSync(`cwebp "${tempFile}" -o "${webpOutputPath}" -q 100`);
//           } catch (error) {
//             console.error(`Error converting ${file} to ${name}.webp:`, error);
//           }

//           // Generate images based on widths
//           widths.forEach(async (width) => {
//             const resizedOutputPath = path.join(OUTPUT_DIRS.webp, `${name}-${width}.webp`);
//             try {
//               execSync(`cwebp "${tempFile}" -o "${resizedOutputPath}" -q ${webpImageQuality} -resize ${width} 0`);
//             } catch (error) {
//               console.error(`Error resizing ${file} to ${name}-${width}.webp:`, error);
//             }
//           });

//           // Clean up the temporary file
//           try {
//             await unlink(tempFile);
//           } catch (error) {
//             console.error(`Error deleting temporary file ${tempFile}:`, error);
//           }
//         }
//       } catch (error) {
//         console.error(`Error processing file ${file} in convertOriginalImagesToWebP:`, error);
//       }
//     }));

//     console.log('Conversion complete.');
//   } catch (err) {
//     console.error('Error reading directory:', err);
//   }
// }

// // Call the functions
// initializeMetadataRemoval()
//   .then(() => generateResizedImages())
//   .then(() => convertOriginalImagesToWebP())
//   .catch((error) => console.error('Error:', error));
