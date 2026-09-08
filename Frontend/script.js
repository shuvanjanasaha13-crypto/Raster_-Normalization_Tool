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


const rasterInfoContainer =
    document.getElementById("rasterInfo");


const valueGridContainer =
    document.getElementById("valueGrid");


const statisticsContainer =
    document.getElementById("statistics");


// ============================================================
// NEW: NORMALIZED INFORMATION CONTAINER
// ============================================================

const normalizedInfoContainer =
    document.getElementById("normalizedInfo");


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


        if (rasterInfoContainer) {

            rasterInfoContainer.innerHTML =
                "";

        }


        if (valueGridContainer) {

            valueGridContainer.innerHTML =
                "";

        }


        if (statisticsContainer) {

            statisticsContainer.innerHTML =
                "";

        }


        if (normalizedInfoContainer) {

            normalizedInfoContainer.innerHTML =
                "";

        }

    }
);


// ============================================================
// NORMALIZE RASTER
// ============================================================

if (normalizeBtn) {

    normalizeBtn.addEventListener(

        "click",

        async () => {


            const file =
                rasterFile.files[0];


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
                        fileName.endsWith(
                            extension
                        )

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

            normalizeBtn.disabled =
                true;


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
                // GET RESPONSE TEXT
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
                // SHOW NORMALIZED INFORMATION
                // =============================================

                if (result.normalized_info) {

                    showNormalizedInfo(

                        result.normalized_info

                    );

                }


                // =============================================
                // SHOW VALUE GRID
                // =============================================

                if (

                    result.value_grid

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

                    errorMessage
                        .toLowerCase()
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


    if (normalizedPreview) {

        normalizedPreview.src =
            "";

    }


    if (downloadBtn) {

        downloadBtn.removeAttribute(
            "href"
        );

    }


    if (rasterInfoContainer) {

        rasterInfoContainer.innerHTML =
            "";

    }


    if (valueGridContainer) {

        valueGridContainer.innerHTML =
            "";

    }


    if (statisticsContainer) {

        statisticsContainer.innerHTML =
            "";

    }


    if (normalizedInfoContainer) {

        normalizedInfoContainer.innerHTML =
            "";

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

        return;

    }


    // Base64 Image

    if (

        !imageData.startsWith(
            "http"
        )

        &&

        !imageData.startsWith(
            "data:image"
        )

    ) {

        normalizedPreview.src =

            `data:image/png;base64,${imageData}`;

    }


    // Complete URL

    else if (

        imageData.startsWith(
            "http"
        )

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

function displayDownload(
    result
) {

    if (

        !downloadBtn

        ||

        !result.download_url

    ) {

        return;

    }


    let downloadURL =
        result.download_url;


    // Add Backend URL

    if (

        !downloadURL.startsWith(
            "http"
        )

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


    const info =
        result.raster_info;


    if (

        !info

        ||

        typeof info !== "object"

    ) {

        // --------------------------------------------
        // FALLBACK FOR OLD BACKEND
        // --------------------------------------------

        let fallbackHTML =

            "<h3>Raster Information</h3>";

        fallbackHTML +=
            "<div class='info-grid'>";


        if (result.filename) {

            fallbackHTML +=

                `<div class="info-item">
                    <strong>Filename</strong>
                    <span>${result.filename}</span>
                </div>`;

        }


        if (result.file_type) {

            fallbackHTML +=

                `<div class="info-item">
                    <strong>File Type</strong>
                    <span>${result.file_type}</span>
                </div>`;

        }


        if (result.width) {

            fallbackHTML +=

                `<div class="info-item">
                    <strong>Width</strong>
                    <span>${result.width}</span>
                </div>`;

        }


        if (result.height) {

            fallbackHTML +=

                `<div class="info-item">
                    <strong>Height</strong>
                    <span>${result.height}</span>
                </div>`;

        }


        if (result.crs) {

            fallbackHTML +=

                `<div class="info-item">
                    <strong>CRS</strong>
                    <span>${result.crs}</span>
                </div>`;

        }


        fallbackHTML +=
            "</div>";


        rasterInfoContainer.innerHTML =
            fallbackHTML;


        return;

    }


    let html =

        "<h3>Raster Information</h3>";


    html +=
        "<div class='info-grid'>";


    for (

        const [key, value]

        of

        Object.entries(info)

    ) {


        // Skip Bounds here

        if (

            key === "bounds"

        ) {

            continue;

        }


        const displayKey =

            key

                .replace(
                    /_/g,
                    " "
                )

                .replace(

                    /\b\w/g,

                    character =>
                        character.toUpperCase()

                );


        let displayValue =
            value;


        if (

            value === null

            ||

            value === undefined

        ) {

            displayValue =
                "Not Available";

        }


        html +=

            `<div class="info-item">

                <strong>${displayKey}</strong>

                <span>${displayValue}</span>

            </div>`;

    }


    html +=
        "</div>";


    // ========================================================
    // DISPLAY BOUNDS
    // ========================================================

    if (

        info.bounds

        &&

        typeof info.bounds === "object"

    ) {


        html +=

            "<h4>Spatial Bounds</h4>";


        html +=
            "<div class='info-grid'>";


        for (

            const [key, value]

            of

            Object.entries(
                info.bounds
            )

        ) {


            html +=

                `<div class="info-item">

                    <strong>${key}</strong>

                    <span>${Number(value).toFixed(4)}</span>

                </div>`;

        }


        html +=
            "</div>";

    }


    rasterInfoContainer.innerHTML =
        html;

}


// ============================================================
// SHOW NORMALIZED INFORMATION
// ============================================================

function showNormalizedInfo(
    normalizedInfo
) {

    if (!normalizedInfoContainer) {

        return;

    }


    let html =

        "<h3>Normalized Value Information</h3>";


    html +=

        "<div class='info-grid'>";


    for (

        const [key, value]

        of

        Object.entries(
            normalizedInfo
        )

    ) {


        const displayKey =

            key

                .replace(
                    /_/g,
                    " "
                )

                .replace(

                    /\b\w/g,

                    character =>
                        character.toUpperCase()

                );


        let displayValue =
            value;


        if (

            typeof value === "number"

        ) {


            // Pixel counts

            if (

                key.includes(
                    "pixels"
                )

            ) {

                displayValue =
                    value.toLocaleString();

            }


            // Normalized values

            else {

                displayValue =
                    value.toFixed(
                        6
                    );

            }

        }


        html +=

            `<div class="info-item">

                <strong>${displayKey}</strong>

                <span>${displayValue}</span>

            </div>`;

    }


    html +=
        "</div>";


    normalizedInfoContainer.innerHTML =
        html;

}


// ============================================================
// SHOW VALUE GRID
// SUPPORTS BOTH:
// OLD FORMAT: [[0.1, 0.2], [0.3, 0.4]]
// NEW FORMAT: {
//     row_indices: [],
//     column_indices: [],
//     values: []
// }
// ============================================================

function showValueGrid(
    valueGrid
) {

    if (!valueGridContainer) {

        return;

    }


    let gridValues =
        valueGrid;


    let rowIndices =
        null;


    let columnIndices =
        null;


    // ========================================================
    // NEW BACKEND FORMAT
    // ========================================================

    if (

        typeof valueGrid === "object"

        &&

        !Array.isArray(
            valueGrid
        )

        &&

        valueGrid.values

    ) {


        gridValues =
            valueGrid.values;


        rowIndices =
            valueGrid.row_indices;


        columnIndices =
            valueGrid.column_indices;

    }


    // ========================================================
    // VALIDATE GRID
    // ========================================================

    if (

        !Array.isArray(
            gridValues
        )

        ||

        gridValues.length === 0

    ) {

        return;

    }


    let html =

        "<h3>Normalized Spatial Grid</h3>";


    html +=

        "<div class='grid-wrapper'>";


    html +=

        '<table class="value-grid">';


    // ========================================================
    // COLUMN HEADERS
    // ========================================================

    if (

        Array.isArray(
            columnIndices
        )

    ) {


        html +=
            "<thead><tr>";


        html +=
            "<th>Row / Col</th>";


        columnIndices.forEach(

            column => {


                html +=

                    `<th>${column}</th>`;

            }

        );


        html +=
            "</tr></thead>";

    }


    // ========================================================
    // GRID VALUES
    // ========================================================

    html +=
        "<tbody>";


    gridValues.forEach(

        (

            row,

            rowIndex

        ) => {


            html +=
                "<tr>";


            // Row Header

            if (

                Array.isArray(
                    rowIndices
                )

            ) {


                html +=

                    `<th>${rowIndices[rowIndex]}</th>`;

            }


            // Values

            row.forEach(

                cell => {


                    let displayValue =
                        "NoData";


                    if (

                        typeof cell ===
                        "number"

                    ) {


                        displayValue =

                            cell.toFixed(
                                4
                            );

                    }


                    html +=

                        `<td>${displayValue}</td>`;

                }

            );


            html +=
                "</tr>";

        }

    );


    html +=
        "</tbody>";


    html +=
        "</table>";


    html +=
        "</div>";


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


    let html =

        "<h3>Statistics</h3>";


    html +=
        "<div class='info-grid'>";


    for (

        const [key, value]

        of

        Object.entries(
            statistics
        )

    ) {


        const displayKey =

            key

                .replace(
                    /_/g,
                    " "
                )

                .replace(

                    /\b\w/g,

                    character =>
                        character.toUpperCase()

                );


        let displayValue =
            value;


        if (

            typeof value === "number"

        ) {


            if (

                key.includes(
                    "pixels"
                )

            ) {

                displayValue =
                    value.toLocaleString();

            }


            else {

                displayValue =
                    value.toFixed(
                        6
                    );

            }

        }


        html +=

            `<div class="info-item">

                <strong>${displayKey}</strong>

                <span>${displayValue}</span>

            </div>`;

    }


    html +=
        "</div>";


    statisticsContainer.innerHTML =
        html;

}


// ============================================================
// GET NORMALIZATION METHOD NAME
// ============================================================

function getMethodName(
    methodKey
) {

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


    if (!methodKey) {

        return "Unknown";

    }


    const key =
        methodKey.toLowerCase();


    return (

        methodNames[key]

        ||

        methodKey

    );

}