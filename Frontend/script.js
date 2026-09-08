// ============================================================
// RASTERNORM - FRONTEND JAVASCRIPT
// COMPLETE VERSION
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

const REQUEST_TIMEOUT = 120000;


// ============================================================
// GET HTML ELEMENTS
// ============================================================

const normalizeBtn =
    document.getElementById("normalizeBtn");

const rasterFile =
    document.getElementById("rasterFile");

const method =
    document.getElementById("method");

const status =
    document.getElementById("status");

const normalizedPreview =
    document.getElementById("normalizedPreview");

const previewContainer =
    document.getElementById("previewContainer");

const downloadBtn =
    document.getElementById("downloadBtn");


// ============================================================
// RESULT CONTAINERS
// ============================================================

const rasterInfoContainer =
    document.getElementById("rasterInfo");

const valueGridContainer =
    document.getElementById("valueGrid");

const statisticsContainer =
    document.getElementById("statistics");


// ============================================================
// INITIAL SETTINGS
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        if (previewContainer) {

            previewContainer.style.display =
                "none";

        }


        if (downloadBtn) {

            downloadBtn.style.display =
                "none";

        }

    }
);


// ============================================================
// NORMALIZE BUTTON
// ============================================================

if (normalizeBtn) {

    normalizeBtn.addEventListener(
        "click",
        normalizeRaster
    );

}


// ============================================================
// NORMALIZE RASTER
// ============================================================

async function normalizeRaster() {

    // ========================================================
    // CHECK FILE INPUT
    // ========================================================

    if (!rasterFile) {

        showStatus(
            "Error: File input not found.",
            "error"
        );

        return;

    }


    const file =
        rasterFile.files[0];


    // ========================================================
    // CHECK FILE
    // ========================================================

    if (!file) {

        showStatus(
            "Please upload a TIFF, PNG, JPG or JPEG file.",
            "error"
        );

        return;

    }


    // ========================================================
    // CHECK FILE TYPE
    // ========================================================

    const fileName =
        file.name.toLowerCase();


    const validFile =
        ALLOWED_EXTENSIONS.some(
            extension =>
                fileName.endsWith(extension)
        );


    if (!validFile) {

        showStatus(
            "Unsupported file type. Please upload TIFF, TIF, PNG, JPG or JPEG.",
            "error"
        );

        return;

    }


    // ========================================================
    // START PROCESSING
    // ========================================================

    setProcessingState(
        true
    );


    showStatus(
        "Uploading raster and starting normalization...",
        "processing"
    );


    // ========================================================
    // CLEAR OLD RESULTS
    // ========================================================

    removeOldResults();


    // ========================================================
    // CREATE FORM DATA
    // ========================================================

    const formData =
        new FormData();


    formData.append(
        "file",
        file
    );


    formData.append(
        "method",
        method
            ? method.value
            : "minmax"
    );


    // ========================================================
    // DEBUG
    // ========================================================

    console.log(
        "================================"
    );

    console.log(
        "RASTERNORM PROCESS STARTED"
    );

    console.log(
        "API:",
        `${API_URL}/normalize`
    );

    console.log(
        "File:",
        file.name
    );

    console.log(
        "File Size:",
        file.size,
        "bytes"
    );

    console.log(
        "Method:",
        method
            ? method.value
            : "minmax"
    );

    console.log(
        "================================"
    );


    // ========================================================
    // REQUEST CONTROLLER
    // ========================================================

    const controller =
        new AbortController();


    const timeout =
        setTimeout(
            () => {

                controller.abort();

            },
            REQUEST_TIMEOUT
        );


    // ========================================================
    // SEND REQUEST
    // ========================================================

    try {

        const response =
            await fetch(
                `${API_URL}/normalize`,
                {

                    method: "POST",

                    body: formData,

                    signal:
                        controller.signal

                }
            );


        clearTimeout(
            timeout
        );


        console.log(
            "Response Status:",
            response.status
        );


        // ====================================================
        // GET RESPONSE
        // ====================================================

        const contentType =
            response.headers.get(
                "content-type"
            );


        let result;


        if (
            contentType
            &&
            contentType.includes(
                "application/json"
            )
        ) {

            result =
                await response.json();

        }

        else {

            const responseText =
                await response.text();


            console.error(
                "Invalid Server Response:",
                responseText.substring(
                    0,
                    1000
                )
            );


            throw new Error(
                "Server returned an invalid response."
            );

        }


        // ====================================================
        // HTTP ERROR
        // ====================================================

        if (!response.ok) {

            throw new Error(

                result.error ||

                result.message ||

                `Server error: HTTP ${response.status}`

            );

        }


        // ====================================================
        // API ERROR
        // ====================================================

        if (!result.success) {

            throw new Error(

                result.error ||

                result.message ||

                "Raster normalization failed."

            );

        }


        // ====================================================
        // SUCCESS
        // ====================================================

        console.log(
            "Normalization successful."
        );


        // ====================================================
        // DISPLAY PREVIEW
        // ====================================================

        displayPreview(
            result
        );


        // ====================================================
        // DISPLAY DOWNLOAD
        // ====================================================

        displayDownload(
            result
        );


        // ====================================================
        // DISPLAY RASTER INFORMATION
        // ====================================================

        showRasterInfo(
            result
        );


        // ====================================================
        // DISPLAY VALUE GRID
        // ====================================================

        showValueGrid(
            result.value_grid
        );


        // ====================================================
        // DISPLAY STATISTICS
        // ====================================================

        showStatistics(
            result.statistics
        );


        // ====================================================
        // SHOW RESULT SECTION
        // ====================================================

        if (previewContainer) {

            previewContainer.style.display =
                "block";

        }


        // ====================================================
        // SUCCESS MESSAGE
        // ====================================================

        const methodName =
            result.normalization_method_name ||

            getMethodName(
                result.normalization_method
            );


        showStatus(

            `✓ Normalization completed successfully using ${methodName}`,

            "success"

        );


        // ====================================================
        // SCROLL TO RESULT
        // ====================================================

        setTimeout(
            () => {

                if (previewContainer) {

                    previewContainer.scrollIntoView(
                        {
                            behavior: "smooth",
                            block: "start"
                        }
                    );

                }

            },
            300
        );


    }


    // ========================================================
    // ERROR HANDLING
    // ========================================================

    catch (error) {

        clearTimeout(
            timeout
        );


        console.error(
            "RasterNorm Error:",
            error
        );


        let errorMessage =
            error.message ||
            "Unknown error occurred.";


        // ====================================================
        // TIMEOUT
        // ====================================================

        if (
            error.name === "AbortError"
        ) {

            errorMessage =
                "Request timed out. The raster may be too large or the Render server is taking too long.";

        }


        // ====================================================
        // CORS / CONNECTION ERROR
        // ====================================================

        else if (
            error.name === "TypeError"
        ) {

            errorMessage =
                "Connection failed. This may be a CORS configuration problem or the backend server is unavailable.";

        }


        // ====================================================
        // SHOW ERROR
        // ====================================================

        showStatus(

            `✕ ${errorMessage}`,

            "error"

        );

    }


    // ========================================================
    // FINALLY
    // ========================================================

    finally {

        setProcessingState(
            false
        );

    }

}


// ============================================================
// PROCESSING STATE
// ============================================================

function setProcessingState(
    isProcessing
) {

    if (!normalizeBtn) {
        return;
    }


    normalizeBtn.disabled =
        isProcessing;


    if (isProcessing) {

        normalizeBtn.textContent =
            "Processing Raster...";

    }

    else {

        normalizeBtn.textContent =
            "Normalize Raster";

    }

}


// ============================================================
// SHOW STATUS
// ============================================================

function showStatus(
    message,
    type = "info"
) {

    if (!status) {
        return;
    }


    status.textContent =
        message;


    status.className =
        `status ${type}`;

}


// ============================================================
// REMOVE OLD RESULTS
// ============================================================

function removeOldResults() {

    // Preview

    if (normalizedPreview) {

        normalizedPreview.src =
            "";

    }


    // Download

    if (downloadBtn) {

        downloadBtn.removeAttribute(
            "href"
        );


        downloadBtn.style.display =
            "none";

    }


    // Raster Information

    if (rasterInfoContainer) {

        rasterInfoContainer.innerHTML =
            "";

    }


    // Value Grid

    if (valueGridContainer) {

        valueGridContainer.innerHTML =
            "";

    }


    // Statistics

    if (statisticsContainer) {

        statisticsContainer.innerHTML =
            "";

    }


    // Result Container

    if (previewContainer) {

        previewContainer.style.display =
            "none";

    }

}


// ============================================================
// DISPLAY PREVIEW
// ============================================================

function displayPreview(
    result
) {

    if (!normalizedPreview) {
        return;
    }


    const imageData =

        result.normalized_spatial_map ||

        result.preview;


    if (!imageData) {

        console.warn(
            "No preview image received."
        );

        return;

    }


    // ========================================================
    // BASE64 IMAGE
    // ========================================================

    if (

        !imageData.startsWith("http")

        &&

        !imageData.startsWith("data:image")

    ) {

        normalizedPreview.src =

            `data:image/png;base64,${imageData}`;

    }


    // ========================================================
    // URL
    // ========================================================

    else if (
        imageData.startsWith("http")
    ) {

        normalizedPreview.src =
            imageData;

    }


    // ========================================================
    // DATA URL
    // ========================================================

    else {

        normalizedPreview.src =
            imageData;

    }


    normalizedPreview.onerror =
        () => {

            console.error(
                "Preview image failed to load."
            );

        };

}


// ============================================================
// DISPLAY DOWNLOAD BUTTON
// ============================================================

function displayDownload(
    result
) {

    if (
        !downloadBtn
    ) {
        return;
    }


    if (
        !result.download_url
    ) {

        console.warn(
            "Download URL not found."
        );

        return;

    }


    let downloadURL =
        result.download_url;


    // ========================================================
    // ADD API URL
    // ========================================================

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
// ============================================================

function showRasterInfo(
    result
) {

    if (!rasterInfoContainer) {
        return;
    }


    // ========================================================
    // CREATE INFORMATION OBJECT
    // ========================================================

    const rasterInfo = {

        "File Name":

            result.filename ||
            "Unknown",


        "File Type":

            result.file_type ||
            "Unknown",


        "Width":

            result.width ??
            "Unknown",


        "Height":

            result.height ??
            "Unknown",


        "CRS":

            result.crs ||
            "Not Available",


        "Georeferenced":

            result.is_georeferenced
                ? "Yes"
                : "No",


        "Normalization":

            result.normalization_method_name ||

            getMethodName(
                result.normalization_method
            )

    };


    // ========================================================
    // ADD raster_info IF BACKEND SENDS IT
    // ========================================================

    if (
        result.raster_info
        &&
        typeof result.raster_info === "object"
    ) {

        Object.assign(

            rasterInfo,

            result.raster_info

        );

    }


    // ========================================================
    // HTML
    // ========================================================

    let html =

        `<h3>Raster Information</h3>

        <div class="raster-info-grid">`;


    Object.entries(
        rasterInfo
    ).forEach(

        ([key, value]) => {

            html += `

                <div class="info-item">

                    <span class="info-label">
                        ${escapeHTML(key)}
                    </span>

                    <span class="info-value">
                        ${escapeHTML(String(value))}
                    </span>

                </div>

            `;

        }

    );


    html +=
        "</div>";


    rasterInfoContainer.innerHTML =
        html;

}


// ============================================================
// SHOW VALUE GRID
// ============================================================

function showValueGrid(
    valueGrid
) {

    if (!valueGridContainer) {
        return;
    }


    // ========================================================
    // NO GRID
    // ========================================================

    if (

        !Array.isArray(
            valueGrid
        )

        ||

        valueGrid.length === 0

    ) {

        valueGridContainer.innerHTML = `

            <h3>Normalized Value Grid</h3>

            <p class="no-data">

                No value grid available.

            </p>

        `;

        return;

    }


    // ========================================================
    // CREATE TABLE
    // ========================================================

    let html = `

        <h3>
            Normalized Value Grid
        </h3>

        <div class="grid-wrapper">

            <table class="value-grid">

    `;


    // ========================================================
    // HEADER
    // ========================================================

    html += "<thead><tr>";

    html +=
        "<th>Row</th>";


    const firstRow =
        valueGrid[0];


    if (
        Array.isArray(firstRow)
    ) {

        firstRow.forEach(
            (_, index) => {

                html +=
                    `<th>C${index + 1}</th>`;

            }
        );

    }


    html +=
        "</tr></thead>";


    // ========================================================
    // BODY
    // ========================================================

    html +=
        "<tbody>";


    valueGrid.forEach(
        (row, rowIndex) => {

            html +=
                "<tr>";


            html +=
                `<th>R${rowIndex + 1}</th>`;


            if (
                Array.isArray(row)
            ) {

                row.forEach(
                    cell => {

                        let displayValue =
                            "N/A";


                        if (
                            typeof cell === "number"
                        ) {

                            if (
                                Number.isFinite(cell)
                            ) {

                                displayValue =
                                    cell.toFixed(4);

                            }

                        }

                        else if (
                            cell !== null
                            &&
                            cell !== undefined
                        ) {

                            displayValue =
                                cell;

                        }


                        html += `

                            <td>
                                ${escapeHTML(
                                    String(displayValue)
                                )}
                            </td>

                        `;

                    }
                );

            }


            html +=
                "</tr>";

        }
    );


    html += `

            </tbody>

            </table>

        </div>

    `;


    valueGridContainer.innerHTML =
        html;

}


// ============================================================
// SHOW STATISTICS
// ============================================================

function showStatistics(
    statistics
) {

    if (!statisticsContainer) {
        return;
    }


    if (

        !statistics

        ||

        typeof statistics !== "object"

    ) {

        statisticsContainer.innerHTML =

            `<h3>Normalized Value Statistics</h3>

            <p class="no-data">

                No statistics available.

            </p>`;

        return;

    }


    // ========================================================
    // FRIENDLY NAMES
    // ========================================================

    const friendlyNames = {

        minimum:
            "Minimum Value",

        maximum:
            "Maximum Value",

        mean:
            "Mean Value",

        standard_deviation:
            "Standard Deviation",

        valid_pixels:
            "Valid Pixels"

    };


    let html = `

        <h3>
            Normalized Value Information
        </h3>

        <div class="statistics-grid">

    `;


    Object.entries(
        statistics
    ).forEach(

        ([key, value]) => {

            const label =

                friendlyNames[key] ||

                formatLabel(key);


            let displayValue;


            if (
                typeof value === "number"
            ) {

                if (
                    Number.isInteger(value)
                    &&
                    key === "valid_pixels"
                ) {

                    displayValue =
                        value.toLocaleString();

                }

                else {

                    displayValue =
                        value.toFixed(6);

                }

            }

            else {

                displayValue =
                    value;

            }


            html += `

                <div class="stat-card">

                    <span class="stat-label">

                        ${escapeHTML(label)}

                    </span>

                    <strong class="stat-value">

                        ${escapeHTML(
                            String(displayValue)
                        )}

                    </strong>

                </div>

            `;

        }

    );


    html +=
        "</div>";


    statisticsContainer.innerHTML =
        html;

}


// ============================================================
// GET METHOD NAME
// ============================================================

function getMethodName(
    methodKey
) {

    if (!methodKey) {

        return "Unknown";

    }


    const methodNames = {

        "minmax":
            "Min-Max Normalization",

        "min-max":
            "Min-Max Normalization",

        "zscore":
            "Z-Score Normalization",

        "z-score":
            "Z-Score Normalization",

        "decimal_scaling":
            "Decimal Scaling Normalization",

        "decimal-scaling":
            "Decimal Scaling Normalization"

    };


    const key =
        String(
            methodKey
        ).toLowerCase();


    return (

        methodNames[key]

        ||

        methodKey

    );

}


// ============================================================
// FORMAT LABEL
// ============================================================

function formatLabel(
    text
) {

    return String(text)

        .replace(
            /_/g,
            " "
        )

        .replace(
            /\b\w/g,
            character =>
                character.toUpperCase()
        );

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(
    text
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;

}