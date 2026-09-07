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
// BACKEND
// ============================================================

const API_URL =
"https://raster-norm-api-q1bl.onrender.com";

// ============================================================
// INITIAL SETTINGS
// ============================================================

previewContainer.style.display = "none";
downloadBtn.style.display = "none";

// ============================================================
// NORMALIZE
// ============================================================

normalizeBtn.addEventListener("click", async () => {

```
const file = rasterFile.files[0];


// --------------------------------------------------------
// CHECK FILE
// --------------------------------------------------------

if (!file) {

    status.innerText =
        "Please upload a TIFF, PNG or JPG file first.";

    return;
}


// --------------------------------------------------------
// CHECK FILE TYPE
// --------------------------------------------------------

const allowedTypes = [
    ".tif",
    ".tiff",
    ".png",
    ".jpg",
    ".jpeg"
];


const fileName =
    file.name.toLowerCase();


const validFile =
    allowedTypes.some(
        extension =>
            fileName.endsWith(extension)
    );


if (!validFile) {

    status.innerText =
        "Unsupported file type.";

    return;
}


// --------------------------------------------------------
// PROCESSING
// --------------------------------------------------------

status.innerText =
    "Processing raster... Please wait.";

normalizeBtn.disabled = true;

previewContainer.style.display = "none";
downloadBtn.style.display = "none";


// --------------------------------------------------------
// FORM DATA
// --------------------------------------------------------

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


// --------------------------------------------------------
// SEND TO BACKEND
// --------------------------------------------------------

try {

    const response =
        await fetch(
            API_URL + "/normalize",
            {
                method: "POST",
                body: formData
            }
        );


    // ----------------------------------------------------
    // SERVER ERROR
    // ----------------------------------------------------

    if (!response.ok) {

        let message =
            "Server error: " + response.status;


        try {

            const errorData =
                await response.json();


            if (errorData.error) {

                message =
                    errorData.error;
            }

        } catch (e) {
            // Nothing
        }


        throw new Error(message);
    }


    // ----------------------------------------------------
    // JSON
    // ----------------------------------------------------

    const result =
        await response.json();


    console.log(
        "Backend result:",
        result
    );


    if (!result.success) {

        throw new Error(
            result.error ||
            "Normalization failed."
        );
    }


    // ====================================================
    // MAP PREVIEW
    // ====================================================

    if (result.normalized_spatial_map) {

        normalizedPreview.src =
            "data:image/png;base64," +
            result.normalized_spatial_map;

        previewContainer.style.display =
            "block";

    }

    else if (result.preview) {

        normalizedPreview.src =
            "data:image/png;base64," +
            result.preview;

        previewContainer.style.display =
            "block";
    }


    // ====================================================
    // DOWNLOAD
    // ====================================================

    if (result.download_url) {

        downloadBtn.href =
            API_URL +
            result.download_url;

        downloadBtn.download =
            "normalized_raster.tif";

        downloadBtn.style.display =
            "inline-block";
    }


    // ====================================================
    // STATUS
    // ====================================================

    status.innerText =
        "Normalization completed successfully!";


    if (result.normalization_method) {

        status.innerText +=
            " Method: " +
            result.normalization_method;
    }


    // ====================================================
    // VALUE GRID
    // ====================================================

    if (
        result.value_grid &&
        Array.isArray(result.value_grid)
    ) {

        showValueGrid(
            result.value_grid
        );

    }


    // ====================================================
    // STATISTICS
    // ====================================================

    if (result.statistics) {

        console.log(
            "Statistics:",
            result.statistics
        );
    }

}


// ========================================================
// ERROR
// ========================================================

catch (error) {

    console.error(
        "RasterNorm Error:",
        error
    );

    status.innerText =
        "Error: " +
        error.message;
}


// ========================================================
// FINISH
// ========================================================

finally {

    normalizeBtn.disabled =
        false;
}
```

});

// ============================================================
// SHOW VALUE GRID
// ============================================================

function showValueGrid(data) {

```
// Find existing preview container
const container =
    document.getElementById(
        "previewContainer"
    );


// Remove old grid
const oldGrid =
    document.getElementById(
        "dynamicValueGrid"
    );


if (oldGrid) {

    oldGrid.remove();
}


// Create section
const section =
    document.createElement("div");


section.id =
    "dynamicValueGrid";


section.style.marginTop =
    "30px";


// Title
const title =
    document.createElement("h3");


title.innerText =
    "Normalized Value Grid";


section.appendChild(
    title
);


// Dimensions
const info =
    document.createElement("p");


const rows =
    data.length;


const columns =
    data.length > 0
        ? data[0].length
        : 0;


info.innerText =
    "Rows: " +
    rows +
    " | Columns: " +
    columns;


section.appendChild(
    info
);


// Scroll wrapper
const wrapper =
    document.createElement("div");


wrapper.style.overflow =
    "auto";


wrapper.style.maxHeight =
    "500px";


// Table
const table =
    document.createElement("table");


table.style.borderCollapse =
    "collapse";


table.style.width =
    "100%";


// Rows
data.forEach(
    (row, rowIndex) => {

        const tr =
            document.createElement("tr");


        // Row number
        const rowHeader =
            document.createElement("th");


        rowHeader.innerText =
            rowIndex + 1;


        rowHeader.style.border =
            "1px solid #ccc";


        rowHeader.style.padding =
            "6px";


        tr.appendChild(
            rowHeader
        );


        // Values
        row.forEach(
            value => {

                const td =
                    document.createElement("td");


                if (
                    typeof value === "number"
                ) {

                    td.innerText =
                        value.toFixed(4);

                } else {

                    td.innerText =
                        value;
                }


                td.style.border =
                    "1px solid #ccc";


                td.style.padding =
                    "6px";


                td.style.textAlign =
                    "center";


                tr.appendChild(
                    td
                );
            }
        );


        table.appendChild(
            tr
        );
    }
);


wrapper.appendChild(
    table
);


section.appendChild(
    wrapper
);


container.appendChild(
    section
);
```

}
