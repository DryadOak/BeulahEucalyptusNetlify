https://github.com/alec-chernicki/portfolio-template look at examples for inspo

# Responsive Image Generation Guide

This guide will walk you through the process of adding and generating responsive images for the website.

## Prerequisites

-   Node.js installed on your machine.
-   ImageMagick installed on your system. You can download it from the official website: https://imagemagick.org/script/download.php. Ensure you give read and write permission for input and output dirs.

## Steps

### 1. Add High-Resolution Images

Place your high-resolution image in the `responsiveImageGenerator/original` directory.

### 2. Configure Image Processing

In the `responsive-image-generator.js` file, locate the `ImageProcessor` class and manipulate the following properties:

-   `imageQuality`: Set the quality of the image.
-   `webpImageQuality`: Set the quality of WebP format images.
-   `widths`: Specify the desired widths for responsive images.

### 3. Run Image Processing

In responsiveImageGenerator dir execute the following command in your terminal:

```bash
node responsive-image-generator.js
```

This command will process the high-resolution image and generate optimized versions for various screen sizes.

### 4. Organize Image Files

Move the processed image files to the relevant directory in /public/images. The directory you choose will determine the media queries assigned to the size attribute in the srcset. For more details on directory logic, refer to generateImageMetadata.js.

If the new images don't fit an existing directory, create a new one. Clearly outline its logic with comments.

### 5. Update Image Metadata

Run the following command to update the objects in images.json, which is used by the server:

```bash
node generate-image-metadata.js
```

## Additional Notes

-   Ensure that [Node.js](https://nodejs.org/) is installed on your machine before running the scripts.
-   Review and update directory logic in `generateImageMetadata.js` if needed.
-   If creating a new directory, add a comment to explain its logic for future reference.

By following these steps, you'll effectively add and generate responsive images for the website.
