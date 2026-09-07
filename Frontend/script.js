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


previewContainer.style.display = "none";


normalizeBtn.addEventListener(
    "click",
    async () => {

        const file = rasterFile.files[0];


        if (!file) {

            status.innerText =
                "Please upload a raster file first.";

            return;

        }


        status.innerText =
            "Processing raster... Please wait.";

        normalizeBtn.disabled = true;


        const formData = new FormData();

        formData.append(
            "file",
            file
        );

        formData.append(
            "method",
            method.value
        );


        try {

            const response = await fetch(

                "https://raster-norm-api-q1bl.onrender.com/normalize",

                {
                    method: "POST",
                    body: formData
                }

            );


            if (!response.ok) {

                throw new Error(
                    "Server error"
                );

            }


            const result =
                await response.json();


            if (result.error) {

                throw new Error(
                    result.error
                );

            }


            /* SHOW PREVIEW */

            normalizedPreview.src =
                "data:image/png;base64," +
                result.preview;


            previewContainer.style.display =
                "block";


            /* DOWNLOAD TIFF */

            downloadBtn.href =
                "https://raster-norm-api-q1bl.onrender.com" +
                result.download_url;


            downloadBtn.style.display =
                "inline-block";


            status.innerText =
                "Normalization completed!";

        }


        catch (error) {

            console.error(error);

            status.innerText =
                "Error: " + error.message;

        }


        finally {

            normalizeBtn.disabled = false;

        }

    }
);