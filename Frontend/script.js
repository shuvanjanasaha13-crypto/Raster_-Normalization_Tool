const normalizeBtn =
document.getElementById("normalizeBtn");

const rasterFile =
document.getElementById("rasterFile");

const method =
document.getElementById("method");

const status =
document.getElementById("status");


normalizeBtn.addEventListener(
    "click",
    async () => {


        const file =
        rasterFile.files[0];


        if (!file) {

            status.innerText =
            "Please upload a raster file first.";

            return;

        }


        status.innerText =
        "Processing raster...";


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


        try {


            const response =
            await fetch(

                "http://127.0.0.1:5000/normalize",

                {

                    method:

                    "POST",

                    body:

                    formData

                }

            );


            const blob =
            await response.blob();


            const url =
            window.URL.createObjectURL(
                blob
            );


            const a =
            document.createElement(
                "a"
            );


            a.href =
            url;


            a.download =
            "normalized_raster.tif";


            a.click();


            status.innerText =
            "Normalization completed!";


        }


        catch (error) {


            status.innerText =
            "Error processing raster.";


        }


    }
);