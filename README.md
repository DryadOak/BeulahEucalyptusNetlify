# Beulah Eucalyptus

A website for showcasing and selling high-quality eucalyptus foliage and products.

**Full Website:** https://beulaheucalyptus.co.uk/

## How It's Made:

### Server:
The server-side architecture underwent a transition from an initial implementation using an Express server with ejs-layouts to a Netlify environment. The migration to Netlify was prompted by the client's specific requirements and the desire to leverage Netlify's serverless functions.

**Technologies Used:**
- Express.js: Initially used for handling server-side logic and routing.
- EJS: Employed for server-side templating to structure and render views.
- Validation and Sanitisation: Implemented form validation and sanitisation for improved security.
- Nodemailer: Utilized Nodemailer for forwarding validated forms, streamlining communication and order processing.
- Netlify with serverless-http: Transitioned to Netlify, utilizing the serverless-http middleware to adapt the Express app for serverless deployment.

**Build Process:**
- The EJS templates, crucial for dynamic content rendering, are pre-rendered to HTML with build.js. This ensures compatibility with Netlify's primarily static site hosting infrastructure.
- Responsive Image Generation: While alternative solutions were available, my curiosity led me to develop custom JavaScript scripts. These scripts facilitate responsive image generation, enabling dynamic configuration of width, format, and quality. This enhances website performance and optimises image delivery based on user devices. See the 'Responsive Image Generation Guide' below for details on added images.

### Client:
**The main website features are:**
- Browsing a diverse range of eucalyptus products and foliage.
- Learn about the benefits and uses of eucalyptus with informative content.
- User-friendly forms for custom orders, inquiries, and feedback.
- Responsive Design & Interaction

**Technologies Used:**
HTML, CSS, JavaScript

## Optimizations:
Initially, Cumulative Layout Shift (CLS) posed challenges for users with slower internet connections, causing elements to abruptly shift when images were rendered. To mitigate this, I implemented a blur effect as a placeholder, significantly reducing CLS. This optimization not only addressed the layout shift issue but also improved the overall user experience by eliminating image loading jank and smoothly transitioning images in after they are fully downloaded.

Looking forward, while the responsive image generator served its purpose for the project, it requires further improvements. Notably, aspects like proper error handling for images with the same name and streamlining file management after image creation are essential features that I plan to include in the future.


## Lessons Learned:
This project has been a fantastic learning experience introducing me to new features and middleware. Providing countless moments of 'whoa this is awesome' as well as 'why are none of my images rendering' (turns out Prettier introduces line breaks that can break EJS). While the learning opportunities have been plentiful, here are some of my key takeaways:
- Don't push new features to production late on a Friday if you want to have a peaceful weekend.
- Always make sure your linter supports the languages your using
- Debugging can be like detective work, it's much more enjoyable with fresh coffee and daylight.
- Discovering good documentation is like finding a well-drawn map, it's a joy. So try and be a cartographer of your codebase.
- I find it very hard to switch off, remember to take a break.

## Installation
To run this website locally for development, follow these steps:

### 1. Clone the Repository:
```bash
 git clone https://github.com/DryadOak/BeulahEucalyptusNetlify.git
```
### 2. Navigate to the Project Folder and Install Dependencies:
```bash
   cd BeulahEucalyptusNetlify
```
```bash
 npm install
```
### 3. Install Netlify CLI (if not already installed):
The Netlify CLI (Command Line Interface) is a powerful tool that provides various commands for interacting with the Netlify platform.
```bash
 npm install netlify-cli -g
``` 
### 4. Run the Application locally using Netlify Dev:
```bash
 npm run netlify-dev
``` 
Netlify Dev runs local servers for your frontend and serverless functions, bringing a variety of utilities to your local development environment, and even replicates some of Netlify's edge logic and routing rules available to you for testing and development. It should open your live server in a new tab.

## Build Script and EJS Pre-rendering
This project includes a build script that pre-renders EJS files in the views directory to HTML files in the public directory. To execute the build script, use the following command:
```bash
 npm run build
``` 
**Important:**

Make final changes to the EJS files in the views directory, not the HTML files in the public directory. The HTML files in the public directory will be overwritten when the build script is executed.
To add or make changes to image files,Please follow the [Responsive Image Generation Guide](#responsive-image-generation-guide) below.


## Folder Structure
The project is organised into the following main directories and files:

- **`functions`:** Contains serverless functions, including `app.js` for backend logic.
- **`public`:** The directory containing CSS, JS, images, and pre-rendered HTML.
- **`responsiveImageGenerator`:** Includes scripts for generating responsive images (`responsive-image-generator.js`, `generate-image-metadata.js`, and `images.json`).
- **`views`:** Contains EJS layouts, partials, and templates.

- **`build.js`:** Build script for pre-rendering EJS to HTML.
- **`email-config-and-sender.js`:** Configuration and logic for forwarding form submissions via email using Nodemailer.
- **`form-validation.js`:** Script for validating and sanitizing form submissions.
- **`headPageData.js`:** Includes page-specific meta data for the `<head>` tag.
- **`netlify.toml`:** netlify config.


# Responsive Image Generation Guide

This guide will walk you through the process of adding and generating responsive images for the website.

## Prerequisites

-   Node.js installed on your machine.
-   ImageMagick installed on your system. You can download it from the official website: https://imagemagick.org/script/download.php. Ensure you give read and write permission for input and output dirs.
-   Install cwebp https://developers.google.com/speed/webp/download

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

When the new image files are moved to the directory, run the following command to update the objects in images.json. The images.json is used by the build script and passed into the imagesSrcset EJS partial to pre-render the html:

```bash
node generate-image-metadata.js
```

## Additional Notes

-   Ensure that [Node.js](https://nodejs.org/) is installed on your machine before running the scripts.
-   Review and update directory logic in `generateImageMetadata.js` if needed.
-   If creating a new directory, add a comment to explain its logic for future reference.

By following these steps, you'll effectively add and generate responsive images for the website.
