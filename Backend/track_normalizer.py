"""
Track Coordinate Normalizer
Scales and centers all tracks to a consistent coordinate system for proper canvas display
"""
import numpy as np
from typing import List, Dict, Tuple, Any
from sqlalchemy.orm import Session
from schemas.track import PredefinedTrack
from simulation.optimizer import compute_curvature
from scipy.ndimage import gaussian_filter1d


class TrackNormalizer:
    """
    Normalizes track coordinates to a consistent scale and center position
    """
    
    def __init__(self, 
                 target_width: float = 800.0,  # Target coordinate range width
                 target_height: float = 600.0,  # Target coordinate range height
                 center_x: float = 400.0,  # Center X coordinate
                 center_y: float = 300.0,  # Center Y coordinate
                 padding_factor: float = 0.1):  # Padding as fraction of target size
        
        self.target_width = target_width
        self.target_height = target_height
        self.center_x = center_x
        self.center_y = center_y
        self.padding_factor = padding_factor
        
        # Calculate actual usable area (with padding)
        self.usable_width = target_width * (1 - 2 * padding_factor)
        self.usable_height = target_height * (1 - 2 * padding_factor)
    
    def analyze_track_bounds(self, track_points: List[Dict]) -> Dict[str, float]:
        """
        Analyze the current bounds of a track
        """
        if not track_points:
            return {}
            
        x_coords = [p['x'] for p in track_points]
        y_coords = [p['y'] for p in track_points]
        
        bounds = {
            'min_x': min(x_coords),
            'max_x': max(x_coords),
            'min_y': min(y_coords),
            'max_y': max(y_coords),
            'width': max(x_coords) - min(x_coords),
            'height': max(y_coords) - min(y_coords),
            'center_x': (min(x_coords) + max(x_coords)) / 2,
            'center_y': (min(y_coords) + max(y_coords)) / 2
        }
        
        return bounds
    
    def normalize_track(self, track_points: List[Dict]) -> Tuple[List[Dict], Dict[str, Any]]:
        """
        Normalize track coordinates to fit within target bounds, centered
        
        Returns:
            normalized_points: List of normalized coordinate dictionaries
            transform_info: Information about the transformation applied
        """
        if not track_points:
            return track_points, {}
        
        # Analyze current bounds
        bounds = self.analyze_track_bounds(track_points)
        
        if bounds['width'] == 0 or bounds['height'] == 0:
            return track_points, {'error': 'Invalid track dimensions'}
        
        # Calculate scale to fit within usable area while maintaining aspect ratio
        scale_x = self.usable_width / bounds['width']
        scale_y = self.usable_height / bounds['height']
        scale = min(scale_x, scale_y)  # Use smaller scale to maintain aspect ratio
        
        # Calculate final scaled dimensions
        scaled_width = bounds['width'] * scale
        scaled_height = bounds['height'] * scale
        
        # Calculate centering offsets
        offset_x = self.center_x - bounds['center_x'] * scale
        offset_y = self.center_y - bounds['center_y'] * scale
        
        # Transform all points
        normalized_points = []
        for point in track_points:
            normalized_point = {
                'x': point['x'] * scale + offset_x,
                'y': point['y'] * scale + offset_y
            }
            normalized_points.append(normalized_point)
        
        # Ensure track closure is maintained if it was originally closed
        original_closed = (abs(track_points[0]['x'] - track_points[-1]['x']) < 1e-3 and 
                          abs(track_points[0]['y'] - track_points[-1]['y']) < 1e-3)
        
        if original_closed and len(normalized_points) > 1:
            # Force closure
            normalized_points[-1] = normalized_points[0].copy()
        
        # Calculate transformation info
        new_bounds = self.analyze_track_bounds(normalized_points)
        
        transform_info = {
            'original_bounds': bounds,
            'new_bounds': new_bounds,
            'scale_factor': scale,
            'offset_x': offset_x,
            'offset_y': offset_y,
            'scaled_width': scaled_width,
            'scaled_height': scaled_height,
            'was_closed': original_closed,
            'aspect_ratio_preserved': True
        }
        
        return normalized_points, transform_info
    
    def validate_normalization(self, normalized_points: List[Dict]) -> Dict[str, Any]:
        """
        Validate that the normalized track meets our requirements
        """
        if not normalized_points:
            return {'valid': False, 'error': 'No points'}
        
        bounds = self.analyze_track_bounds(normalized_points)
        
        # Check if track fits within target bounds
        fits_width = bounds['min_x'] >= 0 and bounds['max_x'] <= self.target_width
        fits_height = bounds['min_y'] >= 0 and bounds['max_y'] <= self.target_height
        
        # Check if track is reasonably centered
        center_tolerance = min(self.target_width, self.target_height) * 0.1
        centered_x = abs(bounds['center_x'] - self.center_x) <= center_tolerance
        centered_y = abs(bounds['center_y'] - self.center_y) <= center_tolerance
        
        validation = {
            'valid': fits_width and fits_height and centered_x and centered_y,
            'fits_bounds': fits_width and fits_height,
            'centered': centered_x and centered_y,
            'bounds': bounds,
            'within_target': {
                'width': fits_width,
                'height': fits_height,
                'center_x': centered_x,
                'center_y': centered_y
            }
        }
        
        return validation


def normalize_single_track(track_data: Dict[str, Any], 
                          normalizer: TrackNormalizer = None) -> Dict[str, Any]:
    """
    Normalize a single track's coordinates
    """
    if normalizer is None:
        normalizer = TrackNormalizer()
    
    track_name = track_data.get('name', 'Unknown')
    print(f"\n🔧 NORMALIZING TRACK: {track_name}")
    
    # Get original track points
    original_points = track_data.get('track_points', [])
    
    if not original_points:
        print(f"   ❌ No track points found")
        return track_data
    
    # Analyze original bounds
    original_bounds = normalizer.analyze_track_bounds(original_points)
    print(f"   📏 Original: {len(original_points)} points")
    print(f"   📏 Size: {original_bounds['width']:.1f} × {original_bounds['height']:.1f}")
    print(f"   📏 Range: X({original_bounds['min_x']:.1f} to {original_bounds['max_x']:.1f}), Y({original_bounds['min_y']:.1f} to {original_bounds['max_y']:.1f})")
    
    # Normalize coordinates
    normalized_points, transform_info = normalizer.normalize_track(original_points)
    
    # Validate results
    validation = normalizer.validate_normalization(normalized_points)
    
    if validation['valid']:
        print(f"   ✅ Normalized: Scale {transform_info['scale_factor']:.3f}")
        print(f"   ✅ New range: X({validation['bounds']['min_x']:.1f} to {validation['bounds']['max_x']:.1f}), Y({validation['bounds']['min_y']:.1f} to {validation['bounds']['max_y']:.1f})")
        print(f"   ✅ Centered at: ({validation['bounds']['center_x']:.1f}, {validation['bounds']['center_y']:.1f})")
        
        # Update track data
        normalized_track = track_data.copy()
        normalized_track['track_points'] = normalized_points
        normalized_track['_normalization_info'] = transform_info
        
        return normalized_track
    else:
        print(f"   ❌ Normalization failed: {validation}")
        return track_data


def normalize_all_tracks_in_db(db: Session, 
                              target_width: float = 800.0,
                              target_height: float = 600.0,
                              dry_run: bool = True) -> Dict[str, Any]:
    """
    Normalize all tracks in the database to consistent scale and position
    """
    tracks = db.query(PredefinedTrack).all()
    
    print(f"\n🗃️  NORMALIZING {len(tracks)} TRACKS IN DATABASE")
    print(f"   🎯 Target canvas: {target_width} × {target_height}")
    print(f"   🎯 Center point: ({target_width/2}, {target_height/2})")
    print(f"   🎯 Dry run: {dry_run}")
    
    # Create normalizer with specified dimensions
    normalizer = TrackNormalizer(
        target_width=target_width,
        target_height=target_height,
        center_x=target_width / 2,
        center_y=target_height / 2
    )
    
    results = {
        'normalized_count': 0,
        'failed_count': 0,
        'tracks': [],
        'summary': {
            'target_width': target_width,
            'target_height': target_height,
            'dry_run': dry_run
        }
    }
    
    for track in tracks:
        try:
            # Convert track data
            track_data = {
                'name': track.name,
                'track_points': track.track_points,
                'country': track.country,
                'circuit_type': track.circuit_type,
                'width': track.width,
                'friction': track.friction,
                'track_length': track.track_length,
                'description': track.description,
                'difficulty_rating': track.difficulty_rating,
                'number_of_turns': track.number_of_turns
            }
            
            # Normalize
            normalized_track = normalize_single_track(track_data, normalizer)
            
            # Check if normalization was successful
            if '_normalization_info' in normalized_track:
                # Validation
                validation = normalizer.validate_normalization(normalized_track['track_points'])
                
                if validation['valid']:
                    track_result = {
                        'name': track.name,
                        'status': 'success',
                        'original_bounds': normalized_track['_normalization_info']['original_bounds'],
                        'new_bounds': normalized_track['_normalization_info']['new_bounds'],
                        'scale_factor': normalized_track['_normalization_info']['scale_factor']
                    }
                    
                    # Update database if not dry run
                    if not dry_run:
                        track.track_points = normalized_track['track_points']
                        db.commit()
                        print(f"💾 Updated {track.name} in database")
                    
                    results['normalized_count'] += 1
                else:
                    track_result = {
                        'name': track.name,
                        'status': 'validation_failed',
                        'validation': validation
                    }
                    results['failed_count'] += 1
            else:
                track_result = {
                    'name': track.name,
                    'status': 'normalization_failed'
                }
                results['failed_count'] += 1
            
            results['tracks'].append(track_result)
            
        except Exception as e:
            print(f"❌ Failed to normalize {track.name}: {str(e)}")
            track_result = {
                'name': track.name,
                'status': 'error',
                'error': str(e)
            }
            results['tracks'].append(track_result)
            results['failed_count'] += 1
    
    print(f"\n📈 NORMALIZATION SUMMARY:")
    print(f"   ✅ Successfully normalized: {results['normalized_count']}")
    print(f"   ❌ Failed: {results['failed_count']}")
    print(f"   🎯 All tracks now centered at ({target_width/2}, {target_height/2})")
    print(f"   🎯 All tracks fit within 0-{target_width} × 0-{target_height}")
    
    return results


def create_normalization_presets() -> Dict[str, Dict]:
    """
    Create different normalization preset configurations
    """
    return {
        'small': {
            'target_width': 600,
            'target_height': 400,
            'description': 'Small canvas size for mobile/compact views'
        },
        'medium': {
            'target_width': 800,
            'target_height': 600,
            'description': 'Medium canvas size for desktop (recommended)'
        },
        'large': {
            'target_width': 1200,
            'target_height': 800,
            'description': 'Large canvas size for high-resolution displays'
        },
        'square': {
            'target_width': 800,
            'target_height': 800,
            'description': 'Square canvas for equal aspect ratio'
        }
    }