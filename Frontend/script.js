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

// Optional elements used by the helper functions below.
// If these IDs don't exist in your HTML, the functions just
// skip them safely (no crash).
const rasterInfoContainer =
    document.getElementById("rasterInfo");

const valueGridContainer =
    document.getElementById("valueGrid");

const statisticsContainer =
    document.getElementById("statistics");


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
// SHOW STATUS MESSAGE
// ============================================================

function showStatus(message, type = "info") {

    if (!status) {
        return;
    }

    status.textContent = message;

    // "info" | "processing" | "success" | "error"
    status.className = `status ${type}`;

}


// ============================================================
// REMOVE OLD RESULTS (clears previous run's output before a
// new upload is processed)
// ============================================================

function removeOldResults() {

    if (normalizedPreview) {
        normalizedPreview.src = "";
    }

    if (downloadBtn) {
        downloadBtn.removeAttribute("href");
    }

    if (rasterInfoContainer) {
        rasterInfoContainer.innerHTML = "";
    }

    if (valueGridContainer) {
        valueGridContainer.innerHTML = "";
    }

    if (statisticsContainer) {
        statisticsContainer.innerHTML = "";
    }

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
// SHOW RASTER INFORMATION
// (expects result.raster_info as an object of key/value pairs,
//  e.g. { width: 512, height: 512, crs: "EPSG:4326", bands: 1 })
// ============================================================

function showRasterInfo(result) {

    if (!rasterInfoContainer) {
        return;
    }

    const info = result.raster_info;

    if (!info || typeof info !== "object") {
        rasterInfoContainer.innerHTML = "";
        return;
    }

    let html = "<h3>Raster Information</h3><ul>";

    for (const [key, value] of Object.entries(info)) {
        html += `<li><strong>${key}:</strong> ${value}</li>`;
    }

    html += "</ul>";

    rasterInfoContainer.innerHTML = html;

}


// ============================================================
// SHOW VALUE GRID
// (expects a 2D array of numbers, e.g. [[0.1, 0.2], [0.3, 0.4]])
// ============================================================

function showValueGrid(valueGrid) {

    if (!valueGridContainer) {
        return;
    }

    let html = '<h3>Value Grid</h3><table class="value-grid">';

    valueGrid.forEach(row => {

        html += "<tr>";

        row.forEach(cell => {
            const displayValue =
                typeof cell === "number"
                    ? cell.toFixed(3)
                    : cell;

            html += `<td>${displayValue}</td>`;
        });

        html += "</tr>";

    });

    html += "</table>";

    valueGridContainer.innerHTML = html;

}


// ============================================================
// SHOW STATISTICS
// (expects result.statistics as an object, e.g.
//  { min: 0, max: 255, mean: 127.5, std: 40.2 })
// ============================================================

function showStatistics(statistics) {

    if (!statisticsContainer) {
        return;
    }

    let html = "<h3>Statistics</h3><ul>";

    for (const [key, value] of Object.entries(statistics)) {
        const displayValue =
            typeof value === "number"
                ? value.toFixed(4)
                : value;

        html += `<li><strong>${key}:</strong> ${displayValue}</li>`;
    }

    html += "</ul>";

    statisticsContainer.innerHTML = html;

}


// ============================================================
// GET NORMALIZATION METHOD NAME
// (maps the backend's method key to a friendly display name)
// ============================================================

function getMethodName(methodKey) {

    const methodNames = {
        "minmax": "Min-Max Normalization",
        "min-max": "Min-Max Normalization",
        "zscore": "Z-Score Normalization",
        "z-score": "Z-Score Normalization",
        "percentile": "Percentile Normalization (2nd-98th)"
    };

    if (!methodKey) {
        return "Unknown";
    }

    const key = methodKey.toLowerCase();

    return methodNames[key] || methodKey;

}