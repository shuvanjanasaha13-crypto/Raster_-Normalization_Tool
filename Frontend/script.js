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

normalizeBtn.addEventListener("click", async () => {

    const file = rasterFile.files[0];


    // --------------------------------------------------------
    // CHECK FILE
    // --------------------------------------------------------

    if (!file) {

        showStatus(
            "Please upload a TIFF, PNG, JPG or JPEG file.",
            "error"
        );

        return;
    }


    // --------------------------------------------------------
    // CHECK FILE TYPE
    // --------------------------------------------------------

    const fileName = file.name.toLowerCase();

    const isValidFile =
        ALLOWED_EXTENSIONS.some(extension =>
            fileName.endsWith(extension)
        );


    if (!isValidFile) {

        showStatus(
            "Unsupported file type. Please upload TIFF, PNG, JPG or JPEG.",
            "error"
        );

        return;
    }


    // --------------------------------------------------------
    // START PROCESSING
    // --------------------------------------------------------

    normalizeBtn.disabled = true;

    normalizeBtn.textContent = "Processing...";

    showStatus(
        "Processing raster... Please wait.",
        "processing"
    );


    // Hide previous results

    previewContainer.style.display = "none";

    downloadBtn.style.display = "none";

    removeOldResults();


    // --------------------------------------------------------
    // CREATE FORM DATA
    // --------------------------------------------------------

    const formData = new FormData();

    formData.append("file", file);

    formData.append("method", method.value);


    // --------------------------------------------------------
    // SEND REQUEST
    // --------------------------------------------------------

    try {

        const response = await fetch(
            `${API_URL}/normalize`,
            {
                method: "POST",
                body: formData
            }
        );


        // ----------------------------------------------------
        // READ RESPONSE
        // ----------------------------------------------------

        let result;

        try {

            result = await response.json();

        } catch {

            throw new Error(
                "Invalid response received from the server."
            );

        }


        // ----------------------------------------------------
        // HANDLE SERVER ERROR
        // ----------------------------------------------------

        if (!response.ok) {

            throw new Error(
                result.error ||
                `Server error (${response.status})`
            );

        }


        // ----------------------------------------------------
        // HANDLE FAILED PROCESS
        // ----------------------------------------------------

        if (!result.success) {

            throw new Error(
                result.error ||
                "Raster normalization failed."
            );

        }


        // ====================================================
        // SHOW NORMALIZED PREVIEW
        // ====================================================

        displayPreview(result);


        // ====================================================
        // SHOW DOWNLOAD BUTTON
        // ====================================================

        displayDownload(result);


        // ====================================================
        // SHOW RASTER INFORMATION
        // ====================================================

        showRasterInfo(result);


        // ====================================================
        // SHOW VALUE GRID
        // ====================================================

        if (
            Array.isArray(result.value_grid) &&
            result.value_grid.length > 0
        ) {

            showValueGrid(result.value_grid);

        }


        // ====================================================
        // SHOW STATISTICS
        // ====================================================

        if (result.statistics) {

            showStatistics(result.statistics);

        }


        // ====================================================
        // SHOW RESULTS
        // ====================================================

        previewContainer.style.display = "block";


        // ====================================================
        // SUCCESS MESSAGE
        // ====================================================

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


    // ========================================================
    // ERROR HANDLING
    // ========================================================

    catch (error) {

        let errorMessage = error.message;


        if (
            error.message === "Failed to fetch"
        ) {

            errorMessage =
                "Cannot connect to the RasterNorm server. " +
                "The server may be starting. Please wait a moment and try again.";

        }


        showStatus(
            `Error: ${errorMessage}`,
            "error"
        );

    }


    // ========================================================
    // FINISH
    // ========================================================

    finally {

        normalizeBtn.disabled = false;

        normalizeBtn.textContent =
            "Normalize Raster";

    }

});


// ============================================================
// DISPLAY PREVIEW
// ============================================================

function displayPreview(result) {

    const imageData =
        result.normalized_spatial_map ||
        result.preview;


    if (!imageData) {
        return;
    }


    // Base64 image

    if (
        !imageData.startsWith("http") &&
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

    if (!result.download_url) {
        return;
    }


    let downloadURL =
        result.download_url;


    // Add backend URL if necessary

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

function getMethodName(methodValue) {

    const methods = {

        minmax:
            "Min-Max Normalization",

        zscore:
            "Z-Score Normalization"

    };


    return methods[methodValue] ||
        methodValue ||
        "Unknown";

}


// ============================================================
// SHOW STATUS
// ============================================================

function showStatus(message, type = "") {

    status.textContent =
        message;


    status.className =
        type;

}


// ============================================================
// REMOVE OLD RESULTS
// ============================================================

function removeOldResults() {

    const resultElements = [

        "dynamicRasterInfo",

        "dynamicValueGrid",

        "dynamicStatistics"

    ];


    resultElements.forEach(id => {

        const element =
            document.getElementById(id);


        if (element) {

            element.remove();

        }

    });

}


// ============================================================
// SHOW RASTER INFORMATION
// ============================================================

function showRasterInfo(result) {

    const section =
        document.createElement("div");


    section.id =
        "dynamicRasterInfo";


    section.className =
        "result-section";


    // Title

    const title =
        document.createElement("h3");


    title.textContent =
        "Raster Information";


    section.appendChild(title);


    // Information Grid

    const infoGrid =
        document.createElement("div");


    infoGrid.className =
        "info-grid";


    const information = [

        {
            label: "File Type",
            value: result.file_type || "-"
        },

        {
            label: "Width",
            value: result.width || "-"
        },

        {
            label: "Height",
            value: result.height || "-"
        },

        {
            label: "Georeferenced",
            value:
                result.is_georeferenced
                    ? "Yes"
                    : "No"
        },

        {
            label: "CRS",
            value:
                result.crs ||
                "Not Available"
        }

    ];


    information.forEach(item => {

        const card =
            document.createElement("div");


        card.className =
            "info-card";


        const label =
            document.createElement("strong");


        label.textContent =
            item.label;


        const value =
            document.createElement("span");


        value.textContent =
            item.value;


        card.appendChild(label);

        card.appendChild(value);

        infoGrid.appendChild(card);

    });


    section.appendChild(infoGrid);

    previewContainer.appendChild(section);

}


// ============================================================
// SHOW NORMALIZED VALUE GRID
// ============================================================

function showValueGrid(data) {

    const section =
        document.createElement("div");


    section.id =
        "dynamicValueGrid";


    section.className =
        "grid-section";


    // Title

    const title =
        document.createElement("h3");


    title.textContent =
        "Normalized Value Grid";


    section.appendChild(title);


    // Grid Information

    const rows =
        data.length;


    const columns =
        rows > 0 && Array.isArray(data[0])
            ? data[0].length
            : 0;


    const info =
        document.createElement("p");


    info.textContent =
        `Sample Grid: ${rows} Rows × ${columns} Columns`;


    section.appendChild(info);


    // Table Wrapper

    const wrapper =
        document.createElement("div");


    wrapper.className =
        "table-wrapper";


    const table =
        document.createElement("table");


    table.className =
        "value-grid-table";


    // ========================================================
    // TABLE HEADER
    // ========================================================

    const headerRow =
        document.createElement("tr");


    const corner =
        document.createElement("th");


    corner.textContent =
        "Row / Col";


    headerRow.appendChild(corner);


    for (
        let column = 0;
        column < columns;
        column++
    ) {

        const header =
            document.createElement("th");


        header.textContent =
            column + 1;


        headerRow.appendChild(header);

    }


    table.appendChild(headerRow);


    // ========================================================
    // TABLE DATA
    // ========================================================

    data.forEach((row, rowIndex) => {

        const tableRow =
            document.createElement("tr");


        // Row Header

        const rowHeader =
            document.createElement("th");


        rowHeader.textContent =
            rowIndex + 1;


        tableRow.appendChild(rowHeader);


        // Values

        row.forEach(value => {

            const cell =
                document.createElement("td");


            const number =
                Number(value);


            cell.textContent =
                Number.isFinite(number)
                    ? number.toFixed(4)
                    : "-";


            tableRow.appendChild(cell);

        });


        table.appendChild(tableRow);

    });


    wrapper.appendChild(table);

    section.appendChild(wrapper);

    previewContainer.appendChild(section);

}


// ============================================================
// SHOW NORMALIZATION STATISTICS
// ============================================================

function showStatistics(statistics) {

    const section =
        document.createElement("div");


    section.id =
        "dynamicStatistics";


    section.className =
        "statistics-section";


    // Title

    const title =
        document.createElement("h3");


    title.textContent =
        "Normalization Statistics";


    section.appendChild(title);


    // Statistics Grid

    const statisticsGrid =
        document.createElement("div");


    statisticsGrid.className =
        "statistics-grid";


    // Cards

    addStatisticCard(
        statisticsGrid,
        "Minimum",
        statistics.minimum
    );


    addStatisticCard(
        statisticsGrid,
        "Maximum",
        statistics.maximum
    );


    addStatisticCard(
        statisticsGrid,
        "Mean",
        statistics.mean
    );


    addStatisticCard(
        statisticsGrid,
        "Standard Deviation",
        statistics.standard_deviation
    );


    section.appendChild(
        statisticsGrid
    );


    previewContainer.appendChild(
        section
    );

}


// ============================================================
// CREATE STATISTIC CARD
// ============================================================

function addStatisticCard(
    container,
    label,
    value
) {

    const card =
        document.createElement("div");


    card.className =
        "stat-card";


    const labelElement =
        document.createElement("strong");


    labelElement.textContent =
        label;


    const valueElement =
        document.createElement("span");


    const number =
        Number(value);


    valueElement.textContent =
        Number.isFinite(number)
            ? number.toFixed(4)
            : "-";


    card.appendChild(labelElement);

    card.appendChild(valueElement);

    container.appendChild(card);

}


// ============================================================
// FILE SELECTION
// ============================================================

rasterFile.addEventListener(
    "change",
    () => {

        const selectedFile =
            rasterFile.files[0];


        if (!selectedFile) {

            showStatus(
                "No file selected."
            );

            return;

        }


        showStatus(
            `Selected file: ${selectedFile.name}`,
            "selected"
        );

    }
);