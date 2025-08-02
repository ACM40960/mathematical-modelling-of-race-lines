import numpy as np
from typing import List, Dict, Any

def get_sample_f1_tracks() -> List[Dict[str, Any]]:
    """
    Returns accurate track point data for famous F1 circuits
    Track points are based on real circuit layouts and scaled for optimal canvas display
    Coordinate system: 0-1000 range for both X and Y for consistent scaling
    """
    tracks = []

    # Monaco Grand Prix Circuit - The most famous street circuit (3.337 km, 19 corners)
    # Characteristics: Tight, narrow, Casino Square, Fairmont Hairpin, tunnel, swimming pool section
    monaco_points = [
        {'x': 100, 'y': 500},   # Start/Finish line
        {'x': 120, 'y': 520},   # Sainte Dévote (Turn 1)
        {'x': 150, 'y': 550},   # Uphill towards Casino
        {'x': 200, 'y': 580},   # Beau Rivage
        {'x': 280, 'y': 600},   # Massenet (Turn 3)
        {'x': 350, 'y': 610},   # Casino Square (Turn 4)
        {'x': 420, 'y': 600},   # Mirabeau (Turn 5)
        {'x': 480, 'y': 580},   # Fairmont Hairpin (Turn 6) - slowest corner
        {'x': 490, 'y': 520},   
        {'x': 480, 'y': 460},   # Portier (Turn 8)
        {'x': 460, 'y': 420},   # Tunnel entrance
        {'x': 420, 'y': 400},   # Through tunnel
        {'x': 380, 'y': 380},   # Tunnel exit
        {'x': 330, 'y': 360},   # Nouvelle Chicane (Turn 10)
        {'x': 300, 'y': 340},   
        {'x': 250, 'y': 320},   # Tabac (Turn 12)
        {'x': 200, 'y': 300},   # Swimming Pool section
        {'x': 150, 'y': 280},   # Piscine (Turn 13-14)
        {'x': 120, 'y': 250},   
        {'x': 100, 'y': 220},   # La Rascasse (Turn 16)
        {'x': 80, 'y': 200},    
        {'x': 70, 'y': 250},    # Anthony Noghès (Turn 17)
        {'x': 75, 'y': 350},
        {'x': 85, 'y': 450},    # Back to start/finish
        {'x': 100, 'y': 500}    # Complete the circuit
    ]

    tracks.append({
        "name": "Monaco Grand Prix",
        "country": "Monaco",
        "circuit_type": "Street Circuit",
        "track_points": monaco_points,
        "width": 12.0,
        "friction": 0.8,
        "track_length": 3337,  # meters
        "description": "The most prestigious street circuit in Formula 1, featuring tight corners and elevation changes through the streets of Monte Carlo.",
        "preview_image_url": None,
        "difficulty_rating": 9.5,
        "elevation_change": 42.0,
        "number_of_turns": 19,
        "fastest_lap_time": 72.909,  # 1:12.909 in seconds
        "year_built": 1929,
        "is_active": True
    })

    # Baku City Circuit - Modern street circuit (6.003 km, 20 corners)
    # Ultra-detailed with 2.2km main straight and narrow old town sections
    baku_points = [
        # Start/Finish straight and Turn 1 complex
        {'x': 100, 'y': 500}, {'x': 105, 'y': 502}, {'x': 110, 'y': 504}, {'x': 115, 'y': 506},
        {'x': 120, 'y': 508}, {'x': 125, 'y': 510}, {'x': 130, 'y': 512}, {'x': 135, 'y': 514},
        {'x': 140, 'y': 516}, {'x': 145, 'y': 518}, {'x': 150, 'y': 520},
        
        # Turn 1 (90-degree right-hander)
        {'x': 155, 'y': 522}, {'x': 160, 'y': 524}, {'x': 165, 'y': 526}, {'x': 170, 'y': 528},
        {'x': 175, 'y': 530}, {'x': 180, 'y': 532}, {'x': 185, 'y': 534}, {'x': 190, 'y': 536},
        {'x': 195, 'y': 538}, {'x': 200, 'y': 540},
        
        # Turns 2-3 sequence
        {'x': 210, 'y': 542}, {'x': 220, 'y': 544}, {'x': 230, 'y': 546}, {'x': 240, 'y': 548},
        {'x': 250, 'y': 550}, {'x': 260, 'y': 552}, {'x': 270, 'y': 554}, {'x': 280, 'y': 556},
        {'x': 290, 'y': 558}, {'x': 300, 'y': 560}, {'x': 310, 'y': 562}, {'x': 320, 'y': 564},
        {'x': 330, 'y': 566}, {'x': 340, 'y': 568}, {'x': 350, 'y': 570}, {'x': 360, 'y': 572},
        {'x': 370, 'y': 574}, {'x': 380, 'y': 576}, {'x': 390, 'y': 578}, {'x': 400, 'y': 580},
        
        # Government buildings section (Turns 4-6)
        {'x': 410, 'y': 585}, {'x': 420, 'y': 590}, {'x': 430, 'y': 595}, {'x': 440, 'y': 600},
        {'x': 450, 'y': 605}, {'x': 460, 'y': 610}, {'x': 470, 'y': 615}, {'x': 480, 'y': 620},
        {'x': 490, 'y': 622}, {'x': 500, 'y': 624}, {'x': 510, 'y': 626}, {'x': 520, 'y': 628},
        {'x': 530, 'y': 630}, {'x': 540, 'y': 632}, {'x': 550, 'y': 634}, {'x': 560, 'y': 636},
        {'x': 570, 'y': 638}, {'x': 580, 'y': 640}, {'x': 590, 'y': 642}, {'x': 600, 'y': 644},
        
        # Entry to narrow old town section (Turns 7-8)
        {'x': 610, 'y': 646}, {'x': 620, 'y': 648}, {'x': 630, 'y': 649}, {'x': 640, 'y': 650},
        {'x': 650, 'y': 651}, {'x': 660, 'y': 652}, {'x': 670, 'y': 653}, {'x': 680, 'y': 654},
        {'x': 690, 'y': 655}, {'x': 700, 'y': 656}, {'x': 710, 'y': 657}, {'x': 720, 'y': 658},
        {'x': 730, 'y': 659}, {'x': 740, 'y': 660}, {'x': 750, 'y': 661}, {'x': 760, 'y': 662},
        
        # Narrow old town through castle walls (very technical section)
        {'x': 770, 'y': 661}, {'x': 780, 'y': 660}, {'x': 790, 'y': 658}, {'x': 800, 'y': 656},
        {'x': 810, 'y': 654}, {'x': 820, 'y': 652}, {'x': 825, 'y': 650}, {'x': 830, 'y': 645},
        {'x': 835, 'y': 640}, {'x': 840, 'y': 635}, {'x': 845, 'y': 630}, {'x': 850, 'y': 625},
        {'x': 855, 'y': 620}, {'x': 860, 'y': 615}, {'x': 865, 'y': 610}, {'x': 870, 'y': 605},
        {'x': 875, 'y': 600}, {'x': 880, 'y': 595}, {'x': 885, 'y': 590}, {'x': 890, 'y': 585},
        
        # Exit old town onto back straight (Turn 15)
        {'x': 895, 'y': 580}, {'x': 900, 'y': 575}, {'x': 905, 'y': 570}, {'x': 910, 'y': 565},
        {'x': 915, 'y': 560}, {'x': 920, 'y': 555}, {'x': 925, 'y': 550}, {'x': 930, 'y': 545},
        {'x': 935, 'y': 540}, {'x': 940, 'y': 535}, {'x': 945, 'y': 530}, {'x': 948, 'y': 525},
        {'x': 950, 'y': 520}, {'x': 951, 'y': 515}, {'x': 950, 'y': 510}, {'x': 948, 'y': 505},
        
        # Start of legendary 2.2km main straight (longest in F1)
        {'x': 945, 'y': 500}, {'x': 940, 'y': 495}, {'x': 935, 'y': 490}, {'x': 930, 'y': 485},
        {'x': 925, 'y': 480}, {'x': 920, 'y': 475}, {'x': 915, 'y': 470}, {'x': 910, 'y': 465},
        {'x': 905, 'y': 460}, {'x': 900, 'y': 455}, {'x': 895, 'y': 450}, {'x': 890, 'y': 445},
        {'x': 885, 'y': 440}, {'x': 880, 'y': 435}, {'x': 875, 'y': 430}, {'x': 870, 'y': 425},
        {'x': 865, 'y': 420}, {'x': 860, 'y': 415}, {'x': 855, 'y': 410}, {'x': 850, 'y': 405},
        {'x': 845, 'y': 400}, {'x': 840, 'y': 395}, {'x': 835, 'y': 390}, {'x': 830, 'y': 385},
        {'x': 825, 'y': 380}, {'x': 820, 'y': 375}, {'x': 815, 'y': 370}, {'x': 810, 'y': 365},
        {'x': 805, 'y': 360}, {'x': 800, 'y': 355}, {'x': 795, 'y': 350}, {'x': 790, 'y': 345},
        {'x': 785, 'y': 340}, {'x': 780, 'y': 335}, {'x': 775, 'y': 330}, {'x': 770, 'y': 325},
        {'x': 765, 'y': 320}, {'x': 760, 'y': 315}, {'x': 755, 'y': 310}, {'x': 750, 'y': 305},
        {'x': 745, 'y': 300}, {'x': 740, 'y': 295}, {'x': 735, 'y': 290}, {'x': 730, 'y': 285},
        {'x': 725, 'y': 280}, {'x': 720, 'y': 275}, {'x': 715, 'y': 270}, {'x': 710, 'y': 265},
        {'x': 705, 'y': 260}, {'x': 700, 'y': 255}, {'x': 695, 'y': 250}, {'x': 690, 'y': 245},
        {'x': 685, 'y': 240}, {'x': 680, 'y': 235}, {'x': 675, 'y': 230}, {'x': 670, 'y': 225},
        {'x': 665, 'y': 220}, {'x': 660, 'y': 215}, {'x': 655, 'y': 210}, {'x': 650, 'y': 205},
        {'x': 645, 'y': 200}, {'x': 640, 'y': 195}, {'x': 635, 'y': 190}, {'x': 630, 'y': 185},
        {'x': 625, 'y': 180}, {'x': 620, 'y': 175}, {'x': 615, 'y': 170}, {'x': 610, 'y': 165},
        {'x': 605, 'y': 160}, {'x': 600, 'y': 155}, {'x': 595, 'y': 150}, {'x': 590, 'y': 145},
        {'x': 585, 'y': 140}, {'x': 580, 'y': 135}, {'x': 575, 'y': 130}, {'x': 570, 'y': 125},
        {'x': 565, 'y': 120}, {'x': 560, 'y': 115}, {'x': 555, 'y': 110}, {'x': 550, 'y': 105},
        {'x': 545, 'y': 100}, {'x': 540, 'y': 95}, {'x': 535, 'y': 90}, {'x': 530, 'y': 85},
        {'x': 525, 'y': 80}, {'x': 520, 'y': 75}, {'x': 515, 'y': 70}, {'x': 510, 'y': 65},
        {'x': 505, 'y': 60}, {'x': 500, 'y': 55}, {'x': 495, 'y': 50}, {'x': 490, 'y': 45},
        
        # End of main straight - massive braking zone (Turn 16)
        {'x': 485, 'y': 40}, {'x': 480, 'y': 50}, {'x': 475, 'y': 60}, {'x': 470, 'y': 80},
        {'x': 465, 'y': 120}, {'x': 460, 'y': 160}, {'x': 455, 'y': 200}, {'x': 450, 'y': 240},
        {'x': 445, 'y': 280}, {'x': 440, 'y': 320}, {'x': 435, 'y': 340}, {'x': 430, 'y': 360},
        {'x': 425, 'y': 370}, {'x': 420, 'y': 380}, {'x': 415, 'y': 385}, {'x': 410, 'y': 390},
        {'x': 405, 'y': 395}, {'x': 400, 'y': 400}, {'x': 395, 'y': 405}, {'x': 390, 'y': 410},
        {'x': 385, 'y': 415}, {'x': 380, 'y': 420}, {'x': 375, 'y': 425}, {'x': 370, 'y': 430},
        {'x': 365, 'y': 435}, {'x': 360, 'y': 440}, {'x': 355, 'y': 445}, {'x': 350, 'y': 450},
        {'x': 345, 'y': 455}, {'x': 340, 'y': 460}, {'x': 335, 'y': 465}, {'x': 330, 'y': 470},
        {'x': 325, 'y': 475}, {'x': 320, 'y': 480}, {'x': 315, 'y': 485}, {'x': 310, 'y': 490},
        {'x': 305, 'y': 495}, {'x': 300, 'y': 500}, {'x': 295, 'y': 502}, {'x': 290, 'y': 504},
        {'x': 285, 'y': 506}, {'x': 280, 'y': 508}, {'x': 275, 'y': 510}, {'x': 270, 'y': 512},
        {'x': 265, 'y': 514}, {'x': 260, 'y': 516}, {'x': 255, 'y': 518}, {'x': 250, 'y': 520},
        {'x': 245, 'y': 518}, {'x': 240, 'y': 516}, {'x': 235, 'y': 514}, {'x': 230, 'y': 512},
        {'x': 225, 'y': 510}, {'x': 220, 'y': 508}, {'x': 215, 'y': 506}, {'x': 210, 'y': 504},
        {'x': 205, 'y': 502}, {'x': 200, 'y': 500}, {'x': 195, 'y': 498}, {'x': 190, 'y': 496},
        {'x': 185, 'y': 494}, {'x': 180, 'y': 492}, {'x': 175, 'y': 490}, {'x': 170, 'y': 488},
        {'x': 165, 'y': 486}, {'x': 160, 'y': 484}, {'x': 155, 'y': 482}, {'x': 150, 'y': 480},
        {'x': 145, 'y': 485}, {'x': 140, 'y': 490}, {'x': 135, 'y': 492}, {'x': 130, 'y': 494},
        {'x': 125, 'y': 496}, {'x': 120, 'y': 498}, {'x': 115, 'y': 499}, {'x': 110, 'y': 500},
        {'x': 105, 'y': 500}, {'x': 100, 'y': 500}  # Back to start/finish line
    ]

    tracks.append({
        "name": "Baku City Circuit",
        "country": "Azerbaijan", 
        "circuit_type": "Street Circuit",
        "track_points": baku_points,
        "width": 13.0,
        "friction": 0.75,
        "track_length": 6003,  # meters
        "description": "A thrilling street circuit featuring a mix of long straights and tight sections through Baku's historic old town.",
        "preview_image_url": None,
        "difficulty_rating": 8.0,
        "elevation_change": 15.0,
        "number_of_turns": 20,
        "fastest_lap_time": 103.009,  # 1:43.009 in seconds
        "year_built": 2016,
        "is_active": True
    })

    # Silverstone Circuit - Home of British GP (5.891 km, 18 corners)
    # Characteristics: High-speed, Maggotts-Becketts complex, fast flowing corners
    silverstone_points = [
        {'x': 100, 'y': 500},   # Start/Finish line
        {'x': 150, 'y': 520},   # Abbey (Turn 1)
        {'x': 200, 'y': 550},   # Farm Curve (Turn 2)
        {'x': 280, 'y': 580},   # Village (Turn 3)
        {'x': 380, 'y': 600},   # The Loop (Turn 4-5)
        {'x': 450, 'y': 620},   
        {'x': 520, 'y': 640},   # Aintree (Turn 6)
        {'x': 600, 'y': 650},   # Wellington Straight
        {'x': 700, 'y': 660},   
        {'x': 800, 'y': 650},   # Brooklands (Turn 7)
        {'x': 880, 'y': 620},   # Luffield (Turn 8-9)
        {'x': 920, 'y': 580},   
        {'x': 940, 'y': 520},   # Woodcote (Turn 10)
        {'x': 920, 'y': 460},   # Copse (Turn 11)
        {'x': 880, 'y': 420},   # Maggotts (Turn 12)
        {'x': 820, 'y': 380},   # Becketts (Turn 13-14) - famous complex
        {'x': 750, 'y': 350},   # Chapel (Turn 15)
        {'x': 650, 'y': 320},   # Hangar Straight
        {'x': 550, 'y': 300},   
        {'x': 450, 'y': 320},   # Stowe (Turn 16)
        {'x': 380, 'y': 350},   # Vale (Turn 17)
        {'x': 320, 'y': 400},   # Club (Turn 18)
        {'x': 280, 'y': 450},   
        {'x': 200, 'y': 480},   
        {'x': 100, 'y': 500}    # Back to start/finish
    ]

    tracks.append({
        "name": "Silverstone Circuit",
        "country": "United Kingdom",
        "circuit_type": "Permanent Circuit", 
        "track_points": silverstone_points,
        "width": 15.0,
        "friction": 0.85,
        "track_length": 5891,  # meters
        "description": "The home of British motorsport, featuring high-speed corners and the legendary Maggotts-Becketts complex.",
        "preview_image_url": None,
        "difficulty_rating": 8.5,
        "elevation_change": 20.0,
        "number_of_turns": 18,
        "fastest_lap_time": 87.097,  # 1:27.097 in seconds
        "year_built": 1948,
        "is_active": True
    })

    # Suzuka Circuit - Figure-8 layout (5.807 km, 18 corners)
    # Characteristics: Technical challenge, 130R corner, Spoon Curve, crossover bridge
    suzuka_points = [
        {'x': 100, 'y': 500},   # Start/Finish line
        {'x': 180, 'y': 520},   # Turn 1 (first corner)
        {'x': 260, 'y': 540},   # Turn 2 (S-curves)
        {'x': 340, 'y': 520},   # Turn 3 
        {'x': 420, 'y': 500},   # Turn 4
        {'x': 500, 'y': 480},   # Turn 5
        {'x': 580, 'y': 460},   # Turn 6
        {'x': 660, 'y': 440},   # Turn 7 (Dunlop Corner)
        {'x': 720, 'y': 400},   # Turn 8
        {'x': 780, 'y': 350},   # Turn 9 (Degner)
        {'x': 820, 'y': 280},   # Turn 10 (Degner 2)
        {'x': 840, 'y': 200},   # Turn 11 (Hairpin)
        {'x': 820, 'y': 120},   # Turn 12
        {'x': 760, 'y': 80},    # Turn 13 (Spoon Curve)
        {'x': 680, 'y': 60},    # Turn 14
        {'x': 600, 'y': 80},    # Turn 15
        {'x': 520, 'y': 120},   # Turn 16 (130R - famous high-speed corner)
        {'x': 420, 'y': 180},   # Turn 17 (Casio Triangle)
        {'x': 340, 'y': 240},   # Turn 18
        {'x': 280, 'y': 320},   # Back section
        {'x': 240, 'y': 400},   # Crossover bridge area
        {'x': 200, 'y': 460},   
        {'x': 100, 'y': 500}    # Complete figure-8
    ]

    tracks.append({
        "name": "Suzuka Circuit",
        "country": "Japan",
        "circuit_type": "Permanent Circuit",
        "track_points": suzuka_points,
        "width": 15.0,
        "friction": 0.88,
        "track_length": 5807,  # meters
        "description": "A challenging figure-8 circuit known for its technical complexity and the famous 130R corner.",
        "preview_image_url": None,
        "difficulty_rating": 9.0,
        "elevation_change": 40.0,
        "number_of_turns": 18,
        "fastest_lap_time": 90.983,  # 1:30.983 in seconds
        "year_built": 1962,
        "is_active": True
    })

    # Circuit de Spa-Francorchamps - The Ardennes classic (7.004 km, 19 corners)
    # Characteristics: Eau Rouge/Raidillon, long straights, elevation changes
    spa_points = [
        {'x': 100, 'y': 500},   # Start/Finish line
        {'x': 150, 'y': 480},   # La Source (Turn 1) - hairpin
        {'x': 200, 'y': 420},   # Raidillon approach
        {'x': 280, 'y': 380},   # Eau Rouge (Turn 2) - famous uphill left
        {'x': 360, 'y': 350},   # Raidillon (Turn 3) - uphill right
        {'x': 460, 'y': 340},   # Kemmel Straight
        {'x': 580, 'y': 330},   
        {'x': 700, 'y': 320},   # Les Combes (Turn 4-5)
        {'x': 780, 'y': 300},   
        {'x': 840, 'y': 260},   # Malmedy (Turn 6)
        {'x': 880, 'y': 200},   # Rivage (Turn 7)
        {'x': 900, 'y': 140},   # Pouhon (Turn 8) - fast left
        {'x': 880, 'y': 80},    # Fagnes (Turn 9)
        {'x': 820, 'y': 40},    # Campus (Turn 10-11)
        {'x': 740, 'y': 20},    
        {'x': 640, 'y': 30},    # Stavelot (Turn 12)
        {'x': 540, 'y': 60},    # Blanchimont (Turn 13) - high speed
        {'x': 440, 'y': 100},   
        {'x': 360, 'y': 160},   # Long back straight
        {'x': 300, 'y': 240},   
        {'x': 260, 'y': 340},   # Bus Stop chicane (Turn 14-16)
        {'x': 240, 'y': 420},   
        {'x': 180, 'y': 480},   
        {'x': 100, 'y': 500}    # Back to start/finish
    ]

    tracks.append({
        "name": "Circuit de Spa-Francorchamps",
        "country": "Belgium",
        "circuit_type": "Permanent Circuit",
        "track_points": spa_points,
        "width": 14.0,
        "friction": 0.82,
        "track_length": 7004,  # meters
        "description": "The legendary Ardennes circuit featuring the iconic Eau Rouge corner and dramatic elevation changes.",
        "preview_image_url": None,
        "difficulty_rating": 9.5,
        "elevation_change": 100.0,
        "number_of_turns": 19,
        "fastest_lap_time": 103.444,  # 1:43.444 in seconds  
        "year_built": 1921,
        "is_active": True
    })

    # Autodromo Nazionale Monza - Temple of Speed (5.793 km, 11 corners)
    # Characteristics: High speeds, long straights, chicanes, low downforce setup
    monza_points = [
        {'x': 100, 'y': 500},   # Start/Finish line
        {'x': 200, 'y': 520},   # Turn 1 (Rettifilo Tribune)
        {'x': 280, 'y': 540},   # Prima Variante chicane
        {'x': 340, 'y': 520},   # Turn 2
        {'x': 420, 'y': 500},   # Long straight towards Curva Grande
        {'x': 520, 'y': 480},   
        {'x': 640, 'y': 460},   # Curva Grande (Turn 3) - fast right
        {'x': 740, 'y': 440},   
        {'x': 820, 'y': 400},   # Variante della Roggia (Turn 4-5)
        {'x': 860, 'y': 350},   
        {'x': 880, 'y': 280},   # Lesmo 1 (Turn 6)
        {'x': 860, 'y': 220},   # Lesmo 2 (Turn 7)
        {'x': 820, 'y': 180},   
        {'x': 760, 'y': 160},   # Variante Ascari (Turn 8-9-10)
        {'x': 680, 'y': 140},   
        {'x': 600, 'y': 160},   
        {'x': 520, 'y': 180},   # Parabolica (Turn 11) - long right-hander
        {'x': 440, 'y': 220},   
        {'x': 380, 'y': 280},   
        {'x': 340, 'y': 360},   # Main straight - highest speeds in F1
        {'x': 320, 'y': 440},   
        {'x': 200, 'y': 480},   
        {'x': 100, 'y': 500}    # Complete the lap
    ]

    tracks.append({
        "name": "Autodromo Nazionale Monza", 
        "country": "Italy",
        "circuit_type": "Permanent Circuit",
        "track_points": monza_points,
        "width": 14.0,
        "friction": 0.86,
        "track_length": 5793,  # meters
        "description": "The Temple of Speed featuring long straights and chicanes, demanding maximum power and low aerodynamic drag.",
        "preview_image_url": None,
        "difficulty_rating": 6.5,
        "elevation_change": 25.0,
        "number_of_turns": 11,
        "fastest_lap_time": 81.046,  # 1:21.046 in seconds
        "year_built": 1922,
        "is_active": True
    })

    # Autodromo José Carlos Pace (Interlagos) - Brazilian GP (4.309 km, 15 corners)
    # Characteristics: Anti-clockwise, elevation changes, unpredictable weather
    interlagos_points = [
        {'x': 100, 'y': 500},   # Start/Finish line
        {'x': 120, 'y': 460},   # Senna S (Turn 1) - downhill right
        {'x': 160, 'y': 420},   # Turn 2 - uphill left
        {'x': 220, 'y': 400},   # Curva do Sol (Turn 3)
        {'x': 300, 'y': 380},   # Reta Oposta straight
        {'x': 400, 'y': 360},   
        {'x': 500, 'y': 340},   # Descida do Lago (Turn 4)
        {'x': 580, 'y': 300},   # Ferradura (Turn 5-6) - downhill
        {'x': 640, 'y': 240},   
        {'x': 680, 'y': 180},   # Laranja (Turn 7)
        {'x': 700, 'y': 120},   # Pinheirinho (Turn 8)
        {'x': 680, 'y': 60},    # Bico de Pato (Turn 9)
        {'x': 620, 'y': 20},    # Mergulho (Turn 10) - downhill
        {'x': 540, 'y': 40},    # Turn 11
        {'x': 460, 'y': 80},    # Subida dos Boxes (Turn 12) - uphill
        {'x': 380, 'y': 140},   # Turn 13
        {'x': 320, 'y': 220},   # Arquibancadas (Turn 14)
        {'x': 280, 'y': 320},   # Juncao (Turn 15) - back onto main straight
        {'x': 240, 'y': 420},   
        {'x': 180, 'y': 480},   
        {'x': 100, 'y': 500}    # Complete the circuit
    ]

    tracks.append({
        "name": "Autodromo José Carlos Pace (Interlagos)",
        "country": "Brazil",
        "circuit_type": "Permanent Circuit", 
        "track_points": interlagos_points,
        "width": 13.0,
        "friction": 0.80,
        "track_length": 4309,  # meters
        "description": "The historic Brazilian Grand Prix circuit featuring dramatic elevation changes and challenging corners in São Paulo.",
        "preview_image_url": None,
        "difficulty_rating": 8.5,
        "elevation_change": 50.0,
        "number_of_turns": 15,
        "fastest_lap_time": 70.540,  # 1:10.540 in seconds
        "year_built": 1940,
        "is_active": True
    })

    return tracks 