from django.db.models import DecimalField, ExpressionWrapper, F
from django.db.models.functions import ACos, Cos, Radians, Sin

def annotate_distance(queryset, user_lat, user_lng, lat_field='latitude', lng_field='longitude'):
    """
    Annotates a queryset with the distance in kilometers from the user's location
    using the spherical law of cosines (Haversine approximation).
    Works on both SQLite and PostgreSQL.
    """
    try:
        user_lat_rad = float(user_lat)
        user_lng_rad = float(user_lng)
    except (TypeError, ValueError):
        # Fallback if coordinates are invalid or missing
        return queryset.annotate(distance=ExpressionWrapper(0.00, output_field=DecimalField()))

    # Spherical law of cosines formula
    distance_expression = ExpressionWrapper(
        6371.0 * ACos(
            Cos(Radians(user_lat_rad)) * Cos(Radians(F(lat_field))) * 
            Cos(Radians(F(lng_field)) - Radians(user_lng_rad)) + 
            Sin(Radians(user_lat_rad)) * Sin(Radians(F(lat_field)))
        ),
        output_field=DecimalField(max_digits=9, decimal_places=2)
    )
    
    return queryset.annotate(distance=distance_expression)
