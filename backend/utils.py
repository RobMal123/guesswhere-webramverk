from math import radians, sin, cos, sqrt, atan2


def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points
    on the earth (specified in decimal degrees)
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    r = 6371  # Radius of earth in kilometers

    return c * r


def calculate_score(distance):
    """
    Calculate score based on distance:
    - Perfect score (5000) if distance < 1 km
    - Minimum score (0) if distance > 5000 km
    - Linear decrease between these points
    """
    if distance < 1:
        return 5000
    elif distance > 5000:
        return 0
    else:
        # Linear decrease from 5000 to 0 points
        return int(5000 * (1 - (distance - 1) / 4999))
