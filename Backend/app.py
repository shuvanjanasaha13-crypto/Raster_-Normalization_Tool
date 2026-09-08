from flask import Flask, request, send_file, jsonify
from flask_cors import CORS

import os
import uuid
import io
import base64

import numpy as np
import rasterio

from rasterio.transform import from_origin
from PIL import Image

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt


# ============================================================
# FLASK APPLICATION
# ============================================================

app = Flask(__name__)

CORS(app)


# ============================================================
# FOLDERS
# ============================================================

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
# MAXIMUM PREVIEW SIZE
# ============================================================

MAX_PREVIEW_SIZE = 800


# ============================================================
# CHECK FILE TYPE
# ============================================================

def allowed_file(filename):

    extension = os.path.splitext(
        filename
    )[1].lower()

    return extension in ALLOWED_EXTENSIONS


# ============================================================
# CREATE FAST PREVIEW
# ============================================================

def create_preview_data(
    data,
    max_size=MAX_PREVIEW_SIZE
):

    rows, columns = data.shape


    # Already small enough

    if (
        rows <= max_size
        and columns <= max_size
    ):

        return data


    # Calculate downsampling step

    row_step = max(
        1,
        int(np.ceil(rows / max_size))
    )

    column_step = max(
        1,
        int(np.ceil(columns / max_size))
    )


    return data[
        ::row_step,
        ::column_step
    ]


# ============================================================
# MIN-MAX NORMALIZATION
# ============================================================

def min_max_normalization(data):

    data = data.astype(
        np.float32
    )

    valid_mask = np.isfinite(
        data
    )

    normalized = np.full(
        data.shape,
        np.nan,
        dtype=np.float32
    )


    if not np.any(valid_mask):

        return normalized


    valid_values = data[
        valid_mask
    ]


    minimum = np.min(
        valid_values
    )

    maximum = np.max(
        valid_values
    )


    if maximum == minimum:

        normalized[
            valid_mask
        ] = 0.0

        return normalized


    normalized[
        valid_mask
    ] = (

        valid_values - minimum

    ) / (

        maximum - minimum

    )


    return normalized.astype(
        np.float32
    )


# ============================================================
# Z-SCORE NORMALIZATION
# ============================================================

def z_score_normalization(data):

    data = data.astype(
        np.float32
    )

    valid_mask = np.isfinite(
        data
    )

    normalized = np.full(
        data.shape,
        np.nan,
        dtype=np.float32
    )


    if not np.any(valid_mask):

        return normalized


    valid_values = data[
        valid_mask
    ]


    mean = np.mean(
        valid_values
    )

    standard_deviation = np.std(
        valid_values
    )


    if standard_deviation == 0:

        normalized[
            valid_mask
        ] = 0.0

        return normalized


    normalized[
        valid_mask
    ] = (

        valid_values - mean

    ) / standard_deviation


    return normalized.astype(
        np.float32
    )


# ============================================================
# DECIMAL SCALING NORMALIZATION
# ============================================================

def decimal_scaling_normalization(data):

    data = data.astype(
        np.float32
    )

    valid_mask = np.isfinite(
        data
    )

    normalized = np.full(
        data.shape,
        np.nan,
        dtype=np.float32
    )


    if not np.any(valid_mask):

        return normalized


    valid_values = data[
        valid_mask
    ]


    maximum_absolute_value = np.max(
        np.abs(valid_values)
    )


    if maximum_absolute_value == 0:

        normalized[
            valid_mask
        ] = 0.0

        return normalized


    scaling_power = int(
        np.ceil(
            np.log10(
                maximum_absolute_value + 1
            )
        )
    )


    normalized[
        valid_mask
    ] = (

        valid_values /

        (
            10 **
            scaling_power
        )

    )


    return normalized.astype(
        np.float32
    )


# ============================================================
# CREATE FAST SPATIAL MAP
# ============================================================

def create_spatial_map(
    normalized,
    is_geotiff=False,
    bounds=None
):

    # Create smaller preview

    preview_data = create_preview_data(
        normalized
    )


    figure, axis = plt.subplots(
        figsize=(6, 5)
    )


    display_data = np.ma.masked_invalid(
        preview_data
    )


    # ========================================================
    # GEOTIFF
    # ========================================================

    if (
        is_geotiff
        and bounds is not None
    ):

        extent = [

            bounds.left,
            bounds.right,
            bounds.bottom,
            bounds.top

        ]


        image = axis.imshow(

            display_data,

            cmap="viridis",

            extent=extent,

            origin="upper",

            interpolation="nearest"

        )


        axis.set_xlabel(
            "X Coordinate"
        )

        axis.set_ylabel(
            "Y Coordinate"
        )


    # ========================================================
    # NORMAL IMAGE
    # ========================================================

    else:

        image = axis.imshow(

            display_data,

            cmap="viridis",

            origin="upper",

            interpolation="nearest"

        )


        axis.set_xlabel(
            "Column"
        )

        axis.set_ylabel(
            "Row"
        )


    # ========================================================
    # COLORBAR
    # ========================================================

    figure.colorbar(

        image,

        ax=axis,

        label="Normalized Value"

    )


    axis.set_title(
        "RasterNorm - Normalized Spatial Map"
    )


    figure.tight_layout()


    buffer = io.BytesIO()


    figure.savefig(

        buffer,

        format="png",

        dpi=80,

        bbox_inches="tight"

    )


    plt.close(
        figure
    )


    buffer.seek(0)


    return base64.b64encode(
        buffer.getvalue()
    ).decode(
        "utf-8"
    )


# ============================================================
# CREATE VALUE GRID
# ============================================================

def create_value_grid(
    normalized,
    max_rows=20,
    max_cols=20
):

    rows, columns = normalized.shape


    sample_rows = min(
        rows,
        max_rows
    )


    sample_columns = min(
        columns,
        max_cols
    )


    row_indices = np.linspace(

        0,

        rows - 1,

        sample_rows

    ).astype(int)


    column_indices = np.linspace(

        0,

        columns - 1,

        sample_columns

    ).astype(int)


    grid = normalized[
        np.ix_(
            row_indices,
            column_indices
        )
    ]


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

    # Use preview for faster PNG generation

    preview_data = create_preview_data(
        normalized
    )


    valid_mask = np.isfinite(
        preview_data
    )


    scaled = np.zeros_like(

        preview_data,

        dtype=np.float32

    )


    if np.any(valid_mask):

        valid_values = preview_data[
            valid_mask
        ]


        minimum = np.min(
            valid_values
        )


        maximum = np.max(
            valid_values
        )


        if maximum != minimum:

            scaled[
                valid_mask
            ] = (

                (
                    preview_data[
                        valid_mask
                    ]

                    - minimum
                )

                /

                (
                    maximum
                    - minimum
                )

            ) * 255


        else:

            scaled[
                valid_mask
            ] = 0


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

        format="PNG",

        optimize=True

    )


    buffer.seek(0)


    return buffer


# ============================================================
# CREATE STATISTICS
# ============================================================

def create_statistics(data):

    valid_values = data[
        np.isfinite(data)
    ]


    if len(valid_values) == 0:

        return {

            "minimum": 0.0,
            "maximum": 0.0,
            "mean": 0.0,
            "standard_deviation": 0.0,
            "valid_pixels": 0

        }


    return {

        "minimum":
            float(np.min(valid_values)),

        "maximum":
            float(np.max(valid_values)),

        "mean":
            float(np.mean(valid_values)),

        "standard_deviation":
            float(np.std(valid_values)),

        "valid_pixels":
            int(len(valid_values))

    }


# ============================================================
# HOME ROUTE
# ============================================================

@app.route("/")
def home():

    return jsonify({

        "success": True,

        "message":
            "RasterNorm API is running.",

        "version":
            "4.0 Optimized",

        "supported_formats": [

            ".tif",
            ".tiff",
            ".png",
            ".jpg",
            ".jpeg"

        ],

        "normalization_methods": [

            "minmax",
            "zscore",
            "decimal_scaling"

        ]

    })


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/health")
def health():

    return jsonify({

        "status":
            "healthy",

        "service":
            "RasterNorm API"

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


        file = request.files[
            "file"
        ]


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
                    "Unsupported file format."

            }), 400


        # ====================================================
        # METHOD
        # ====================================================

        method = request.form.get(

            "method",

            "minmax"

        ).strip().lower()


        valid_methods = [

            "minmax",
            "zscore",
            "decimal_scaling"

        ]


        if method not in valid_methods:

            return jsonify({

                "success": False,

                "error":
                    "Invalid normalization method."

            }), 400


        # ====================================================
        # FILE INFO
        # ====================================================

        original_filename = (
            file.filename
        )


        extension = os.path.splitext(
            original_filename
        )[1].lower()


        file_id = str(
            uuid.uuid4()
        )


        input_path = os.path.join(

            UPLOAD_FOLDER,

            f"{file_id}{extension}"

        )


        file.save(
            input_path
        )


        is_geotiff = extension in [

            ".tif",
            ".tiff"

        ]


        bounds = None

        crs = None

        profile = None

        nodata = None


        # ====================================================
        # READ TIFF
        # ====================================================

        if is_geotiff:

            with rasterio.open(
                input_path
            ) as source:

                data = source.read(
                    1
                ).astype(
                    np.float32
                )


                profile = (
                    source.profile.copy()
                )


                bounds = (
                    source.bounds
                )


                crs = (
                    source.crs
                )


                nodata = (
                    source.nodata
                )


                if nodata is not None:

                    data = np.where(

                        data == nodata,

                        np.nan,

                        data

                    )


        # ====================================================
        # READ IMAGE
        # ====================================================

        else:

            image = Image.open(
                input_path
            )


            image = image.convert(
                "L"
            )


            data = np.array(

                image,

                dtype=np.float32

            )


        # ====================================================
        # DIMENSIONS
        # ====================================================

        if data.ndim != 2:

            return jsonify({

                "success": False,

                "error":
                    "Raster must be single-band."

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


        elif method == "zscore":

            normalized = (
                z_score_normalization(
                    data
                )
            )

            method_name = (
                "Z-Score Normalization"
            )


        else:

            normalized = (
                decimal_scaling_normalization(
                    data
                )
            )

            method_name = (
                "Decimal Scaling Normalization"
            )


        # ====================================================
        # CREATE FAST PREVIEW
        # ====================================================

        spatial_map = create_spatial_map(

            normalized,

            is_geotiff,

            bounds

        )


        # ====================================================
        # VALUE GRID
        # ====================================================

        value_grid = create_value_grid(
            normalized
        )


        # ====================================================
        # OUTPUT TIFF
        # ====================================================

        tif_output_path = os.path.join(

            OUTPUT_FOLDER,

            f"normalized_{file_id}.tif"

        )


        # ====================================================
        # SAVE GEOTIFF
        # ====================================================

        if is_geotiff:

            output_profile = (
                profile.copy()
            )


            output_profile.update(

                driver="GTiff",

                dtype="float32",

                count=1,

                compress="lzw"

            )


            output_data = (
                normalized.copy()
            )


            if nodata is not None:

                output_profile.update(

                    nodata=nodata

                )


                output_data = np.where(

                    np.isfinite(
                        output_data
                    ),

                    output_data,

                    nodata

                )


            with rasterio.open(

                tif_output_path,

                "w",

                **output_profile

            ) as destination:

                destination.write(

                    output_data.astype(
                        np.float32
                    ),

                    1

                )


        # ====================================================
        # SAVE IMAGE AS TIFF
        # ====================================================

        else:

            output_transform = from_origin(

                0,
                height,
                1,
                1

            )


            output_data = np.nan_to_num(

                normalized,

                nan=0.0,

                posinf=0.0,

                neginf=0.0

            ).astype(
                np.float32
            )


            with rasterio.open(

                tif_output_path,

                "w",

                driver="GTiff",

                height=height,

                width=width,

                count=1,

                dtype="float32",

                transform=output_transform,

                compress="lzw"

            ) as destination:

                destination.write(

                    output_data,

                    1

                )


        # ====================================================
        # CREATE PNG OUTPUT
        # ====================================================

        png_output_path = os.path.join(

            OUTPUT_FOLDER,

            f"normalized_{file_id}.png"

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

        statistics = (
            create_statistics(
                normalized
            )
        )


        # ====================================================
        # SUCCESS RESPONSE
        # ====================================================

        return jsonify({

            "success": True,

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

            "normalized_spatial_map":
                spatial_map,

            "preview":
                spatial_map,

            "value_grid":
                value_grid,

            "statistics":
                statistics,

            "is_georeferenced":
                bool(
                    is_geotiff
                    and crs is not None
                ),

            "crs":
                str(crs)
                if crs is not None
                else None,

            "download_url":
                f"/download/{file_id}",

            "image_download_url":
                f"/download-image/{file_id}"

        })


    except Exception as error:

        print(
            "RasterNorm Error:",
            str(error)
        )


        return jsonify({

            "success": False,

            "error":
                str(error)

        }), 500


    finally:

        if (

            input_path is not None

            and os.path.exists(
                input_path
            )

        ):

            try:

                os.remove(
                    input_path
                )

            except OSError:

                pass


# ============================================================
# DOWNLOAD TIFF
# ============================================================

@app.route(
    "/download/<file_id>"
)
def download_file(file_id):

    output_path = os.path.join(

        OUTPUT_FOLDER,

        f"normalized_{file_id}.tif"

    )


    if not os.path.exists(
        output_path
    ):

        return jsonify({

            "success": False,

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
# DOWNLOAD PNG
# ============================================================

@app.route(
    "/download-image/<file_id>"
)
def download_image(file_id):

    output_path = os.path.join(

        OUTPUT_FOLDER,

        f"normalized_{file_id}.png"

    )


    if not os.path.exists(
        output_path
    ):

        return jsonify({

            "success": False,

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
# RUN APPLICATION
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