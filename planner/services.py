from datetime import timedelta
import requests
from django.conf import settings


def get_route_distance(start, end):
    url = "https://api.openrouteservice.org/v2/directions/driving-car"

    headers = {
        "Authorization": settings.ORS_API_KEY,
        "Content-Type": "application/json"
    }

    body = {
        "coordinates": [
            start,  # [lng, lat]
            end
        ]
    }

    response = requests.post(url, json=body, headers=headers)
    data = response.json()

    distance_meters = data["routes"][0]["summary"]["distance"]
    duration_seconds = data["routes"][0]["summary"]["duration"]
    geometry = data["routes"][0]["geometry"]

    distance_miles = distance_meters / 1609.34

    return distance_miles, duration_seconds, geometry

MAX_DRIVING_HOURS = 11
MAX_SHIFT_HOURS = 14
MAX_CYCLE_HOURS = 70
BREAK_AFTER_HOURS = 8
AVERAGE_SPEED = 60  # mph
FUEL_RANGE = 1000  # miles


def calculate_trip(distance, cycle_used, start_time):
    logs = []

    remaining_cycle = MAX_CYCLE_HOURS - cycle_used
    current_time = start_time
    miles_remaining = distance
    fuel_remaining = FUEL_RANGE

    while miles_remaining > 0 and remaining_cycle > 0:

        remaining_drive = MAX_DRIVING_HOURS
        shift_hours_used = 0
        driving_since_break = 0

        while (
            remaining_drive > 0
            and miles_remaining > 0
            and shift_hours_used < MAX_SHIFT_HOURS
            and remaining_cycle > 0
        ):

            max_possible_drive = min(
                remaining_drive,
                BREAK_AFTER_HOURS - driving_since_break,
                miles_remaining / AVERAGE_SPEED,
                MAX_SHIFT_HOURS - shift_hours_used,
                remaining_cycle,
                fuel_remaining / AVERAGE_SPEED
            )

            miles_driven = max_possible_drive * AVERAGE_SPEED

            logs.append({
                "status": "Driving",
                "start": current_time,
                "end": current_time + timedelta(hours=max_possible_drive),
                "miles": round(miles_driven, 2)
            })

            current_time += timedelta(hours=max_possible_drive)
            miles_remaining -= miles_driven
            remaining_drive -= max_possible_drive
            remaining_cycle -= max_possible_drive
            shift_hours_used += max_possible_drive
            driving_since_break += max_possible_drive
            fuel_remaining -= miles_driven

            # Fuel stop
            if fuel_remaining <= 0 and miles_remaining > 0:
                logs.append({
                    "status": "Fuel Stop",
                    "start": current_time,
                    "end": current_time + timedelta(minutes=30)
                })
                current_time += timedelta(minutes=30)
                shift_hours_used += 0.5
                fuel_remaining = FUEL_RANGE

            # 30-minute break rule
            if driving_since_break >= BREAK_AFTER_HOURS and miles_remaining > 0:
                logs.append({
                    "status": "30 Min Break",
                    "start": current_time,
                    "end": current_time + timedelta(minutes=30)
                })
                current_time += timedelta(minutes=30)
                shift_hours_used += 0.5
                driving_since_break = 0

        # 10 hour reset
        if miles_remaining > 0:
            logs.append({
                "status": "10 Hour Break",
                "start": current_time,
                "end": current_time + timedelta(hours=10)
            })
            current_time += timedelta(hours=10)

    return logs

def geocode_location(location_name):
    url = "https://api.openrouteservice.org/geocode/search"

    headers = {
        "Authorization": settings.ORS_API_KEY
    }

    params = {
        "text": location_name,
        "size": 1
    }

    response = requests.get(url, headers=headers, params=params)
    data = response.json()

    features = data.get("features")

    if not features:
        raise ValueError(f"Could not geocode location: {location_name}")

    coordinates = features[0]["geometry"]["coordinates"]

    return coordinates  # [lng, lat]


