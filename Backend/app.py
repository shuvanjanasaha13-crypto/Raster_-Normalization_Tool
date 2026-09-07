from flask import Flask, request, send_file, jsonify
from flask_cors import CORS

import rasterio
import numpy as np
import os
import uuid
import io
import base64

import matplotlib
matplotlib.use("Agg")

import matplotlib.pyplot as plt

from normalization import (
    min_max_normalization,
    z_score_normalization
)


app = Flask(__name__)

CORS(app)


UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "outputs"


os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)

os.makedirs(
    OUTPUT_FOLDER,
    exist_ok=True
)


@app.route("/")
def home():

    return {
        "message": "Raster Normalization API is running"
    }


@app.route(
    "/normalize",
    methods=["POST"]
)
def normalize_raster():

    try:

        file = request.files["file"]

        method = request.form.get("method")


        file_id = str(uuid.uuid4())


        input_path = os.path.join(
            UPLOAD_FOLDER,
            file_id + ".tif"
        )


        output_path = os.path.join(
            OUTPUT_FOLDER,
            "normalized_" + file_id + ".tif"
        )


        file.save(input_path)


        with rasterio.open(input_path) as src:

            data = src.read(1).astype(
                np.float32
            )

            profile = src.profile


            if method == "minmax":

                normalized = min_max_normalization(
                    data
                )


            elif method == "zscore":

                normalized = z_score_normalization(
                    data
                )


            else:

                return jsonify({
                    "error": "Invalid method"
                })


            profile.update(
                dtype=rasterio.float32
            )


            with rasterio.open(
                output_path,
                "w",
                **profile
            ) as dst:

                dst.write(
                    normalized.astype(
                        rasterio.float32
                    ),
                    1
                )


        # CREATE PNG PREVIEW

        plt.figure(figsize=(8, 6))

        plt.imshow(
            normalized,
            cmap="viridis"
        )

        plt.colorbar(
            label="Normalized Value"
        )

        plt.title(
            "Normalized Raster"
        )

        plt.axis("off")


        buffer = io.BytesIO()


        plt.savefig(
            buffer,
            format="png",
            bbox_inches="tight",
            dpi=150
        )


        plt.close()


        buffer.seek(0)


        preview_base64 = base64.b64encode(
            buffer.getvalue()
        ).decode("utf-8")


        return jsonify({

            "success": True,

            "preview": preview_base64,

            "download_url":

            "/download/" + file_id

        })


    except Exception as e:

        return jsonify({

            "error": str(e)

        }), 500



@app.route(
    "/download/<file_id>"
)
def download_file(file_id):


    output_path = os.path.join(

        OUTPUT_FOLDER,

        "normalized_" +
        file_id +
        ".tif"

    )


    return send_file(

        output_path,

        as_attachment=True,

        download_name=
        "normalized_raster.tif"

    )



if __name__ == "__main__":

    app.run(
        debug=True
    )