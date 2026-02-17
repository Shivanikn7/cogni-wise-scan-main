"""
Knowledge Base for CogniWise Scan Chatbot.
Contains structured information about symptoms, advice, and next steps
for ADHD, ASD, and Dementia across different age groups.
"""

KNOWLEDGE_BASE = {
    "adhd": {
        "description": "Attention Deficit Hyperactivity Disorder (ADHD) is a neurodevelopmental condition affecting both children and adults. It varies from person to person but typically involves persistent patterns of inattention, hyperactivity, and impulsivity.",
        "symptoms": {
            "child": [
                "Difficulty sustaining attention in tasks or play",
                "Does not seem to listen when spoken to directly",
                "Fails to finish schoolwork or chores",
                "Difficulty organizing tasks and activities",
                "Avoids tasks requiring sustained mental effort",
                "Fidgets with hands or feet or squirms in seat",
                "Runs about or climbs in inappropriate situations"
            ],
            "adult": [
                "Poor time management and problems prioritizing",
                "Frequent mood swings and irritability",
                "Difficulty coping with stress",
                "Impulsiveness in spending or decision making",
                "Restlessness and edginess",
                "Problems continuing and finishing tasks"
            ]
        },
        "advice": {
            "child": [
                "Establish a consistent daily routine.",
                "Break tasks into smaller, manageable chunks.",
                "Use visual aids like charts and checklists.",
                "Reward positive behavior immediately.",
                "Limit screen time and encourage physical activity.",
                "Work closely with teachers to support learning."
            ],
            "adult": [
                "Use planners, calendars, and reminders.",
                "Break large projects into small steps.",
                "Organize your workspace to minimize distractions.",
                "Practice mindfulness and stress-reduction techniques.",
                "Exercise regularly to burn off excess energy.",
                "Consider cognitive behavioral therapy (CBT)."
            ]
        }
    },
    "asd": {
        "description": "Autism Spectrum Disorder (ASD) is a developmental disability caused by differences in the brain. People with ASD often have problems with social communication and interaction, and restricted or repetitive behaviors or interests.",
        "symptoms": {
            "child": [
                "Avoids eye contact",
                "Does not respond to name by 9 months",
                "Does not show facial expressions like happy, sad, angry",
                "Lines up toys or other objects and gets upset when changed",
                "Repeats words or phrases over and over (echolalia)",
                "Plays with toys the same way every time",
                "Focuses on parts of objects (e.g., wheels)"
            ],
            "adult": [
                "Difficulty understanding what others are thinking or feeling",
                "Getting very anxious about social situations",
                "Finding it hard to make friends or preferring to be on your own",
                "Seeming blunt, rude or uninterested in others without meaning to",
                "Finding it hard to say how you feel",
                "Taking things very literally (difficulty with sarcasm)"
            ]
        },
        "advice": {
            "child": [
                "Early intervention is key (speech, occupational therapy).",
                "Use visual supports for communication.",
                "Create a safe, quiet space for downtime.",
                "Prepare for transitions in advance.",
                "Join support groups for parents.",
                "Focus on the child's strengths and interests."
            ],
            "adult": [
                "Learn about social norms and cues explicitly.",
                "Find a job that aligns with your strengths and interests.",
                "Join social groups with shared interests.",
                "Use noise-canceling headphones if sensitive to sound.",
                "Stick to a routine that works for you.",
                "Consider therapy to help with anxiety or depression."
            ]
        }
    },
    "dementia": {
        "description": "Dementia is a general term for loss of memory, language, problem-solving and other thinking abilities that are severe enough to interfere with daily life. Alzheimer's is the most common cause.",
        "symptoms": {
            "elderly": [
                "Memory loss that disrupts daily life",
                "Challenges in planning or solving problems",
                "Difficulty completing familiar tasks",
                "Confusion with time or place",
                "Trouble understanding visual images and spatial relationships",
                "New problems with words in speaking or writing",
                "Misplacing things and losing the ability to retrace steps",
                "Decreased or poor judgment",
                "Withdrawal from work or social activities",
                "Changes in mood and personality"
            ]
        },
        "advice": {
            "elderly": [
                "Establish a daily routine to reduce confusion.",
                "Safety-proof the home (remove tripping hazards, install grab bars).",
                "Use simple, clear communication.",
                "Break tasks into simple steps.",
                "Encourage social interaction and mental stimulation.",
                "Ensure regular physical activity and a healthy diet.",
                "Consult a neurologist for proper diagnosis and management.",
                "Caregivers should seek support and respite care."
            ]
        }
    },
    "general": {
        "description": "CogniWise Scan provides initial screening. It is not a medical diagnosis.",
        "advice": [
            "Always consult with a healthcare professional for a formal diagnosis.",
            "If you or a loved one is in crisis, seek immediate help.",
            "Healthy lifestyle choices (sleep, diet, exercise) benefit brain health.",
            "Stay socially active and mentally engaged."
        ]
    }
}

def get_context(condition=None, age_group=None):
    """Retrieves relevant context based on condition and age."""
    context = []
    
    if condition:
        cond_data = KNOWLEDGE_BASE.get(condition, {})
        if cond_data:
            context.append(f"Condition: {condition.upper()}")
            context.append(cond_data.get("description", ""))
            
            if age_group:
                symptoms = cond_data.get("symptoms", {}).get(age_group, [])
                if symptoms:
                    context.append(f"Common Symptoms ({age_group}):")
                    context.extend([f"- {s}" for s in symptoms])
                
                advice = cond_data.get("advice", {}).get(age_group, [])
                if advice:
                    context.append(f"Advice ({age_group}):")
                    context.extend([f"- {a}" for a in advice])
            else:
                # If no age group, include all
                 for age, symptoms in cond_data.get("symptoms", {}).items():
                     context.append(f"Common Symptoms ({age}):")
                     context.extend([f"- {s}" for s in symptoms])

    context.append("General Advice:")
    context.extend([f"- {a}" for a in KNOWLEDGE_BASE["general"]["advice"]])
    
    return "\n".join(context)
