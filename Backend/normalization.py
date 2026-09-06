import numpy as np


def min_max_normalization(data):


    minimum = np.nanmin(data)

    maximum = np.nanmax(data)


    normalized = (

        data - minimum

    ) / (

        maximum - minimum

    )


    return normalized



def z_score_normalization(data):


    mean = np.nanmean(data)

    std = np.nanstd(data)


    normalized = (

        data - mean

    ) / std


    return normalized