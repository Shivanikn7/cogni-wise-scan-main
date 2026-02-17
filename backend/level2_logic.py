import random
import json

def generate_synthetic_data(age_group):
    """
    Generates synthetic data for Level-2 assessments based on age group.
    Returns a dictionary of detailed metrics for the new gamified tests.
    """
    data = {}
    
    # 30% chance of generating "high risk" data for testing purposes
    is_risk = random.random() < 0.3
    
    if age_group == "child":
        # ASD-focused metrics for 3 games:
        # 1. Face vs Toy (Gaze)
        # 2. Emotion Balloon Pop (Emotion)
        # 3. Sensory Maze (Sensory)
        
        if is_risk:
            # High Risk Profile
            fixation_face_pct = random.uniform(0.1, 0.3) # Low interest in face
            gaze_stability = random.uniform(0.2, 0.5) # Unstable gaze
            emotion_accuracy = random.uniform(0.3, 0.6) # Poor emotion rec
            sensory_overload_stops = random.randint(5, 12) # Many stops due to overwhelm
            maze_completion_time = random.uniform(60, 120) # Slow
        else:
            # Low Risk Profile
            fixation_face_pct = random.uniform(0.6, 0.9)
            gaze_stability = random.uniform(0.7, 1.0)
            emotion_accuracy = random.uniform(0.8, 1.0)
            sensory_overload_stops = random.randint(0, 3)
            maze_completion_time = random.uniform(30, 50)
            
        data = {
            "fixation_face_pct": round(fixation_face_pct, 2),
            "gaze_stability": round(gaze_stability, 2),
            "emotion_accuracy": round(emotion_accuracy, 2),
            "sensory_overload_stops": sensory_overload_stops,
            "maze_completion_time": round(maze_completion_time, 2)
        }
        
    elif age_group == "adult":
        # ADHD + ASD metrics for 3 games:
        # 1. High-Speed CPT (Reaction)
        # 2. Anti-Saccade Pro (Inhibition)
        # 3. Virtual Office (Executive)
        
        if is_risk:
            rt_variability = random.uniform(150, 300) # High variability
            omission_errors = random.randint(3, 8)
            commission_errors = random.randint(3, 8)
            anti_saccade_error_rate = random.uniform(0.4, 0.7) # Can't look away
            executive_task_switching_cost = random.uniform(1000, 2000) # Slow switching
            distraction_fixation_pct = random.uniform(0.4, 0.7) # Easily distracted
        else:
            rt_variability = random.uniform(20, 80)
            omission_errors = random.randint(0, 2)
            commission_errors = random.randint(0, 2)
            anti_saccade_error_rate = random.uniform(0.0, 0.2)
            executive_task_switching_cost = random.uniform(200, 500)
            distraction_fixation_pct = random.uniform(0.0, 0.2)
            
        data = {
            "rt_variability": round(rt_variability, 2),
            "omission_errors": omission_errors,
            "commission_errors": commission_errors,
            "anti_saccade_error_rate": round(anti_saccade_error_rate, 2),
            "executive_task_switching_cost": round(executive_task_switching_cost, 2),
            "distraction_fixation_pct": round(distraction_fixation_pct, 2)
        }
        
    elif age_group == "elderly":
        # Dementia metrics for 3 games:
        # 1. Memory Tray (Recall)
        # 2. Clock Construction (Visuospatial)
        # 3. Scene Understanding (Processing)
        
        if is_risk:
            memory_recall_accuracy = random.uniform(0.1, 0.4)
            clock_hand_placement_error = random.uniform(30, 90) # Degrees off
            scene_danger_detection_time = random.uniform(5.0, 10.0) # Slow
            irrelevant_fixations = random.randint(5, 15) # Looking at wrong things
        else:
            memory_recall_accuracy = random.uniform(0.7, 1.0)
            clock_hand_placement_error = random.uniform(0, 10)
            scene_danger_detection_time = random.uniform(0.5, 2.0)
            irrelevant_fixations = random.randint(0, 3)
            
        data = {
            "memory_recall_accuracy": round(memory_recall_accuracy, 2),
            "clock_hand_placement_error": round(clock_hand_placement_error, 2),
            "scene_danger_detection_time": round(scene_danger_detection_time, 2),
            "irrelevant_fixations": irrelevant_fixations
        }
        
    return data

def calculate_level2_score(age_group, metrics):
    """
    Calculates risk scores (0-1) and final risk percentage based on detailed metrics.
    """
    scores = {}
    final_risk = 0.0
    
    # --- HANDLING REAL GAME DATA ---
    if metrics.get("is_real_data"):
        # metrics contains game1, game2, game3 (normalized 0.0 to 1.0, where 1.0 is Perfect/Low Risk)
        # We need to convert these into Risk Scores (1.0 = High Risk, 0.0 = Low Risk)
        # Risk = 1.0 - Performance
        
        g1_perf = float(metrics.get("game1", 0))
        g2_perf = float(metrics.get("game2", 0))
        g3_perf = float(metrics.get("game3", 0))
        
        if age_group == "child":
            scores = {
                "social_attention": round(1.0 - g1_perf, 2),
                "emotion_recognition": round(1.0 - g2_perf, 2),
                "sensory_motor": round(1.0 - g3_perf, 2)
            }
            # Weighted: 40%, 30%, 30%
            avg_risk = (scores["social_attention"] * 0.4) + (scores["emotion_recognition"] * 0.3) + (scores["sensory_motor"] * 0.3)
            
        elif age_group == "adult":
             scores = {
                "attention_focus": round(1.0 - g1_perf, 2),
                "working_memory": round(1.0 - g2_perf, 2),
                "inhibition_control": round(1.0 - g3_perf, 2)
            }
            # Weighted: 35%, 35%, 30%
             avg_risk = (scores["attention_focus"] * 0.35) + (scores["working_memory"] * 0.35) + (scores["inhibition_control"] * 0.3)

        elif age_group == "elderly":
             scores = {
                "memory_recall": round(1.0 - g1_perf, 2),
                "visuospatial": round(1.0 - g2_perf, 2),
                "hazard_awareness": round(1.0 - g3_perf, 2)
            }
            # Weighted: 40%, 30%, 30%
             avg_risk = (scores["memory_recall"] * 0.4) + (scores["visuospatial"] * 0.3) + (scores["hazard_awareness"] * 0.3)
            
        final_risk = avg_risk
        
        # Ensure we don't break the float
        final_risk = max(0.0, min(1.0, final_risk))
        
        return {
            "domain_scores": scores,
            "final_risk_score": round(final_risk, 2),
            "final_risk_percent": round(final_risk * 100, 1)
        }

    # --- HANDLING SYNTHETIC DATA (Legacy/Fallback) ---
    if age_group == "child":
        # 1. Social Gaze Risk (Low face fixation = High Risk)
        face_pct = metrics.get("fixation_face_pct", 0.5)
        social_risk = 1.0 - min(1.0, face_pct / 0.6) # Normalize: 0.6+ is good
        
        # 2. Emotion Risk (Low accuracy = High Risk)
        emo_acc = metrics.get("emotion_accuracy", 0.5)
        emotion_risk = 1.0 - emo_acc
        
        # 3. Sensory Risk (More stops = High Risk)
        stops = metrics.get("sensory_overload_stops", 0)
        sensory_risk = min(1.0, stops / 10.0)
        
        scores = {
            "social_attention": round(social_risk, 2),
            "emotion_understanding": round(emotion_risk, 2),
            "sensory_processing": round(sensory_risk, 2)
        }
        
        final_risk = (social_risk * 0.4) + (emotion_risk * 0.3) + (sensory_risk * 0.3)
        
    elif age_group == "adult":
        # 1. Attention Risk (High RT var = High Risk)
        rt_var = metrics.get("rt_variability", 0)
        # Tuned: RT Var 150ms -> 66% Risk (was 50%)
        attention_risk = min(1.0, max(0.0, (rt_var - 50) / 150))
        
        # 2. Inhibition Risk (High anti-saccade error = High Risk)
        anti_err = metrics.get("anti_saccade_error_rate", 0)
        inhibition_risk = anti_err
        
        # 3. Executive Risk (High switching cost + distraction = High Risk)
        switch_cost = metrics.get("executive_task_switching_cost", 0)
        dist_pct = metrics.get("distraction_fixation_pct", 0)
        # Tuned: Switch Cost 1000ms -> 100% Risk (was 66%)
        exec_risk = (min(1.0, switch_cost / 1000) + dist_pct) / 2
        
        scores = {
            "attention_regulation": round(attention_risk, 2),
            "inhibitory_control": round(inhibition_risk, 2),
            "executive_function": round(exec_risk, 2)
        }
        
        final_risk = (attention_risk * 0.35) + (inhibition_risk * 0.35) + (exec_risk * 0.3)
        
    elif age_group == "elderly":
        # 1. Memory Risk (Low accuracy = High Risk)
        mem_acc = metrics.get("memory_recall_accuracy", 0.5)
        memory_risk = 1.0 - mem_acc
        
        # 2. Visuospatial Risk (High clock error = High Risk)
        clock_err = metrics.get("clock_hand_placement_error", 0)
        visuo_risk = min(1.0, clock_err / 45.0)
        
        # 3. Processing Risk (Slow detection + irrelevant fixations = High Risk)
        detect_time = metrics.get("scene_danger_detection_time", 0)
        irr_fix = metrics.get("irrelevant_fixations", 0)
        processing_risk = (min(1.0, detect_time / 5.0) + min(1.0, irr_fix / 10.0)) / 2
        
        scores = {
            "memory_recall": round(memory_risk, 2),
            "visuospatial": round(visuo_risk, 2),
            "processing_speed": round(processing_risk, 2)
        }
        
        final_risk = (memory_risk * 0.4) + (visuo_risk * 0.3) + (processing_risk * 0.3)
        
    return {
        "domain_scores": scores,
        "final_risk_score": round(final_risk, 2),
        "final_risk_percent": round(final_risk * 100, 1)
    }
