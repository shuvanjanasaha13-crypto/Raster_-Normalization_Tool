// ============================================================
// RASTERNORM - FRONTEND JAVASCRIPT
// ============================================================


// ============================================================
// CONFIGURATION
// ============================================================

const API_URL = "https://raster-norm-api-q1bl.onrender.com";

const ALLOWED_EXTENSIONS = [
    ".tif",
    ".tiff",
    ".png",
    ".jpg",
    ".jpeg"
];


// ============================================================
// GET HTML ELEMENTS
// ============================================================

const normalizeBtn = document.getElementById("normalizeBtn");
const rasterFile = document.getElementById("rasterFile");
const method = document.getElementById("method");
const status = document.getElementById("status");

const normalizedPreview =
    document.getElementById("normalizedPreview");

const previewContainer =
    document.getElementById("previewContainer");

const downloadBtn =
    document.getElementById("downloadBtn");


// ============================================================
// INITIAL SETTINGS
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    if (previewContainer) {
        previewContainer.style.display = "none";
    }

    if (downloadBtn) {
        downloadBtn.style.display = "none";
    }

});


// ============================================================
// NORMALIZE RASTER
// ============================================================

if (normalizeBtn) {

    normalizeBtn.addEventListener(
        "click",
        async () => {

            const file = rasterFile.files[0];


            // ------------------------------------------------
            // CHECK FILE
            // ------------------------------------------------

            if (!file) {

                showStatus(
                    "Please upload a TIFF, PNG, JPG or JPEG file.",
                    "error"
                );

                return;
            }


            // ------------------------------------------------
            // CHECK FILE TYPE
            // ------------------------------------------------

            const fileName =
                file.name.toLowerCase();


            const isValidFile =
                ALLOWED_EXTENSIONS.some(
                    extension =>
                        fileName.endsWith(extension)
                );


            if (!isValidFile) {

                showStatus(
                    "Unsupported file type. Please upload TIFF, PNG, JPG or JPEG.",
                    "error"
                );

                return;
            }


            // ------------------------------------------------
            // START PROCESSING
            // ------------------------------------------------

            normalizeBtn.disabled = true;

            normalizeBtn.textContent =
                "Processing...";


            showStatus(
                "Connecting to RasterNorm server...",
                "processing"
            );


            // ------------------------------------------------
            // HIDE OLD RESULTS
            // ------------------------------------------------

            if (previewContainer) {

                previewContainer.style.display =
                    "none";

            }


            if (downloadBtn) {

                downloadBtn.style.display =
                    "none";

            }


            removeOldResults();


            // ------------------------------------------------
            // CREATE FORM DATA
            // ------------------------------------------------

            const formData =
                new FormData();


            formData.append(
                "file",
                file
            );


            formData.append(
                "method",
                method.value
            );


            // ------------------------------------------------
            // DEBUG INFORMATION
            // ------------------------------------------------

            console.log(
                "API URL:",
                `${API_URL}/normalize`
            );

            console.log(
                "File:",
                file.name
            );

            console.log(
                "File Size:",
                file.size
            );

            console.log(
                "Method:",
                method.value
            );


            // =================================================
            // SEND REQUEST
            // =================================================

            try {

                showStatus(
                    "Uploading raster and processing...",
                    "processing"
                );


                const response =
                    await fetch(
                        `${API_URL}/normalize`,
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                console.log(
                    "Response Status:",
                    response.status
                );


                // --------------------------------------------
                // GET RESPONSE TEXT FIRST
                // --------------------------------------------

                const responseText =
                    await response.text();


                console.log(
                    "Server Response:",
                    responseText
                );


                let result;


                try {

                    result =
                        JSON.parse(
                            responseText
                        );

                }

                catch {

                    throw new Error(
                        `Server returned invalid data. HTTP ${response.status}`
                    );

                }


                // --------------------------------------------
                // HANDLE HTTP ERROR
                // --------------------------------------------

                if (!response.ok) {

                    throw new Error(
                        result.error ||
                        result.message ||
                        `Server Error: HTTP ${response.status}`
                    );

                }


                // --------------------------------------------
                // HANDLE FAILED RESPONSE
                // --------------------------------------------

                if (!result.success) {

                    throw new Error(
                        result.error ||
                        "Raster normalization failed."
                    );

                }


                // =============================================
                // DISPLAY PREVIEW
                // =============================================

                displayPreview(
                    result
                );


                // =============================================
                // DISPLAY DOWNLOAD BUTTON
                // =============================================

                displayDownload(
                    result
                );


                // =============================================
                // SHOW RASTER INFORMATION
                // =============================================

                showRasterInfo(
                    result
                );


                // =============================================
                // SHOW VALUE GRID
                // =============================================

                if (
                    Array.isArray(
                        result.value_grid
                    )
                    &&
                    result.value_grid.length > 0
                ) {

                    showValueGrid(
                        result.value_grid
                    );

                }


                // =============================================
                // SHOW STATISTICS
                // =============================================

                if (
                    result.statistics
                ) {

                    showStatistics(
                        result.statistics
                    );

                }


                // =============================================
                // SHOW RESULTS
                // =============================================

                if (previewContainer) {

                    previewContainer.style.display =
                        "block";

                }


                // =============================================
                // SUCCESS MESSAGE
                // =============================================

                const methodName =
                    getMethodName(
                        result.normalization_method ||
                        method.value
                    );


                showStatus(
                    `Normalization completed successfully! Method: ${methodName}`,
                    "success"
                );


            }


            // =================================================
            // ERROR HANDLING
            // =================================================

            catch (error) {

                console.error(
                    "RasterNorm Error:",
                    error
                );


                let errorMessage =
                    error.message ||
                    "Unknown error occurred.";


                // --------------------------------------------
                // CONNECTION ERROR
                // --------------------------------------------

                if (
                    error.name === "TypeError"
                    &&
                    errorMessage.toLowerCase()
                        .includes("fetch")
                ) {

                    errorMessage =
                        "Connection failed. The backend server could not be reached. " +
                        "Please check the Render server and try again.";

                }


                showStatus(
                    `Error: ${errorMessage}`,
                    "error"
                );

            }


            // =================================================
            // FINISH
            // =================================================

            finally {

                normalizeBtn.disabled =
                    false;


                normalizeBtn.textContent =
                    "Normalize Raster";

            }

        }
    );

}


// ============================================================
// DISPLAY PREVIEW
// ============================================================

function displayPreview(result) {

    if (!normalizedPreview) {
        return;
    }


    const imageData =
        result.normalized_spatial_map ||
        result.preview;


    if (!imageData) {
        return;
    }


    // Base64 Image

    if (
        !imageData.startsWith("http")
        &&
        !imageData.startsWith("data:image")
    ) {

        normalizedPreview.src =
            `data:image/png;base64,${imageData}`;

    }


    // Complete URL

    else if (
        imageData.startsWith("http")
    ) {

        normalizedPreview.src =
            imageData;

    }


    // Data URL

    else {

        normalizedPreview.src =
            imageData;

    }

}


// ============================================================
// DISPLAY DOWNLOAD BUTTON
// ============================================================

function displayDownload(result) {

    if (
        !downloadBtn ||
        !result.download_url
    ) {
        return;
    }


    let downloadURL =
        result.download_url;


    // Add Backend URL

    if (
        !downloadURL.startsWith("http")
    ) {

        downloadURL =
            `${API_URL}${downloadURL}`;

    }


    downloadBtn.href =
        downloadURL;


    downloadBtn.download =
        "normalized_raster.tif";


    downloadBtn.style.display =
        "inline-block";

}


// ============================================================
// GET NORMALIZATION METHOD NAME
// ============================================================
