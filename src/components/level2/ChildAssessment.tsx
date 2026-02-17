import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Smile, Frown, Angry, Meh, Star, Play, CheckCircle } from "lucide-react";

// Types for WebGazer
declare global {
    interface Window {
        webgazer: any;
    }
}

interface ChildAssessmentProps {
    onComplete: (scores: any) => void;
}

const ChildAssessment = ({ onComplete }: ChildAssessmentProps) => {
    const { toast } = useToast();
    const [gameStage, setGameStage] = useState<"intro" | "game1" | "game2" | "game3" | "complete">("intro");

    // Game 1: Face vs Toy
    const [g1Round, setG1Round] = useState(0);
    const [g1Active, setG1Active] = useState(false);

    // Game 2: Emotion Pop
    const [g1Score, setG1Score] = useState(0); // Max 5
    const [g2Score, setG2Score] = useState(0); // Max 8
    const [g3Score, setG3Score] = useState(0); // Max 1
    const [g2Balloons, setG2Balloons] = useState<{ id: number, type: string, x: number, y: number }[]>([]);

    // Game 3: Sensory Maze
    const [g3Started, setG3Started] = useState(false);



    // --- Game 1: Find the Baby (Social Attention) ---
    // Replaces passive "WebGazer" with active "Find the Face" in a grid of distractors
    const [g1Grid, setG1Grid] = useState<string[]>([]);
    const startGame1 = () => {
        setGameStage("game1");
        setG1Score(0);
        nextG1Round(1);
    };

    const nextG1Round = (round: number) => {
        setG1Round(round);
        // Create a grid of 9 items. 1 is Baby, 8 are distractors (toys/animals)
        const distractors = ["🚂", "🚗", "🧸", "⚽", "🐶", "🐱", "🐰", "🦊", "🐸", "🤖"];
        const grid = Array.from({ length: 8 }).map(() => distractors[Math.floor(Math.random() * distractors.length)]);
        grid.push("👶");
        // Shuffle
        setG1Grid(grid.sort(() => Math.random() - 0.5));
    };

    const handleG1Click = (item: string) => {
        if (item === "👶") {
            // Correct!
            toast({ title: "Found the Baby! Great job!", className: "bg-green-500 text-white border-0" });
            const next = g1Round + 1;
            setG1Score(s => s + 1);
            if (next > 5) {
                setTimeout(startGame2, 1500);
            } else {
                nextG1Round(next);
            }
        } else {
            // Distractor
            toast({ title: "That's a toy! Find the Baby Face 👶", variant: "destructive" });
        }
    };

    // --- Game 2: Emotion Match (Emotion Rec) ---
    const [targetEmotion, setTargetEmotion] = useState<"happy" | "sad" | "angry">("happy");
    const startGame2 = () => {
        setGameStage("game2");
        setG2Score(0);
        // Spawn loop
        const interval = setInterval(() => {
            spawnBalloon();
        }, 1200); // New balloon every 1.2s

        // Change target emotion every 5s
        const targetInterval = setInterval(() => {
            const opts: ("happy" | "sad" | "angry")[] = ["happy", "sad", "angry"];
            setTargetEmotion(opts[Math.floor(Math.random() * opts.length)]);
        }, 8000);

        // End game after 25s
        setTimeout(() => {
            clearInterval(interval);
            clearInterval(targetInterval);
            setG2Balloons([]);
            startGame3();
        }, 25000);
    };

    const spawnBalloon = () => {
        const types = ["happy", "sad", "angry", "surprised"];
        const newB = {
            id: Date.now(),
            type: types[Math.floor(Math.random() * types.length)],
            x: Math.random() * 80 + 10,
            y: 110
        };
        setG2Balloons(prev => [...prev, newB]);
    };

    // Animation Loop for Game 2
    useEffect(() => {
        if (gameStage !== "game2") return;
        const anim = setInterval(() => {
            setG2Balloons(prev => {
                // Move up
                const moved = prev.map(b => ({ ...b, y: b.y - 1 }));
                // Remove off-screen
                return moved.filter(b => b.y > -20);
            });
        }, 30);
        return () => clearInterval(anim);
    }, [gameStage]);

    const popBalloon = (id: number, type: string) => {
        if (type === targetEmotion) {
            setG2Score(s => s + 1); // Only score if matching target
            // visual pop effect handled by removal
        } else {
            // Wrong pop - maybe negative score or just feedback
            toast({ title: `Oops! Look for ${targetEmotion.toUpperCase()} faces!`, variant: "destructive", duration: 1000 });
        }
        setG2Balloons(prev => prev.filter(b => b.id !== id));
    };


    // --- Game 3: Wonder Train (Pattern/Detail Focus) ---
    // User must complete the pattern on the train cars.
    // e.g. [Red] [Blue] [Red] [?] -> [Blue]
    // Tests: Pattern recognition, attention to detail, rule following.

    // Pattern types:
    // ABAB (Red Blue Red Blue)
    // AABB (Red Red Blue Blue)
    // ABC (Red Blue Green Red Blue Green)

    const [trainRound, setTrainRound] = useState(0);
    const [pattern, setPattern] = useState<string[]>([]);
    const [missingIndex, setMissingIndex] = useState(0);
    const [options, setOptions] = useState<string[]>([]);

    const startGame3 = () => {
        setGameStage("game3");
        setG3Score(0);
        setTrainRound(1);
        nextTrainRound(1);
    };

    const nextTrainRound = (round: number) => {
        const shapes = ["🟥", "🟦", "🟨", "🟩", "🟣"];
        let seq = [];
        let rule = "";

        // Difficulty Logic
        if (round <= 2) {
            // ABAB
            const A = shapes[Math.floor(Math.random() * shapes.length)];
            let B = shapes[Math.floor(Math.random() * shapes.length)];
            while (B === A) B = shapes[Math.floor(Math.random() * shapes.length)];
            seq = [A, B, A, B, A]; // Next is B
            rule = "ternary";
        } else {
            // AABB or ABC
            const type = Math.random() > 0.5 ? 'aabb' : 'abc';
            if (type === 'aabb') {
                const A = shapes[Math.floor(Math.random() * shapes.length)];
                let B = shapes[Math.floor(Math.random() * shapes.length)];
                while (B === A) B = shapes[Math.floor(Math.random() * shapes.length)];
                seq = [A, A, B, B, A]; // Next is A
            } else {
                const A = shapes[0]; const B = shapes[1]; const C = shapes[2]; // Simplified pool
                seq = [A, B, C, A, B]; // Next is C
            }
        }

        // Target is the last one (or missing one)
        const target = seq[seq.length - 1]; // We actually generate 5 items, let's ask for the 6th? or 5th.
        // Let's show 4 items, ask for 5th.

        // Actual sequence generation to ensure clear logic
        const A = shapes[Math.floor(Math.random() * shapes.length)];
        let B = shapes[Math.floor(Math.random() * shapes.length)];
        while (B === A) B = shapes[Math.floor(Math.random() * shapes.length)];
        let C = shapes[Math.floor(Math.random() * shapes.length)];
        while (C === A || C === B) C = shapes[Math.floor(Math.random() * shapes.length)];

        let fullSeq = [];
        if (round === 1) fullSeq = [A, B, A, B, A, B]; // Target B
        else if (round === 2) fullSeq = [A, A, B, B, A, A]; // Target A
        else if (round === 3) fullSeq = [A, B, C, A, B, C]; // Target C
        else if (round === 4) fullSeq = [A, B, A, B, A, B]; // Fast AB
        else fullSeq = [A, A, B, B, C, C]; // Target C (Round 5 tricky) - actually let's stick to predictable.
        if (round === 5) fullSeq = [A, B, C, A, B, C];

        const qSeq = fullSeq.slice(0, 5);
        const ans = fullSeq[5];

        setPattern(qSeq);
        // Generate options (Correct + 2 Distractors)
        const distractors = shapes.filter(s => s !== ans).sort(() => Math.random() - 0.5).slice(0, 2);
        setOptions([ans, ...distractors].sort(() => Math.random() - 0.5));
    };

    const handleTrainChoice = (choice: string) => {
        // Logic check
        // Re-derive correct answer from pattern or store it?
        // Let's store correct answer in state or simple check.
        // Actually, my generation logic is deterministic per round but I didn't store Target.
        // Let's rely on checking against "what would complete the pattern".
        // Simpler: Just rely on 'win' logic if I saved the target.
        // I'll recalculate the target based on the pattern effectively displayed? No, risky.
        // Let's refactor nextTrainRound to set 'targetItem'.

        // For now, let's just check against the known "Correct" logic derived from state if possible?
        // No, let's refactor State to hold 'targetItem'.
    };

    // --- REFACTORED STATE FOR GAME 3 ---
    const [targetItem, setTargetItem] = useState("");

    // Overwriting nextTrainRound properly
    const startNewTrainRound = (r: number) => {
        setTrainRound(r);
        const shapes = ["🟥", "🟦", "🟨", "🟩"]; //, "🟣"];
        const A = shapes[Math.floor(Math.random() * shapes.length)];
        let B = shapes[Math.floor(Math.random() * shapes.length)];
        while (B === A) B = shapes[Math.floor(Math.random() * shapes.length)];
        let C = shapes[Math.floor(Math.random() * shapes.length)];
        while (C === A || C === B) C = shapes[Math.floor(Math.random() * shapes.length)];

        let seq = [];
        let target = "";

        if (r % 2 !== 0) { // 1, 3, 5: ABAB or ABC
            if (Math.random() > 0.5) {
                seq = [A, B, A, B, A]; target = B;
            } else {
                seq = [A, B, C, A, B]; target = C;
            }
        } else { // 2, 4: AABB
            seq = [A, A, B, B, A]; target = A;
        }

        setPattern(seq);
        setTargetItem(target);

        const distractors = shapes.filter(s => s !== target).sort(() => Math.random() - 0.5).slice(0, 2);
        setOptions([target, ...distractors].sort(() => Math.random() - 0.5));
    };

    const handleTrainAnswer = (choice: string) => {
        if (choice === targetItem) {
            setG3Score(s => s + 10); // Max 50
            toast({ title: "Choo Choo! Correct! 🚂", className: "bg-green-500 text-white border-0" });
        } else {
            toast({ title: "Try again next time!", variant: "destructive" });
        }

        if (trainRound < 5) {
            setTimeout(() => startNewTrainRound(trainRound + 1), 1000);
        } else {
            setTimeout(() => setGameStage("complete"), 1000);
        }
    };


    // --- Final Score Logic ---
    // G1 (Face): 5 rounds. Max 5.
    const normG1 = Math.min(1, g1Score / 5);
    // G2 (Balloon): Timed. Expect ~10.
    const normG2 = Math.min(1, g2Score / 10);
    // G3 (Train): 5 rounds * 10 = 50.
    const normG3 = Math.min(1, g3Score / 50);

    // Weighted Risk Calculation to match Backend
    // Social (Game 1): 40%
    // Emotion (Game 2): 30%
    // Sensory (Game 3): 30%
    const weightedScore = (normG1 * 0.4) + (normG2 * 0.3) + (normG3 * 0.3);
    const riskScore = Math.round((1 - weightedScore) * 100);
    const isHighRisk = riskScore >= 55;

    return (
        <div className="min-h-screen flex flex-col p-4 bg-slate-50 max-w-5xl mx-auto w-full font-fredoka select-none">
            {gameStage === "intro" && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-8 text-center animate-zoom-in">
                    <div className="relative">
                        <div className="w-40 h-40 bg-yellow-300 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-float">
                            <Smile className="w-24 h-24 text-yellow-700" />
                        </div>
                    </div>
                    <h2 className="text-5xl font-black text-slate-800 tracking-tight">Let's Play!</h2>
                    <p className="text-2xl text-slate-600 font-bold">Three games to test your super powers!</p>

                    <Button onClick={startGame1} className="mt-8 bg-gradient-to-r from-purple-500 to-indigo-600 hover:scale-105 text-white text-3xl px-16 py-10 rounded-full shadow-2xl transition-all font-black border-b-8 border-indigo-800 active:border-b-0 active:translate-y-2">
                        START GAME 🎮
                    </Button>
                </div>
            )}

            {/* GAME 1: FIND BABY */}
            {gameStage === "game1" && (
                <div className="flex-1 flex flex-col items-center justify-center bg-indigo-50 rounded-[2rem] border-8 border-indigo-200 p-8">
                    <h3 className="text-4xl font-black text-indigo-900 mb-8 border-bg-white bg-white/50 px-8 py-4 rounded-full">
                        Find the Baby! 👶 Round {g1Round}/5
                    </h3>
                    <div className="grid grid-cols-3 gap-6 w-full max-w-2xl h-[500px]">
                        {g1Grid.map((item, idx) => (
                            <div
                                key={idx}
                                onClick={() => handleG1Click(item)}
                                className="bg-white rounded-3xl shadow-xl border-4 border-indigo-100 flex items-center justify-center text-7xl cursor-pointer hover:scale-110 hover:bg-yellow-50 transition-all active:scale-90"
                            >
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* GAME 2: EMOTION POP */}
            {gameStage === "game2" && (
                <div className="flex-1 relative bg-sky-100 rounded-[2rem] border-8 border-sky-200 overflow-hidden cursor-crosshair">
                    <div className="absolute top-4 w-full flex justify-center z-20">
                        <div className="bg-white/90 px-8 py-4 rounded-full shadow-xl border-4 border-sky-300 flex items-center gap-4">
                            <span className="text-2xl font-bold text-slate-600">Pop ONLY:</span>
                            <span className={`text-4xl font-black uppercase tracking-wider
                                ${targetEmotion === 'happy' ? 'text-yellow-500' : targetEmotion === 'sad' ? 'text-blue-500' : 'text-red-500'}
                             `}>
                                {targetEmotion}
                            </span>
                            <span className="text-3xl ml-4">
                                Score: {g2Score}
                            </span>
                        </div>
                    </div>

                    {g2Balloons.map(b => (
                        <div
                            key={b.id}
                            onMouseDown={() => popBalloon(b.id, b.type)}
                            className="absolute transition-transform hover:scale-110 active:scale-90 cursor-pointer"
                            style={{ left: `${b.x}%`, top: `${b.y}%` }}
                        >
                            <div className={`w-24 h-28 rounded-[50%] flex items-center justify-center text-5xl shadow-lg border-2 border-white/30
                                ${b.type === 'happy' ? 'bg-gradient-to-br from-yellow-300 to-orange-400' :
                                    b.type === 'sad' ? 'bg-gradient-to-br from-blue-300 to-indigo-400' :
                                        b.type === 'angry' ? 'bg-gradient-to-br from-red-400 to-red-600' :
                                            'bg-gradient-to-br from-purple-300 to-purple-500'}
                            `}>
                                {b.type === 'happy' && <Smile className="text-white w-14 h-14" />}
                                {b.type === 'sad' && <Frown className="text-white w-14 h-14" />}
                                {b.type === 'angry' && <Angry className="text-white w-14 h-14" />}
                                {b.type === 'surprised' && <Meh className="text-white w-14 h-14" />}
                            </div>
                            <div className="mx-auto w-1 h-12 bg-white/50"></div>
                        </div>
                    ))}
                </div>
            )}

            {/* GAME 3: WONDER TRAIN (Replaced Rocket) */}
            {gameStage === "game3" && (
                <div className="flex-1 flex flex-col items-center justify-center bg-emerald-50 rounded-[2rem] border-8 border-emerald-200 p-8 space-y-12">
                    <div className="text-center space-y-2">
                        <h3 className="text-3xl font-black text-emerald-800">Complete the Pattern! 🚂</h3>
                        <p className="text-emerald-600 font-bold text-xl">What comes next?</p>
                    </div>

                    {/* Train Display */}
                    <div className="flex items-end gap-2 p-8 bg-emerald-100/50 rounded-xl w-full max-w-4xl justify-center overflow-x-auto">
                        {/* Engine */}
                        <div className="flex flex-col items-center">
                            <div className="w-24 h-20 bg-emerald-600 rounded-t-xl relative">
                                <div className="absolute top-2 right-2 w-8 h-8 bg-yellow-300 rounded-full border-4 border-yellow-500 animate-pulse"></div>
                                <div className="absolute -top-10 left-2 w-6 h-10 bg-black"></div>
                                <div className="absolute -top-12 left-0 w-12 h-4 bg-black rounded-full"></div>
                            </div>
                            <div className="w-28 h-8 bg-gray-800 rounded-b-xl flex justify-around items-center">
                                <div className="w-6 h-6 bg-black rounded-full border-2 border-gray-500"></div>
                                <div className="w-6 h-6 bg-black rounded-full border-2 border-gray-500"></div>
                            </div>
                        </div>

                        {/* Connector */}
                        <div className="w-4 h-2 bg-black self-end mb-4"></div>

                        {/* Pattern Cars */}
                        {pattern.map((shape, i) => (
                            <div key={i} className="flex gap-2 items-end animate-slide-in-right" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className="flex flex-col items-center">
                                    <div className="w-20 h-20 bg-white rounded-lg border-4 border-emerald-300 flex items-center justify-center text-5xl shadow-sm">
                                        {shape}
                                    </div>
                                    <div className="w-24 h-6 bg-gray-700 rounded-b-lg flex justify-around mt-[-2px]">
                                        <div className="w-5 h-5 bg-black rounded-full mt-1"></div>
                                        <div className="w-5 h-5 bg-black rounded-full mt-1"></div>
                                    </div>
                                </div>
                                <div className="w-4 h-2 bg-black self-end mb-3"></div>
                            </div>
                        ))}

                        {/* Mystery Car */}
                        <div className="flex flex-col items-center animate-pulse">
                            <div className="w-20 h-20 bg-emerald-200 rounded-lg border-4 border-dashed border-emerald-500 flex items-center justify-center text-5xl">
                                ❓
                            </div>
                            <div className="w-24 h-6 bg-gray-700 rounded-b-lg flex justify-around mt-[-2px]">
                                <div className="w-5 h-5 bg-black rounded-full mt-1"></div>
                                <div className="w-5 h-5 bg-black rounded-full mt-1"></div>
                            </div>
                        </div>
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-3 gap-8">
                        {options.map((opt, i) => (
                            <Button
                                key={i}
                                onClick={() => handleTrainAnswer(opt)}
                                className="w-32 h-32 text-6xl rounded-3xl bg-white border-b-8 border-slate-200 hover:border-emerald-500 hover:translate-y-1 hover:bg-emerald-50 transition-all shadow-xl"
                            >
                                {opt}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* COMPLETE */}
            {gameStage === "complete" && (
                <Card className="flex-1 p-10 flex flex-col items-center justify-center text-center space-y-8 border-8 border-green-200 bg-green-50 rounded-[2rem] animate-fade-in">
                    <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center shadow-inner">
                        <CheckCircle className="w-20 h-20 text-green-600" />
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-5xl font-black text-green-900">
                            Adventure Complete!
                        </h1>
                        <p className="text-xl text-green-800 font-medium">
                            {isHighRisk
                                ? "We found some tricky parts. Let's look closer."
                                : "You are a Superstar!"}
                        </p>
                    </div>

                    {isHighRisk ? (
                        <Button
                            onClick={() => onComplete({ game1: normG1, game2: normG2, game3: normG3 })}
                            size="lg"
                            className="w-full max-w-md text-2xl py-8 rounded-2xl shadow-xl text-white font-bold bg-red-500 hover:bg-red-600 animate-pulse"
                        >
                            See Results
                        </Button>
                    ) : (
                        <Button
                            onClick={() => onComplete({ game1: normG1, game2: normG2, game3: normG3 })}
                            size="lg"
                            className="w-full max-w-md text-2xl py-8 rounded-2xl shadow-xl text-white font-bold bg-green-500 hover:bg-green-600"
                        >
                            Finish
                        </Button>
                    )}
                </Card>
            )}
        </div>
    );
};

export default ChildAssessment;
