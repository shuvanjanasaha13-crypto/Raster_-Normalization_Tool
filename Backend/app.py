
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS

import rasterio
from rasterio.transform import from_origin
from PIL import Image

import numpy as np
import os
import uuid
import io
import base64

import matplotlib
matplotlib.use("Agg")

import matplotlib.pyplot as plt


# ============================================================
# FLASK APPLICATION
# ============================================================

app = Flask(__name__)

# Allow frontend (Netlify/GitHub/etc.) to communicate
# with this Flask API.
CORS(app)


# ============================================================
# FOLDERS
# ============================================================

UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "outputs"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)


# ============================================================
# ALLOWED FILE TYPES
# ============================================================

ALLOWED_EXTENSIONS = {
    ".tif",
    ".tiff",
    ".png",
    ".jpg",
    ".jpeg"
}


# ============================================================
# HELPER: CHECK FILE TYPE
# ============================================================

def allowed_file(filename):

    extension = os.path.splitext(filename)[1].lower()

    return extension in ALLOWED_EXTENSIONS


# ============================================================
# MIN-MAX NORMALIZATION
# ============================================================

def min_max_normalization(data):

    valid = np.isfinite(data)

    if not np.any(valid):

        return np.zeros_like(
            data,
            dtype=np.float32
        )

    minimum = np.nanmin(
        data[valid]
    )

    maximum = np.nanmax(
        data[valid]
    )

    # Avoid division by zero
    if maximum == minimum:

        result = np.zeros_like(
            data,
            dtype=np.float32
        )

        result[valid] = 0

        return result

    result = (
        (data - minimum) /
        (maximum - minimum)
    )

    # Keep invalid cells as NaN
    result = np.where(
        valid,
        result,
        np.nan
    )

    return result.astype(
        np.float32
    )


# ============================================================
# Z-SCORE NORMALIZATION
# ============================================================

def z_score_normalization(data):

    valid = np.isfinite(data)

    if not np.any(valid):

        return np.zeros_like(
            data,
            dtype=np.float32
        )

    mean = np.nanmean(
        data[valid]
    )

    std = np.nanstd(
        data[valid]
    )

    # Avoid division by zero
    if std == 0:

        result = np.zeros_like(
            data,
            dtype=np.float32
        )

        result[valid] = 0

        return result

    result = (
        (data - mean) /
        std
    )

    # Keep invalid cells as NaN
    result = np.where(
        valid,
        result,
        np.nan
    )

    return result.astype(
        np.float32
    )


# ============================================================
# CREATE SPATIAL MAP
# ============================================================

def create_spatial_map(
    normalized,
    is_geotiff=False,
    bounds=None
):

    figure = plt.figure(
        figsize=(9, 7)
    )

    if is_geotiff and bounds:

        extent = [
            bounds.left,
            bounds.right,
            bounds.bottom,
            bounds.top
        ]

        plt.imshow(
            normalized,
            cmap="viridis",
            extent=extent,
            origin="upper"
        )

        plt.xlabel(
            "X Coordinate"
        )

        plt.ylabel(
            "Y Coordinate"
        )

    else:

        plt.imshow(
            normalized,
            cmap="viridis",
            origin="upper"
        )

        plt.xlabel(
            "Column"
        )

        plt.ylabel(
            "Row"
        )

    plt.colorbar(
        label="Normalized Value"
    )

    plt.title(
        "RasterNorm - Normalized Spatial Map"
    )

    plt.tight_layout()

    buffer = io.BytesIO()

    plt.savefig(
        buffer,
        format="png",
        dpi=150,
        bbox_inches="tight"
    )

    plt.close(figure)

    buffer.seek(0)

    return base64.b64encode(
        buffer.getvalue()
    ).decode("utf-8")


# ============================================================
# CREATE VALUE GRID
# ============================================================

def create_value_grid(
    normalized,
    max_rows=20,
    max_cols=20
):

    rows, cols = normalized.shape

    number_of_rows = min(
        rows,
        max_rows
    )

    number_of_cols = min(
        cols,
        max_cols
    )

    row_indices = np.linspace(
        0,
        rows - 1,
        number_of_rows
    ).astype(int)

    col_indices = np.linspace(
        0,
        cols - 1,
        number_of_cols
    ).astype(int)

    grid = normalized[
        np.ix_(
            row_indices,
            col_indices
        )
    ]

    # Replace NaN/Infinity for JSON
    grid = np.nan_to_num(
        grid,
        nan=0.0,
        posinf=0.0,
        neginf=0.0
    )

    return grid.tolist()


# ============================================================
# CREATE NORMALIZED PNG
# ============================================================

def create_normalized_png(normalized):

    valid = np.isfinite(
        normalized
    )

    if np.any(valid):

        minimum = np.nanmin(
            normalized[valid]
        )

        maximum = np.nanmax(
            normalized[valid]
        )

        if maximum != minimum:

            scaled = (
                (normalized - minimum) /
                (maximum - minimum)
            ) * 255

        else:

            scaled = np.zeros_like(
                normalized
            )

    else:

        scaled = np.zeros_like(
            normalized
        )

    scaled = np.nan_to_num(
        scaled,
        nan=0.0,
        posinf=0.0,
        neginf=0.0
    )

    scaled = np.clip(
        scaled,
        0,
        255
    ).astype(
        np.uint8
    )

    image = Image.fromarray(
        scaled
    )

    buffer = io.BytesIO()

    image.save(
        buffer,
        format="PNG"
    )

    buffer.seek(0)

    return buffer


# ============================================================
# HOME / API STATUS
# ============================================================

@app.route("/")
def home():

    return jsonify({

        "success": True,

        "message":
        "RasterNorm Raster Normalization API is running.",

        "version":
        "1.0",

        "supported_formats": [
            ".tif",
            ".tiff",
            ".png",
            ".jpg",
            ".jpeg"
        ],

        "normalization_methods": [
            "minmax",
            "zscore"
        ]

    })


# ============================================================
# NORMALIZE RASTER
# ============================================================

@app.route(
    "/normalize",
    methods=["POST"]
)
def normalize_raster():

    input_path = None

    try:

        # ====================================================
        # CHECK FILE
        # ====================================================

        if "file" not in request.files:

            return jsonify({

                "success": False,

                "error":
                "No file uploaded."

            }), 400


        file = request.files["file"]


        if file.filename == "":

            return jsonify({

                "success": False,

                "error":
                "No file selected."

            }), 400


        if not allowed_file(
            file.filename
        ):

            return jsonify({

                "success": False,

                "error":
                "Unsupported file format. "
                "Please use TIFF, PNG, JPG or JPEG."

            }), 400


        # ====================================================
        # NORMALIZATION METHOD
        # ====================================================

        method = request.form.get(
            "method",
            "minmax"
        ).lower()


        if method not in [
            "minmax",
            "zscore"
        ]:

            return jsonify({

                "success": False,

                "error":
                "Invalid normalization method. "
                "Use minmax or zscore."

            }), 400


        # ====================================================
        # FILE INFORMATION
        # ====================================================

        original_filename = file.filename

        extension = os.path.splitext(
            original_filename
        )[1].lower()

        file_id = str(
            uuid.uuid4()
        )


        input_path = os.path.join(

            UPLOAD_FOLDER,

            file_id +
            extension

        )


        file.save(
            input_path
        )


        # ====================================================
        # VARIABLES
        # ====================================================

        is_geotiff = extension in [
            ".tif",
            ".tiff"
        ]

        bounds = None
        crs = None
        transform = None
        profile = None
        nodata = None


        # ====================================================
        # READ GEOTIFF
        # ====================================================

        if is_geotiff:

            with rasterio.open(
                input_path
            ) as src:

                data = src.read(
                    1
                ).astype(
                    np.float32
                )

                profile = (
                    src.profile.copy()
                )

                bounds = src.bounds

                crs = src.crs

                transform = src.transform

                nodata = src.nodata


                # --------------------------------------------
                # HANDLE NODATA
                # --------------------------------------------

                if nodata is not None:

                    data = np.where(
                        data == nodata,
                        np.nan,
                        data
                    )


        # ====================================================
        # READ PNG / JPG / JPEG
        # ====================================================

        else:

            image = Image.open(
                input_path
            )

            # Convert image to grayscale
            image = image.convert(
                "L"
            )

            data = np.array(
                image
            ).astype(
                np.float32
            )


        # ====================================================
        # CHECK RASTER DIMENSIONS
        # ====================================================

        if data.ndim != 2:

            return jsonify({

                "success": False,

                "error":
                "The uploaded raster could not be "
                "converted to a single-band raster."

            }), 400


        height = int(
            data.shape[0]
        )

        width = int(
            data.shape[1]
        )


        # ====================================================
        # NORMALIZATION
        # ====================================================

        if method == "minmax":

            normalized = (
                min_max_normalization(
                    data
                )
            )

            method_name = (
                "Min-Max Normalization"
            )

        else:

            normalized = (
                z_score_normalization(
                    data
                )
            )

            method_name = (
                "Z-Score Normalization"
            )


        # ====================================================
        # CREATE SPATIAL MAP
        # ====================================================

        spatial_map = create_spatial_map(

            normalized,

            is_geotiff=is_geotiff,

            bounds=bounds

        )


        # ====================================================
        # CREATE VALUE GRID
        # ====================================================

        value_grid = create_value_grid(
            normalized,
            max_rows=20,
            max_cols=20
        )


        # ====================================================
        # SAVE NORMALIZED GEOTIFF
        # ====================================================

        tif_output_path = os.path.join(

            OUTPUT_FOLDER,

            "normalized_" +
            file_id +
            ".tif"

        )


        if is_geotiff:

            output_profile = (
                profile.copy()
            )


            output_profile.update(

                dtype=rasterio.float32,

                count=1,

                compress="lzw"

            )


            # --------------------------------------------
            # Preserve CRS
            # --------------------------------------------

            if crs is not None:

                output_profile.update(
                    crs=crs
                )


            # --------------------------------------------
            # Preserve transform
            # --------------------------------------------

            if transform is not None:

                output_profile.update(
                    transform=transform
                )


            # --------------------------------------------
            # Handle NoData
            # --------------------------------------------

            # We use NaN internally. For the output,
            # use the original NoData value when available.

            if nodata is not None:

                output_profile.update(
                    nodata=nodata
                )


            with rasterio.open(

                tif_output_path,

                "w",

                **output_profile

            ) as dst:

                output_data = (
                    normalized.copy()
                )


                # ----------------------------------------
                # Restore original NoData value
                # ----------------------------------------

                if nodata is not None:

                    output_data = np.where(

                        np.isfinite(
                            output_data
                        ),

                        output_data,

                        nodata

                    )


                dst.write(

                    output_data.astype(
                        np.float32
                    ),

                    1

                )


        else:

            # =================================================
            # PNG/JPG → NEW PIXEL-BASED GEOTIFF
            # =================================================

            output_transform = from_origin(

                0,

                height,

                1,

                1

            )


            with rasterio.open(

                tif_output_path,

                "w",

                driver="GTiff",

                height=height,

                width=width,

                count=1,

                dtype="float32",

                transform=output_transform

            ) as dst:

                dst.write(

                    np.nan_to_num(
                        normalized,
                        nan=0.0,
                        posinf=0.0,
                        neginf=0.0
                    ).astype(
                        np.float32
                    ),

                    1

                )


        # ====================================================
        # CREATE NORMALIZED PNG
        # ====================================================

        png_output_path = os.path.join(

            OUTPUT_FOLDER,

            "normalized_" +
            file_id +
            ".png"

        )


        png_buffer = (
            create_normalized_png(
                normalized
            )
        )


        with open(
            png_output_path,
            "wb"
        ) as output_file:

            output_file.write(
                png_buffer.getvalue()
            )


        # ====================================================
        # STATISTICS
        # ====================================================

        valid_values = normalized[
            np.isfinite(
                normalized
            )
        ]


        if len(valid_values) > 0:

            statistics = {

                "minimum":
                float(
                    np.min(
                        valid_values
                    )
                ),

                "maximum":
                float(
                    np.max(
                        valid_values
                    )
                ),

                "mean":
                float(
                    np.mean(
                        valid_values
                    )
                ),

                "standard_deviation":
                float(
                    np.std(
                        valid_values
                    )
                ),

                "valid_pixels":
                int(
                    len(
                        valid_values
                    )
                )

            }

        else:

            statistics = {}


        # ====================================================
        # RESPONSE
        # ====================================================

        return jsonify({

            "success":
            True,

            "message":
            "Raster normalization completed successfully.",

            "filename":
            original_filename,

            "file_type":
            extension.replace(
                ".",
                ""
            ).upper(),

            "normalization_method":
            method,

            "normalization_method_name":
            method_name,

            "width":
            width,

            "height":
            height,

            "original_preview":
            None,

            "preview":
            spatial_map,

            "normalized_spatial_map":
            spatial_map,

            "value_grid":
            value_grid,

            "statistics":
            statistics,

            "is_georeferenced":
            bool(
                is_geotiff and
                crs is not None
            ),

            "crs":
            str(crs)
            if crs is not None
            else None,

            "download_url":
            "/download/" +
            file_id,

            "image_download_url":
            "/download-image/" +
            file_id

        })


    # ========================================================
    # ERROR HANDLING
    # ========================================================

    except Exception as e:

        print(
            "RasterNorm Error:",
            str(e)
        )

        return jsonify({

            "success":
            False,

            "error":
            str(e)

        }), 500


# ============================================================
# DOWNLOAD NORMALIZED GEOTIFF
# ============================================================

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


    if not os.path.exists(
        output_path
    ):

        return jsonify({

            "success":
            False,

            "error":
            "Normalized TIFF file not found."

        }), 404


    return send_file(

        output_path,

        as_attachment=True,

        download_name=
        "normalized_raster.tif"

    )


# ============================================================
# DOWNLOAD NORMALIZED PNG
# ============================================================

@app.route(
    "/download-image/<file_id>"
)
def download_image(file_id):

    output_path = os.path.join(

        OUTPUT_FOLDER,

        "normalized_" +
        file_id +
        ".png"

    )


    if not os.path.exists(
        output_path
    ):

        return jsonify({

            "success":
            False,

            "error":
            "Normalized PNG file not found."

        }), 404


    return send_file(

        output_path,

        as_attachment=True,

        download_name=
        "normalized_raster.png"

    )


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route(
    "/health"
)
def health():

    return jsonify({

        "status":
        "healthy",

        "service":
        "RasterNorm API"

    })


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":

    port = int(
        os.environ.get(
            "PORT",
            5000
        )
    )

    app.run(

        host="0.0.0.0",

        port=port,

        debug=False

    )
