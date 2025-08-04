"""
Advanced Aerodynamic Model with Speed-Dependent Coefficients
Based on Oxford Research Paper aerodynamic maps
"""
import numpy as np
from scipy.interpolate import interp1d
from typing import Tuple, NamedTuple


class AerodynamicCoefficients(NamedTuple):
    """Container for aerodynamic coefficient data"""
    drag_coefficient: float
    lift_coefficient: float
    center_of_pressure: float  # Distance from front axle in meters


class AerodynamicModel:
    """
    Advanced aerodynamic model implementing speed-dependent coefficients
    based on Oxford research paper Figure 4 data
    """
    
    def __init__(self):
        """Initialize with research paper aerodynamic maps"""
        
        # Research paper data - Figure 4: Aerodynamic Maps
        self.speed_points = np.array([0, 20, 40, 60, 80, 100])  # m/s
        self.drag_coefficients = np.array([1.0, 1.2, 1.4, 1.6, 1.8, 2.0])
        self.lift_coefficients = np.array([0.5, 1.5, 2.5, 3.2, 3.7, 4.0])
        self.center_of_pressure = np.array([2.5, 2.6, 2.7, 2.8, 2.9, 3.0])  # meters from front axle
        
        # Create interpolation functions for smooth coefficient variation
        self.drag_interpolator = interp1d(
            self.speed_points, self.drag_coefficients, 
            kind='cubic', bounds_error=False, fill_value='extrapolate'
        )
        
        self.lift_interpolator = interp1d(
            self.speed_points, self.lift_coefficients,
            kind='cubic', bounds_error=False, fill_value='extrapolate'
        )
        
        self.cop_interpolator = interp1d(
            self.speed_points, self.center_of_pressure,
            kind='cubic', bounds_error=False, fill_value='extrapolate'
        )
        
        # Physical constants
        self.air_density = 1.225  # kg/m³ at standard conditions
        
    def get_coefficients(self, speed: float) -> AerodynamicCoefficients:
        """
        Get speed-dependent aerodynamic coefficients
        
        Args:
            speed: Vehicle speed in m/s
            
        Returns:
            AerodynamicCoefficients with CD(u), CL(u), and center of pressure
        """
        # Ensure speed is within reasonable bounds
        speed = max(0.0, min(speed, 120.0))  # Clamp to 0-120 m/s
        
        drag_coeff = float(self.drag_interpolator(speed))
        lift_coeff = float(self.lift_interpolator(speed))
        cop = float(self.cop_interpolator(speed))
        
        # Ensure coefficients are physically reasonable
        drag_coeff = max(0.3, min(drag_coeff, 3.0))
        lift_coeff = max(0.5, min(lift_coeff, 8.0))
        cop = max(2.0, min(cop, 3.5))
        
        return AerodynamicCoefficients(
            drag_coefficient=drag_coeff,
            lift_coefficient=lift_coeff,
            center_of_pressure=cop
        )
    
    def calculate_aerodynamic_forces(self, speed: float, frontal_area: float, 
                                   base_drag_coeff: float = None, 
                                   base_lift_coeff: float = None) -> Tuple[float, float]:
        """
        Calculate aerodynamic forces with speed-dependent coefficients
        
        Args:
            speed: Vehicle speed in m/s
            frontal_area: Vehicle frontal area in m²
            base_drag_coeff: Optional base drag coefficient modifier
            base_lift_coeff: Optional base lift coefficient modifier
            
        Returns:
            Tuple of (drag_force, downforce) in Newtons
        """
        # Get speed-dependent coefficients
        coeffs = self.get_coefficients(speed)
        
        # Apply base coefficient modifiers if provided (for car customization)
        if base_drag_coeff is not None:
            # Scale the speed-dependent coefficient by the base coefficient ratio
            drag_coeff = coeffs.drag_coefficient * (base_drag_coeff / 1.0)  # 1.0 is reference
        else:
            drag_coeff = coeffs.drag_coefficient
            
        if base_lift_coeff is not None:
            lift_coeff = coeffs.lift_coefficient * (base_lift_coeff / 3.0)  # 3.0 is reference
        else:
            lift_coeff = coeffs.lift_coefficient
        
        # Calculate forces: F = 0.5 * ρ * v² * C * A
        dynamic_pressure = 0.5 * self.air_density * (speed ** 2) * frontal_area
        
        drag_force = dynamic_pressure * drag_coeff
        downforce = dynamic_pressure * lift_coeff
        
        return drag_force, downforce
    
    def calculate_drag_limited_speed(self, available_force: float, frontal_area: float,
                                   base_drag_coeff: float = None) -> float:
        """
        Calculate maximum speed limited by aerodynamic drag
        
        Args:
            available_force: Available driving force in Newtons
            frontal_area: Vehicle frontal area in m²
            base_drag_coeff: Optional base drag coefficient modifier
            
        Returns:
            Maximum speed in m/s where driving force equals drag force
        """
        # Iterative solution since drag coefficient depends on speed
        speed_estimate = 50.0  # Initial guess
        
        for _ in range(10):  # Iterate to convergence
            drag_force, _ = self.calculate_aerodynamic_forces(
                speed_estimate, frontal_area, base_drag_coeff
            )
            
            if drag_force <= 0:
                break
                
            # Update speed estimate: F_drive = F_drag
            # F_drag = 0.5 * ρ * v² * CD * A
            # v = sqrt(2 * F_drive / (ρ * CD * A))
            coeffs = self.get_coefficients(speed_estimate)
            drag_coeff = coeffs.drag_coefficient
            
            if base_drag_coeff is not None:
                drag_coeff *= (base_drag_coeff / 1.0)
            
            new_speed = np.sqrt(2 * available_force / (self.air_density * drag_coeff * frontal_area))
            
            # Convergence check
            if abs(new_speed - speed_estimate) < 0.1:
                break
                
            speed_estimate = new_speed
        
        return max(10.0, min(speed_estimate, 120.0))  # Reasonable bounds
    
    def get_coefficient_info(self, speed: float) -> dict:
        """
        Get detailed coefficient information for debugging/analysis
        
        Args:
            speed: Vehicle speed in m/s
            
        Returns:
            Dictionary with coefficient details
        """
        coeffs = self.get_coefficients(speed)
        
        return {
            "speed_ms": speed,
            "speed_kmh": speed * 3.6,
            "drag_coefficient": coeffs.drag_coefficient,
            "lift_coefficient": coeffs.lift_coefficient,
            "center_of_pressure_m": coeffs.center_of_pressure,
            "drag_vs_baseline": coeffs.drag_coefficient / 1.0,  # vs speed=0 baseline
            "lift_vs_baseline": coeffs.lift_coefficient / 0.5,  # vs speed=0 baseline
        }


# Global instance for easy access
aerodynamic_model = AerodynamicModel()


def get_speed_dependent_coefficients(speed: float) -> AerodynamicCoefficients:
    """Convenience function to get coefficients"""
    return aerodynamic_model.get_coefficients(speed)


def calculate_aero_forces(speed: float, frontal_area: float, 
                         base_drag_coeff: float = None, 
                         base_lift_coeff: float = None) -> Tuple[float, float]:
    """Convenience function to calculate aerodynamic forces"""
    return aerodynamic_model.calculate_aerodynamic_forces(
        speed, frontal_area, base_drag_coeff, base_lift_coeff
    )
"""
Advanced Aerodynamic Model with Speed-Dependent Coefficients
Based on Oxford Research Paper aerodynamic maps
"""
import numpy as np
from scipy.interpolate import interp1d
from typing import Tuple, NamedTuple


class AerodynamicCoefficients(NamedTuple):
    """Container for aerodynamic coefficient data"""
    drag_coefficient: float
    lift_coefficient: float
    center_of_pressure: float  # Distance from front axle in meters


class AerodynamicModel:
    """
    Advanced aerodynamic model implementing speed-dependent coefficients
    based on Oxford research paper Figure 4 data
    """
    
    def __init__(self):
        """Initialize with research paper aerodynamic maps"""
        
        # Research paper data - Figure 4: Aerodynamic Maps
        self.speed_points = np.array([0, 20, 40, 60, 80, 100])  # m/s
        self.drag_coefficients = np.array([1.0, 1.2, 1.4, 1.6, 1.8, 2.0])
        self.lift_coefficients = np.array([0.5, 1.5, 2.5, 3.2, 3.7, 4.0])
        self.center_of_pressure = np.array([2.5, 2.6, 2.7, 2.8, 2.9, 3.0])  # meters from front axle
        
        # Create interpolation functions for smooth coefficient variation
        self.drag_interpolator = interp1d(
            self.speed_points, self.drag_coefficients, 
            kind='cubic', bounds_error=False, fill_value='extrapolate'
        )
        
        self.lift_interpolator = interp1d(
            self.speed_points, self.lift_coefficients,
            kind='cubic', bounds_error=False, fill_value='extrapolate'
        )
        
        self.cop_interpolator = interp1d(
            self.speed_points, self.center_of_pressure,
            kind='cubic', bounds_error=False, fill_value='extrapolate'
        )
        
        # Physical constants
        self.air_density = 1.225  # kg/m³ at standard conditions
        
    def get_coefficients(self, speed: float) -> AerodynamicCoefficients:
        """
        Get speed-dependent aerodynamic coefficients
        
        Args:
            speed: Vehicle speed in m/s
            
        Returns:
            AerodynamicCoefficients with CD(u), CL(u), and center of pressure
        """
        # Ensure speed is within reasonable bounds
        speed = max(0.0, min(speed, 120.0))  # Clamp to 0-120 m/s
        
        drag_coeff = float(self.drag_interpolator(speed))
        lift_coeff = float(self.lift_interpolator(speed))
        cop = float(self.cop_interpolator(speed))
        
        # Ensure coefficients are physically reasonable
        drag_coeff = max(0.3, min(drag_coeff, 3.0))
        lift_coeff = max(0.5, min(lift_coeff, 8.0))
        cop = max(2.0, min(cop, 3.5))
        
        return AerodynamicCoefficients(
            drag_coefficient=drag_coeff,
            lift_coefficient=lift_coeff,
            center_of_pressure=cop
        )
    
    def calculate_aerodynamic_forces(self, speed: float, frontal_area: float, 
                                   base_drag_coeff: float = None, 
                                   base_lift_coeff: float = None) -> Tuple[float, float]:
        """
        Calculate aerodynamic forces with speed-dependent coefficients
        
        Args:
            speed: Vehicle speed in m/s
            frontal_area: Vehicle frontal area in m²
            base_drag_coeff: Optional base drag coefficient modifier
            base_lift_coeff: Optional base lift coefficient modifier
            
        Returns:
            Tuple of (drag_force, downforce) in Newtons
        """
        # Get speed-dependent coefficients
        coeffs = self.get_coefficients(speed)
        
        # Apply base coefficient modifiers if provided (for car customization)
        if base_drag_coeff is not None:
            # Scale the speed-dependent coefficient by the base coefficient ratio
            drag_coeff = coeffs.drag_coefficient * (base_drag_coeff / 1.0)  # 1.0 is reference
        else:
            drag_coeff = coeffs.drag_coefficient
            
        if base_lift_coeff is not None:
            lift_coeff = coeffs.lift_coefficient * (base_lift_coeff / 3.0)  # 3.0 is reference
        else:
            lift_coeff = coeffs.lift_coefficient
        
        # Calculate forces: F = 0.5 * ρ * v² * C * A
        dynamic_pressure = 0.5 * self.air_density * (speed ** 2) * frontal_area
        
        drag_force = dynamic_pressure * drag_coeff
        downforce = dynamic_pressure * lift_coeff
        
        return drag_force, downforce
    
    def calculate_drag_limited_speed(self, available_force: float, frontal_area: float,
                                   base_drag_coeff: float = None) -> float:
        """
        Calculate maximum speed limited by aerodynamic drag
        
        Args:
            available_force: Available driving force in Newtons
            frontal_area: Vehicle frontal area in m²
            base_drag_coeff: Optional base drag coefficient modifier
            
        Returns:
            Maximum speed in m/s where driving force equals drag force
        """
        # Iterative solution since drag coefficient depends on speed
        speed_estimate = 50.0  # Initial guess
        
        for _ in range(10):  # Iterate to convergence
            drag_force, _ = self.calculate_aerodynamic_forces(
                speed_estimate, frontal_area, base_drag_coeff
            )
            
            if drag_force <= 0:
                break
                
            # Update speed estimate: F_drive = F_drag
            # F_drag = 0.5 * ρ * v² * CD * A
            # v = sqrt(2 * F_drive / (ρ * CD * A))
            coeffs = self.get_coefficients(speed_estimate)
            drag_coeff = coeffs.drag_coefficient
            
            if base_drag_coeff is not None:
                drag_coeff *= (base_drag_coeff / 1.0)
            
            new_speed = np.sqrt(2 * available_force / (self.air_density * drag_coeff * frontal_area))
            
            # Convergence check
            if abs(new_speed - speed_estimate) < 0.1:
                break
                
            speed_estimate = new_speed
        
        return max(10.0, min(speed_estimate, 120.0))  # Reasonable bounds
    
    def get_coefficient_info(self, speed: float) -> dict:
        """
        Get detailed coefficient information for debugging/analysis
        
        Args:
            speed: Vehicle speed in m/s
            
        Returns:
            Dictionary with coefficient details
        """
        coeffs = self.get_coefficients(speed)
        
        return {
            "speed_ms": speed,
            "speed_kmh": speed * 3.6,
            "drag_coefficient": coeffs.drag_coefficient,
            "lift_coefficient": coeffs.lift_coefficient,
            "center_of_pressure_m": coeffs.center_of_pressure,
            "drag_vs_baseline": coeffs.drag_coefficient / 1.0,  # vs speed=0 baseline
            "lift_vs_baseline": coeffs.lift_coefficient / 0.5,  # vs speed=0 baseline
        }


# Global instance for easy access
aerodynamic_model = AerodynamicModel()


def get_speed_dependent_coefficients(speed: float) -> AerodynamicCoefficients:
    """Convenience function to get coefficients"""
    return aerodynamic_model.get_coefficients(speed)


def calculate_aero_forces(speed: float, frontal_area: float, 
                         base_drag_coeff: float = None, 
                         base_lift_coeff: float = None) -> Tuple[float, float]:
    """Convenience function to calculate aerodynamic forces"""
    return aerodynamic_model.calculate_aerodynamic_forces(
        speed, frontal_area, base_drag_coeff, base_lift_coeff
    )