import math
import json
from datetime import datetime
from PIL import Image
import imagehash
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# Load the model once when the module is imported
# This runs fully local, no API key needed
text_model = SentenceTransformer('all-MiniLM-L6-v2')

def compute_text_embedding(text: str) -> list[float]:
    """
    Computes the embedding vector for a given text string.
    """
    embedding = text_model.encode(text)
    return embedding.tolist()

def compute_image_hash(image_path: str) -> str:
    """
    Computes the perceptual hash (pHash) for an image.
    hash_size=16 -> 256-bit fingerprint
    """
    try:
        with Image.open(image_path) as img:
            # Convert to RGB using Pillow
            img = img.convert('RGB')
            # Compute pHash
            phash = imagehash.phash(img, hash_size=16)
            return str(phash)
    except Exception as e:
        print(f"Error computing hash for {image_path}: {e}")
        return None

def calculate_text_score(lost_embedding: list[float], found_embedding: list[float]) -> float:
    """
    Computes cosine similarity between two text embeddings.
    """
    if not lost_embedding or not found_embedding:
        return 0.0
    
    # Compute cosine similarity using sklearn
    similarity = cosine_similarity([lost_embedding], [found_embedding])[0][0]
    # Ensure it's between 0.0 and 1.0
    return max(0.0, min(1.0, float(similarity)))

def calculate_image_score(lost_hashes: list[str], found_hashes: list[str]) -> float:
    """
    Compares all pairs between lost photos and found photos.
    Returns the BEST (highest) similarity across all pairs.
    """
    if not lost_hashes or not found_hashes:
        return 0.0
    
    best_similarity = 0.0
    
    for lost_hash_str in lost_hashes:
        if not lost_hash_str: continue
        try:
            lost_hash = imagehash.hex_to_hash(lost_hash_str)
        except:
            continue
            
        for found_hash_str in found_hashes:
            if not found_hash_str: continue
            try:
                found_hash = imagehash.hex_to_hash(found_hash_str)
            except:
                continue
                
            # hamming_distance = lost_hash - found_hash
            hamming_distance = lost_hash - found_hash
            # similarity = 1.0 - (hamming_distance / 256)
            similarity = 1.0 - (hamming_distance / 256.0)
            
            if similarity > best_similarity:
                best_similarity = similarity
                
    return max(0.0, min(1.0, float(best_similarity)))

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Haversine formula (implement from scratch, no external lib)
    """
    R = 6371.0 # km
    
    # Convert degrees to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    # a = sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlng/2)
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    # distance = 2R · atan2(√a, √(1−a))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = R * c
    return distance

def calculate_location_score(lost_location: dict, found_location: dict) -> float:
    """
    Lost item has a ROUTE (from_point -> to_point)
    Found item has a SINGLE POINT (where it was found)
    """
    if not found_location or 'lat' not in found_location or 'lng' not in found_location:
        return 0.5 # neutral
        
    if not lost_location or 'from_lat' not in lost_location or 'from_lng' not in lost_location:
        return 0.5 # neutral
        
    found_lat = found_location['lat']
    found_lng = found_location['lng']
    
    from_lat = lost_location['from_lat']
    from_lng = lost_location['from_lng']
    
    distances = []
    distances.append(haversine_distance(found_lat, found_lng, from_lat, from_lng))
    
    if 'to_lat' in lost_location and 'to_lng' in lost_location:
        to_lat = lost_location['to_lat']
        to_lng = lost_location['to_lng']
        distances.append(haversine_distance(found_lat, found_lng, to_lat, to_lng))
        
        # midpoint of the route
        mid_lat = (from_lat + to_lat) / 2.0
        mid_lng = (from_lng + to_lng) / 2.0
        distances.append(haversine_distance(found_lat, found_lng, mid_lat, mid_lng))
        
    min_distance = min(distances)
    
    # Distance -> score conversion:
    # < 1 km   -> 1.0  (exact area)
    # 1-5 km   -> linear scale 1.0 -> 0.6
    # 5-20 km  -> linear scale 0.6 -> 0.1
    # > 20 km  -> 0.0
    
    if min_distance < 1.0:
        return 1.0
    elif min_distance <= 5.0:
        # linear scale 1.0 -> 0.6 over 4km (1 to 5)
        # 1km -> 1.0, 5km -> 0.6
        # slope = (0.6 - 1.0) / (5 - 1) = -0.4 / 4 = -0.1
        return 1.0 - 0.1 * (min_distance - 1.0)
    elif min_distance <= 20.0:
        # linear scale 0.6 -> 0.1 over 15km (5 to 20)
        # 5km -> 0.6, 20km -> 0.1
        # slope = (0.1 - 0.6) / (20 - 5) = -0.5 / 15 = -0.0333
        return 0.6 - (0.5 / 15.0) * (min_distance - 5.0)
    else:
        return 0.0

def calculate_time_score(lost_time: dict, found_time: dict) -> float:
    """
    Lost item has a TIME WINDOW: lost_from -> lost_until
    Found item has a SINGLE TIMESTAMP: found_at
    """
    if not found_time or 'found_at' not in found_time:
        return 0.5
        
    if not lost_time or 'lost_from' not in lost_time or 'lost_until' not in lost_time:
        return 0.5
        
    found_at = found_time['found_at'] # datetime object
    lost_from = lost_time['lost_from'] # datetime object
    lost_until = lost_time['lost_until'] # datetime object
    
    if lost_from <= found_at <= lost_until:
        return 1.0
        
    # If found_at is outside the window:
    # gap_hours = hours between found_at and nearest window edge
    if found_at < lost_from:
        gap = lost_from - found_at
    else:
        gap = found_at - lost_until
        
    gap_hours = gap.total_seconds() / 3600.0
    
    # score = max(0.0, 0.5 - (gap_hours / 48))
    score = max(0.0, 0.5 - (gap_hours / 48.0))
    return score

def score_items(lost_item: dict, found_item: dict) -> dict:
    """
    Computes the composite score for a lost and found item pair.
    """
    # CATEGORY GATE (hard filter, runs before scoring):
    if lost_item.get('category') != found_item.get('category'):
        return {
            'text_score': 0.0,
            'image_score': 0.0,
            'location_score': 0.0,
            'time_score': 0.0,
            'total_score': 0.0
        }
        
    text_score = calculate_text_score(lost_item.get('text_embedding'), found_item.get('text_embedding'))
    image_score = calculate_image_score(lost_item.get('image_hashes', []), found_item.get('image_hashes', []))
    location_score = calculate_location_score(lost_item.get('location'), found_item.get('location'))
    time_score = calculate_time_score(lost_item.get('time'), found_item.get('time'))
    
    # total_score = (text * 0.45) + (image * 0.25) + (location * 0.20) + (time * 0.10)
    total_score = (text_score * 0.45) + (image_score * 0.25) + (location_score * 0.20) + (time_score * 0.10)
    
    return {
        'text_score': text_score,
        'image_score': image_score,
        'location_score': location_score,
        'time_score': time_score,
        'total_score': total_score
    }
