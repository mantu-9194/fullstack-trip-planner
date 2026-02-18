from datetime import datetime, timedelta
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

    # Start time = now
    start_time = datetime.now()

    # Geocode
    current_coords = geocode_location(current_location)
    pickup_coords = geocode_location(pickup_location)
    dropoff_coords = geocode_location(dropoff_location)

    # Route 1: Current → Pickup
    distance1, duration1, geometry1 = get_route_distance(
        current_coords, pickup_coords
    )

    # Route 2: Pickup → Dropoff
    distance2, duration2, geometry2 = get_route_distance(
        pickup_coords, dropoff_coords
    )

    total_distance = distance1 + distance2

    logs = []

    # 🚛 Drive to Pickup
    logs_leg1 = calculate_trip(distance1, cycle_used, start_time)
    logs.extend(logs_leg1)

    # Get updated time & cycle after leg1
    last_time = logs[-1]["end"]
    used_hours_leg1 = sum(
        (log["end"] - log["start"]).total_seconds() / 3600
        for log in logs_leg1
        if log["status"] == "Driving"
    )

    cycle_used += used_hours_leg1

    # 📦 1 Hour Pickup
    logs.append({
        "status": "Pickup (1 hr)",
        "start": last_time,
        "end": last_time + timedelta(hours=1)
    })

    last_time += timedelta(hours=1)

    # 🚛 Drive to Dropoff
    logs_leg2 = calculate_trip(distance2, cycle_used, last_time)
    logs.extend(logs_leg2)

    last_time = logs[-1]["end"]

    # 📦 1 Hour Dropoff
    logs.append({
        "status": "Dropoff (1 hr)",
        "start": last_time,
        "end": last_time + timedelta(hours=1)
    })

    return Response({
        "logs": logs,
        "total_distance_miles": round(total_distance, 2),
        "geometry1": geometry1,
        "geometry2": geometry2,
    })
