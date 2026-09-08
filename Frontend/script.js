// ============================================================
// RASTERNORM - FRONTEND JAVASCRIPT
// COMPLETE VERSION
// ============================================================


// ============================================================
// CONFIGURATION
// ============================================================

const API_URL =
    "https://raster-norm-api-q1bl.onrender.com";


const NORMALIZE_URL =
    `${API_URL}/normalize`;


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


const normalizedInfoContainer =
    document.getElementById("normalizedInfo");


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


        console.log(
            "RasterNorm Frontend Loaded Successfully"
        );


        console.log(
            "Backend API:",
            API_URL
        );

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
    // GET FILE
    // ========================================================

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
    // CHECK FILE EXTENSION
    // ========================================================

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


    // ========================================================
    // FILE SIZE CHECK
    // ========================================================

    const fileSizeMB =
        file.size /
        (1024 * 1024);


    console.log(
        "File Size:",
        fileSizeMB.toFixed(2),
        "MB"
    );


    // ========================================================
    // DISABLE BUTTON
    // ========================================================

    normalizeBtn.disabled =
        true;


    normalizeBtn.textContent =
        "Processing Raster...";


    // ========================================================
    // CLEAR OLD RESULTS
    // ========================================================

    removeOldResults();


    // ========================================================
    // HIDE RESULTS
    // ========================================================

    if (previewContainer) {

        previewContainer.style.display =
            "none";

    }


    // ========================================================
    // SHOW STATUS
    // ========================================================

    showStatus(

        "Uploading raster to RasterNorm server...",

        "processing"

    );


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

        method.value

    );


    // ========================================================
    // DEBUG INFORMATION
    // ========================================================

    console.log(
        "================================="
    );


    console.log(
        "RASTERNORM REQUEST"
    );


    console.log(
        "================================="
    );


    console.log(
        "API URL:",
        NORMALIZE_URL
    );


    console.log(
        "File Name:",
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


    // ========================================================
    // REQUEST CONTROLLER
    // ========================================================

    const controller =
        new AbortController();


    const timeoutId =
        setTimeout(

            () => {

                controller.abort();

            },

            120000

        );


    // ========================================================
    // SEND REQUEST
    // ========================================================

    try {


        showStatus(

            "Processing raster... Please wait.",

            "processing"

        );


        const response =
            await fetch(

                NORMALIZE_URL,

                {

                    method: "POST",

                    body: formData,

                    signal:
                        controller.signal

                }

            );


        // ====================================================
        // CLEAR TIMEOUT
        // ====================================================

        clearTimeout(
            timeoutId
        );


        console.log(
            "Response Status:",
            response.status
        );


        console.log(
            "Response OK:",
            response.ok
        );


        // ====================================================
        // GET RESPONSE TEXT
        // ====================================================

        const responseText =
            await response.text();


        console.log(
            "Server Response:",
            responseText
        );


        // ====================================================
        // PARSE JSON
        // ====================================================

        let result;


        try {

            result =
                JSON.parse(
                    responseText
                );

        }


        catch (parseError) {

            console.error(
                "JSON Parse Error:",
                parseError
            );


            throw new Error(

                "Server returned invalid data. " +

                `HTTP Status: ${response.status}`

            );

        }


        // ====================================================
        // HTTP ERROR
        // ====================================================

        if (!response.ok) {

            throw new Error(

                result.error ||

                result.message ||

                `Server Error: HTTP ${response.status}`

            );

        }


        // ====================================================
        // API ERROR
        // ====================================================

        if (!result.success) {

            throw new Error(

                result.error ||

                "Raster normalization failed."

            );

        }


        // ====================================================
        // SUCCESS
        // ====================================================

        console.log(
            "Raster Normalization Successful"
        );


        console.log(
            "Result:",
            result
        );


        // ====================================================
        // DISPLAY RESULTS
        // ====================================================

        displayPreview(
            result
        );


        displayRasterInfo(
            result
        );


        displayNormalizedInfo(
            result
        );


        displayStatistics(
            result.statistics
        );


        displayValueGrid(
            result.value_grid
        );


        displayDownload(
            result
        );


        // ====================================================
        // SHOW RESULTS CONTAINER
        // ====================================================

        if (previewContainer) {

            previewContainer.style.display =
                "block";

        }


        // ====================================================
        // METHOD NAME
        // ====================================================

        const methodName =
            result.normalization_method_name ||

            getMethodName(
                result.normalization_method ||
                method.value
            );


        // ====================================================
        // SUCCESS STATUS
        // ====================================================

        showStatus(

            `Normalization completed successfully using ${methodName}!`,

            "success"

        );


        // ====================================================
        // SCROLL TO RESULTS
        // ====================================================

        setTimeout(

            () => {

                if (previewContainer) {

                    previewContainer.scrollIntoView(

                        {

                            behavior:
                                "smooth",

                            block:
                                "start"

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


        console.error(
            "================================="
        );


        console.error(
            "RASTERNORM ERROR"
        );


        console.error(
            "================================="
        );


        console.error(
            error
        );


        let errorMessage =
            error.message ||
            "Unknown error occurred.";


        // ====================================================
        // REQUEST TIMEOUT
        // ====================================================

        if (
            error.name ===
            "AbortError"
        ) {

            errorMessage =

                "Request timed out. " +

                "The server may be processing a large raster or waking up. " +

                "Please wait and try again.";

        }


        // ====================================================
        // CONNECTION / CORS ERROR
        // ====================================================

        else if (

            error.name === "TypeError"

            ||

            errorMessage
                .toLowerCase()
                .includes("failed to fetch")

        ) {

            errorMessage =

                "Connection blocked or backend unavailable. " +

                "This may be caused by CORS configuration or the Render server being offline.";

        }


        // ====================================================
        // DISPLAY ERROR
        // ====================================================

        showStatus(

            `Error: ${errorMessage}`,

            "error"

        );

    }


    // ========================================================
    // FINALLY
    // ========================================================

    finally {


        clearTimeout(
            timeoutId
        );


        normalizeBtn.disabled =
            false;


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


    // ========================================================
    // IMAGE
    // ========================================================

    if (normalizedPreview) {

        normalizedPreview.src =
            "";

    }


    // ========================================================
    // DOWNLOAD
    // ========================================================

    if (downloadBtn) {

        downloadBtn.removeAttribute(
            "href"
        );


        downloadBtn.style.display =
            "none";

    }


    // ========================================================
    // RASTER INFORMATION
    // ========================================================

    if (rasterInfoContainer) {

        rasterInfoContainer.innerHTML =
            "";

    }


    // ========================================================
    // NORMALIZED INFORMATION
    // ========================================================

    if (normalizedInfoContainer) {

        normalizedInfoContainer.innerHTML =
            "";

    }


    // ========================================================
    // VALUE GRID
    // ========================================================

    if (valueGridContainer) {

        valueGridContainer.innerHTML =
            "";

    }


    // ========================================================
    // STATISTICS
    // ========================================================

    if (statisticsContainer) {

        statisticsContainer.innerHTML =
            "";

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


    // ========================================================
    // NO IMAGE
    // ========================================================

    if (!imageData) {

        console.warn(
            "No preview image returned."
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


    normalizedPreview.onload =
        () => {

            console.log(
                "Preview image loaded successfully."
            );

        };


    normalizedPreview.onerror =
        () => {

            console.error(
                "Preview image failed to load."
            );

        };

}


// ============================================================
// DISPLAY RASTER INFORMATION
// ============================================================

function displayRasterInfo(result) {


    if (!rasterInfoContainer) {

        return;

    }


    const fileName =

        result.filename ||

        "Unknown";


    const fileType =

        result.file_type ||

        "Unknown";


    const width =

        result.width ??

        "Unknown";


    const height =

        result.height ??

        "Unknown";


    const crs =

        result.crs ||

        "Not Available";


    const georeferenced =

        result.is_georeferenced

            ? "Yes"

            : "No";


    const totalPixels =

        (

            typeof result.width === "number"

            &&

            typeof result.height === "number"

        )

            ?

            (
                result.width *
                result.height
            ).toLocaleString()

            :

            "Unknown";


    rasterInfoContainer.innerHTML = `

        <h3>

            Raster Information

        </h3>


        <div class="info-grid">


            <div class="info-item">

                <strong>
                    File Name
                </strong>

                <span>
                    ${escapeHTML(fileName)}
                </span>

            </div>


            <div class="info-item">

                <strong>
                    File Type
                </strong>

                <span>
                    ${escapeHTML(fileType)}
                </span>

            </div>


            <div class="info-item">

                <strong>
                    Width
                </strong>

                <span>
                    ${width} pixels
                </span>

            </div>


            <div class="info-item">

                <strong>
                    Height
                </strong>

                <span>
                    ${height} pixels
                </span>

            </div>


            <div class="info-item">

                <strong>
                    Total Pixels
                </strong>

                <span>
                    ${totalPixels}
                </span>

            </div>


            <div class="info-item">

                <strong>
                    Georeferenced
                </strong>

                <span>
                    ${georeferenced}
                </span>

            </div>


            <div class="info-item">

                <strong>
                    CRS
                </strong>

                <span>
                    ${escapeHTML(crs)}
                </span>

            </div>


        </div>

    `;

}


// ============================================================
// DISPLAY NORMALIZED VALUE INFORMATION
// ============================================================

function displayNormalizedInfo(result) {


    if (!normalizedInfoContainer) {

        return;

    }


    const methodKey =

        result.normalization_method ||

        method.value;


    const methodName =

        result.normalization_method_name ||

        getMethodName(
            methodKey
        );


    let valueRange =
        "Calculated from valid raster pixels";


    // ========================================================
    // MIN MAX
    // ========================================================

    if (
        methodKey === "minmax"
    ) {

        valueRange =
            "0.000000 to 1.000000";

    }


    // ========================================================
    // Z SCORE
    // ========================================================

    else if (
        methodKey === "zscore"
    ) {

        valueRange =
            "Mean = 0 and Standard Deviation = 1";

    }


    // ========================================================
    // DECIMAL SCALING
    // ========================================================

    else if (
        methodKey === "decimal_scaling"
    ) {

        valueRange =
            "Values scaled using powers of 10";

    }


    normalizedInfoContainer.innerHTML = `

        <h3>

            Normalized Value Information

        </h3>


        <div class="info-grid">


            <div class="info-item">

                <strong>
                    Normalization Method
                </strong>

                <span>
                    ${escapeHTML(methodName)}
                </span>

            </div>


            <div class="info-item">

                <strong>
                    Method Key
                </strong>

                <span>
                    ${escapeHTML(methodKey)}
                </span>

            </div>


            <div class="info-item">

                <strong>
                    Expected Value Range
                </strong>

                <span>
                    ${escapeHTML(valueRange)}
                </span>

            </div>


            <div class="info-item">

                <strong>
                    Output Data Type
                </strong>

                <span>
                    Float32
                </span>

            </div>


        </div>

    `;

}


// ============================================================
// DISPLAY STATISTICS
// ============================================================

function displayStatistics(statistics) {


    if (

        !statisticsContainer

        ||

        !statistics

    ) {

        return;

    }


    const minimum =

        statistics.minimum ??
        statistics.min ??
        "N/A";


    const maximum =

        statistics.maximum ??
        statistics.max ??
        "N/A";


    const mean =

        statistics.mean ??
        "N/A";


    const standardDeviation =

        statistics.standard_deviation ??
        statistics.std ??
        "N/A";


    const validPixels =

        statistics.valid_pixels ??
        "N/A";


    statisticsContainer.innerHTML = `

        <h3>

            Normalized Raster Statistics

        </h3>


        <div class="info-grid">


            <div class="info-item">

                <strong>
                    Minimum
                </strong>

                <span>

                    ${formatNumber(minimum)}

                </span>

            </div>


            <div class="info-item">

                <strong>
                    Maximum
                </strong>

                <span>

                    ${formatNumber(maximum)}

                </span>

            </div>


            <div class="info-item">

                <strong>
                    Mean
                </strong>

                <span>

                    ${formatNumber(mean)}

                </span>

            </div>


            <div class="info-item">

                <strong>
                    Standard Deviation
                </strong>

                <span>

                    ${formatNumber(standardDeviation)}

                </span>

            </div>


            <div class="info-item">

                <strong>
                    Valid Pixels
                </strong>

                <span>

                    ${formatInteger(validPixels)}

                </span>

            </div>


        </div>

    `;

}


// ============================================================
// DISPLAY VALUE GRID
// ============================================================

function displayValueGrid(valueGrid) {


    if (!valueGridContainer) {

        return;

    }


    // ========================================================
    // CHECK GRID
    // ========================================================

    if (

        !Array.isArray(valueGrid)

        ||

        valueGrid.length === 0

    ) {

        valueGridContainer.innerHTML = `

            <h3>

                Normalized Spatial Grid

            </h3>


            <p>

                No grid values available.

            </p>

        `;

        return;

    }


    // ========================================================
    // CREATE TABLE
    // ========================================================

    let html = `

        <h3>

            Normalized Spatial Grid

        </h3>


        <p>

            Sampled normalized raster values

        </p>


        <div class="grid-wrapper">

        <table class="value-grid">

    `;


    // ========================================================
    // HEADER
    // ========================================================

    html +=
        "<thead><tr>";


    html +=
        "<th>Row</th>";


    const columnCount =
        valueGrid[0].length;


    for (

        let column = 0;

        column < columnCount;

        column++

    ) {

        html +=

            `<th>

                C${column + 1}

            </th>`;

    }


    html +=
        "</tr></thead>";


    // ========================================================
    // BODY
    // ========================================================

    html +=
        "<tbody>";


    valueGrid.forEach(

        (
            row,
            rowIndex
        ) => {


            html +=
                "<tr>";


            html +=

                `<th>

                    R${rowIndex + 1}

                </th>`;


            row.forEach(
                cell => {


                    let displayValue;


                    if (

                        typeof cell === "number"

                        &&

                        Number.isFinite(cell)

                    ) {

                        displayValue =
                            cell.toFixed(4);

                    }


                    else {

                        displayValue =
                            "N/A";

                    }


                    html +=

                        `<td>

                            ${displayValue}

                        </td>`;

                }
            );


            html +=
                "</tr>";

        }

    );


    html +=

        "</tbody>" +

        "</table>" +

        "</div>";


    valueGridContainer.innerHTML =
        html;

}


// ============================================================
// DISPLAY DOWNLOAD
// ============================================================

function displayDownload(result) {


    if (

        !downloadBtn

        ||

        !result.download_url

    ) {

        return;

    }


    let downloadURL =
        result.download_url;


    // ========================================================
    // ADD BACKEND URL
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


    console.log(
        "Download URL:",
        downloadURL
    );

}


// ============================================================
// FORMAT NUMBER
// ============================================================

function formatNumber(value) {


    if (

        value === "N/A"

        ||

        value === null

        ||

        value === undefined

    ) {

        return "N/A";

    }


    const number =
        Number(value);


    if (
        !Number.isFinite(number)
    ) {

        return "N/A";

    }


    return number.toFixed(6);

}


// ============================================================
// FORMAT INTEGER
// ============================================================

function formatInteger(value) {


    if (

        value === "N/A"

        ||

        value === null

        ||

        value === undefined

    ) {

        return "N/A";

    }


    const number =
        Number(value);


    if (
        !Number.isFinite(number)
    ) {

        return "N/A";

    }


    return Math.round(
        number
    ).toLocaleString();

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {


    if (

        value === null

        ||

        value === undefined

    ) {

        return "N/A";

    }


    const text =
        String(value);


    return text

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================================================
// GET METHOD NAME
// ============================================================

function getMethodName(methodKey) {


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