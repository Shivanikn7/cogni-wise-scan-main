import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Apple, Coffee, Sandwich, Car, Hammer,
    User, Sparkles, CheckCircle, Brain, ArrowRight,
    Dog, Cat, Fish, Armchair, Bed, Sofa
} from "lucide-react";

interface ElderlyAssessmentProps {
    onComplete: (scores: any) => void;
}

const ElderlyAssessment = ({ onComplete }: ElderlyAssessmentProps) => {
    const [stage, setStage] = useState<"intro" | "g1_mem" | "g1_recall" | "g2_learn" | "g2_quiz" | "g3_sort" | "complete">("intro");

    // --- SCORING STATE ---
    const [score1, setScore1] = useState(0); // Shopping (Max 3)
    const [score2, setScore2] = useState(0); // Names (Max 2)
    const [score3, setScore3] = useState(0); // Sorting (Max 3 - corrected comment)

    // --- GAME 1: SHOPPING LIST (Verbal/Visual Recall) ---
    // Simple, relatable context. "Buy these 3 things."
    const SHOPPING_TARGETS = [
        { id: "apple", icon: Apple, label: "Apple", color: "text-red-500" },
        { id: "bread", icon: Sandwich, label: "Sandwich", color: "text-orange-500" },
        { id: "milk", icon: Coffee, label: "Coffee", color: "text-amber-800" },
    ];
    // Distractors
    const SHOPPING_DISTRACTORS = [
        { id: "car", icon: Car, label: "Car", color: "text-blue-500" },
        { id: "hammer", icon: Hammer, label: "Hammer", color: "text-slate-500" },
        { id: "plant", icon: Sparkles, label: "Flower", color: "text-green-500" },
    ];

    // Combined Grid for Game 1 (Constant order)
    const G1_GRID = [
        SHOPPING_TARGETS[0], SHOPPING_DISTRACTORS[0],
        SHOPPING_DISTRACTORS[1], SHOPPING_TARGETS[1],
        SHOPPING_TARGETS[2], SHOPPING_DISTRACTORS[2]
    ];

    const [g1Selected, setG1Selected] = useState<string[]>([]);

    // --- GAME 2: NAME ASSOCIATION (Face/Name Memory) ---
    const [g2Round, setG2Round] = useState(0); // 0 (Robert) or 1 (Sarah)

    const NAMES = [
        { name: "Robert", icon: User, color: "bg-blue-100 text-blue-600", distractors: ["James", "William"] },
        { name: "Sarah", icon: User, color: "bg-pink-100 text-pink-600", distractors: ["Mary", "Linda"] }
    ];

    // --- GAME 3: CATEGORY SORT (Semantic Memory) ---
    const ANIMALS = [
        { id: "dog", icon: Dog, label: "Dog" },
        { id: "cat", icon: Cat, label: "Cat" },
        { id: "fish", icon: Fish, label: "Fish" },
    ];
    const FURNITURE = [
        { id: "chair", icon: Armchair, label: "Chair" },
        { id: "bed", icon: Bed, label: "Bed" },
        { id: "sofa", icon: Sofa, label: "Sofa" },
    ];

    // Combined Grid for Game 3
    const G3_GRID = [
        ANIMALS[0], FURNITURE[0],
        FURNITURE[1], ANIMALS[1],
        FURNITURE[2], ANIMALS[2]
    ];

    const [g3Selected, setG3Selected] = useState<string[]>([]);


    // --- LOGIC ---

    const startGame1 = () => {
        setStage("g1_mem");
    };

    const finishG1Mem = () => {
        setStage("g1_recall");
    };

    const toggleG1Selection = (id: string) => {
        if (g1Selected.includes(id)) {
            setG1Selected(prev => prev.filter(i => i !== id));
        } else {
            if (g1Selected.length < 3) {
                setG1Selected(prev => [...prev, id]);
            }
        }
    };

    const submitG1 = () => {
        // Correct items are apple, bread, milk
        let correct = 0;
        const targets = ["apple", "bread", "milk"];
        g1Selected.forEach(id => {
            if (targets.includes(id)) correct++;
        });
        setScore1(correct);
        setStage("g2_learn");
        setG2Round(0); // Start with Robert
    };


    // Game 2 Logic
    const nextG2 = () => {
        setStage("g2_quiz");
    };

    const answerG2 = (ans: string) => {
        if (ans === NAMES[g2Round].name) {
            setScore2(s => s + 1);
        }

        if (g2Round === 0) {
            setG2Round(1); // Go to Sarah
            setTimeout(() => setStage("g2_learn"), 500);
        } else {
            // Done with G2
            setTimeout(() => setStage("g3_sort"), 500);
        }
    };

    // Game 3 Logic
    const toggleG3 = (id: string) => {
        if (g3Selected.includes(id)) {
            setG3Selected(prev => prev.filter(i => i !== id));
        } else {
            setG3Selected(prev => [...prev, id]);
        }
    };

    const submitG3 = () => {
        const animals = ["dog", "cat", "fish"];
        let correct = 0;
        let wrong = 0;

        g3Selected.forEach(id => {
            if (animals.includes(id)) correct++;
            else wrong++;
        });

        // Simple scoring: max 3. If wrong > 0, deduct? Or just strictly count correct?
        // Let's penalize slightly to discourage clicking everything.
        const rawScore = Math.max(0, correct - (wrong * 0.5));
        setScore3(rawScore);

        // Calculate finals now
        // But state update is async, so we calculate directly for the function call
        handleFinish(score1, score2 + (score2 === 0 ? 0 : 0), rawScore);
    };

    const handleFinish = (s1: number, s2Plus: number, s3: number) => {
        // s2Plus is complex above because I wanted to access current state. 
        // Actually score2 is state and valid because answerG2 runs before submitG3.
        // Wait, submitG3 runs LAST. So score2 is already set. score1 is set.
        // s3 is passed in directly.
        setStage("complete");
    };


    // --- RESULT CALC ---
    // G1: Max 3
    const normG1 = Math.min(1, score1 / 3);
    // G2: Max 2 rounds
    const normG2 = Math.min(1, score2 / 2);
    // G3: Max 3 animals
    const normG3 = Math.min(1, score3 / 3);

    const weightedScore = (normG1 * 0.4) + (normG2 * 0.3) + (normG3 * 0.3);
    const riskScore = Math.round((1 - weightedScore) * 100);
    const isHighRisk = riskScore >= 55;

    return (
        <div className="min-h-screen flex flex-col p-6 max-w-3xl mx-auto w-full select-none bg-slate-50 font-sans">

            {/* --- INTRO --- */}
            {stage === "intro" && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-10 animate-fade-in">
                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border-4 border-indigo-100 w-full max-w-lg">
                        <div className="w-28 h-28 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                            <Brain className="w-14 h-14 text-indigo-600" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-800 mb-4">Memory Check</h1>
                        <p className="text-xl text-slate-500 font-medium leading-relaxed">
                            Three simple activities to exercise your mind.
                            <br />Relax, take your time.
                        </p>
                    </div>
                    <Button
                        onClick={startGame1}
                        className="w-full max-w-sm text-2xl py-8 rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-xl transition-transform hover:scale-105"
                    >
                        Start
                    </Button>
                </div>
            )}

            {/* --- GAME 1: SHOPPING MEMORY --- */}
            {stage === "g1_mem" && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-12 animate-fade-in">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-slate-800 mb-2">Shopping List</h2>
                        <p className="text-xl text-slate-500">Read these items out loud. Remember them.</p>
                    </div>

                    <div className="flex gap-8 justify-center flex-wrap">
                        {SHOPPING_TARGETS.map(item => (
                            <Card key={item.id} className="w-48 h-56 flex flex-col items-center justify-center gap-6 border-2 border-slate-200 shadow-lg bg-white rounded-3xl">
                                <item.icon className={`w-20 h-20 ${item.color}`} />
                                <span className="text-2xl font-bold text-slate-700">{item.label}</span>
                            </Card>
                        ))}
                    </div>

                    <Button onClick={finishG1Mem} size="lg" className="px-12 py-8 text-xl rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-xl">
                        I am ready
                        <ArrowRight className="ml-2 w-6 h-6" />
                    </Button>
                </div>
            )}

            {stage === "g1_recall" && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-fade-in">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-slate-800">What did we buy?</h2>
                        <p className="text-xl text-slate-500">Tap the 3 items on our list.</p>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        {G1_GRID.map(item => (
                            <button
                                key={item.id}
                                onClick={() => toggleG1Selection(item.id)}
                                className={`w-36 h-36 rounded-2xl flex flex-col items-center justify-center gap-2 border-4 transition-all shadow-sm
                                    ${g1Selected.includes(item.id)
                                        ? 'border-indigo-500 bg-indigo-50 scale-105'
                                        : 'border-slate-100 bg-white hover:border-slate-300'}
                                `}
                            >
                                <item.icon className={`w-12 h-12 ${g1Selected.includes(item.id) ? 'text-indigo-600' : 'text-slate-400'}`} />
                                <span className={`text-lg font-bold ${g1Selected.includes(item.id) ? 'text-indigo-700' : 'text-slate-400'}`}>
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    <Button
                        onClick={submitG1}
                        disabled={g1Selected.length !== 3}
                        className="px-12 py-6 text-xl rounded-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                        Confirm
                    </Button>
                </div>
            )}

            {/* --- GAME 2: NAME LEARNING --- */}
            {stage === "g2_learn" && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-10 animate-fade-in">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-slate-800">Who is this?</h2>
                        <p className="text-xl text-slate-500">Remember the name.</p>
                    </div>

                    <Card className="w-80 h-96 flex flex-col items-center justify-center gap-6 border-4 border-indigo-50 shadow-2xl rounded-[3rem] bg-white p-8">
                        <div className={`w-40 h-40 rounded-full flex items-center justify-center mb-4 ${NAMES[g2Round].color}`}>
                            {(() => {
                                const Icon = NAMES[g2Round].icon;
                                return <Icon className="w-24 h-24" />;
                            })()}
                        </div>
                        <div className="text-center">
                            <p className="text-slate-400 text-lg uppercase tracking-widest font-bold">This is</p>
                            <h1 className="text-5xl font-black text-slate-800">{NAMES[g2Round].name}</h1>
                        </div>
                    </Card>

                    <Button onClick={nextG2} size="lg" className="px-12 py-8 text-xl rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-xl">
                        I remember
                    </Button>
                </div>
            )}

            {stage === "g2_quiz" && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-10 animate-fade-in">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-slate-800">What is their name?</h2>
                    </div>

                    <div className={`w-32 h-32 rounded-full flex items-center justify-center ${NAMES[g2Round].color}`}>
                        {(() => {
                            const Icon = NAMES[g2Round].icon;
                            return <Icon className="w-16 h-16" />;
                        })()}
                    </div>

                    <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
                        {/* Show options in a standard order or shuffled locally. 
                            For simplicity, let's keep array fixed here or simple random without re-render issues.
                            We'll just hardcode a shuffled order for stability if needed, but random is fine.
                         */}
                        {[NAMES[g2Round].name, ...NAMES[g2Round].distractors]
                            .sort() // Alphabetical sort to randomize safely without flicker
                            .map(opt => (
                                <Button
                                    key={opt}
                                    onClick={() => answerG2(opt)}
                                    variant="outline"
                                    className="h-20 text-2xl font-bold border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-slate-700 rounded-2xl"
                                >
                                    {opt}
                                </Button>
                            ))}
                    </div>
                </div>
            )}

            {/* --- GAME 3: SORTING --- */}
            {stage === "g3_sort" && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-fade-in">
                    <div className="text-center px-4 py-6 bg-orange-50 rounded-3xl border border-orange-100 full-w max-w-md">
                        <h2 className="text-3xl font-black text-orange-800 uppercase tracking-wide">Category Challenge</h2>
                        <p className="text-2xl font-bold text-orange-600 mt-2">Tap all the <span className="underline decoration-4 decoration-orange-300">ANIMALS</span></p>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        {G3_GRID.map(item => (
                            <button
                                key={item.id}
                                onClick={() => toggleG3(item.id)}
                                className={`w-36 h-36 rounded-2xl flex flex-col items-center justify-center gap-2 border-4 transition-all shadow-sm
                                    ${g3Selected.includes(item.id)
                                        ? 'border-orange-500 bg-orange-50 scale-105'
                                        : 'border-slate-100 bg-white hover:border-slate-300'}
                                `}
                            >
                                <item.icon className={`w-14 h-14 ${g3Selected.includes(item.id) ? 'text-orange-600' : 'text-slate-400'}`} />
                                <span className={`text-lg font-bold ${g3Selected.includes(item.id) ? 'text-orange-700' : 'text-slate-400'}`}>
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    <Button
                        onClick={submitG3}
                        className="px-16 py-6 text-xl rounded-full bg-green-600 hover:bg-green-700 mt-8"
                    >
                        Check
                    </Button>
                </div>
            )}

            {/* --- COMPLETE --- */}
            {stage === "complete" && (
                <Card className="flex-1 p-10 flex flex-col items-center justify-center text-center space-y-8 border-4 border-green-100 bg-green-50/50 rounded-[3rem] animate-zoom-in">
                    <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center shadow-inner">
                        <CheckCircle className="w-16 h-16 text-green-600" />
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl font-black text-slate-800">
                            Assessment Complete
                        </h1>
                        <p className="text-xl text-slate-600 font-medium">
                            {isHighRisk
                                ? "Thank you. We have recorded your responses for review."
                                : "Excellent work! Your memory is sharp."}
                        </p>
                    </div>

                    <Button
                        onClick={() => onComplete({ game1: normG1, game2: normG2, game3: normG3 })}
                        size="lg"
                        className={`w-full max-w-sm text-2xl py-8 rounded-2xl shadow-xl text-white font-bold
                            ${isHighRisk ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}
                        `}
                    >
                        {isHighRisk ? "View Results" : "Finish"}
                    </Button>
                </Card>
            )}

        </div>
    );
};

export default ElderlyAssessment;
