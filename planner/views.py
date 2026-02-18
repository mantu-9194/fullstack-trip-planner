from datetime import datetime
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .services import (
    geocode_location,
    get_route_distance,
    calculate_trip
)


@api_view(["POST"])
def plan_trip(request):
    current_location = request.data.get("current_location")
    pickup_location = request.data.get("pickup_location")
    dropoff_location = request.data.get("dropoff_location")
    cycle_used = float(request.data.get("cycle_used", 0))

    start_time = datetime.now()

    # 1️⃣ Geocode all locations
    current_coords = geocode_location(current_location)
    pickup_coords = geocode_location(pickup_location)
    dropoff_coords = geocode_location(dropoff_location)

    # 2️⃣ Get route distances
    distance1, _, geometry1 = get_route_distance(
        current_coords, pickup_coords
    )

    distance2, _, geometry2 = get_route_distance(
        pickup_coords, dropoff_coords
    )

    total_distance = distance1 + distance2

    # 3️⃣ Calculate full trip (handles pickup + dropoff internally)
    logs = calculate_trip(
        distance1,
        distance2,
        cycle_used,
        start_time
    )

    return Response({
        "logs": logs,
        "total_distance_miles": round(total_distance, 2),
        "geometry1": geometry1,
        "geometry2": geometry2,
    })
