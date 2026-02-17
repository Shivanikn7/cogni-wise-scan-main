import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Brain, CheckCircle, AlertTriangle, Download, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { buildApiUrl } from "@/lib/api";
import ChildAssessment from "@/components/level2/ChildAssessment";
import AdultAssessment from "@/components/level2/AdultAssessment";
import ElderlyAssessment from "@/components/level2/ElderlyAssessment";

const Level2Assessment = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [ageGroup, setAgeGroup] = useState<"child" | "adult" | "elderly" | null>(null);
    const [results, setResults] = useState<any>(null);
    const [level3Unlocked, setLevel3Unlocked] = useState(false);
    const [customLabel, setCustomLabel] = useState<string>("");

    useEffect(() => {
        const fetchProfileAndResults = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate("/login");
                return;
            }

            // 1. Fetch Profile
            const { data: profile } = await supabase
                .from("profiles")
                .select("age")
                .eq("id", session.user.id)
                .single();

            if (profile) {
                if (profile.age <= 12) {
                    setAgeGroup("child");
                    setCustomLabel("Child");
                } else if (profile.age <= 59) {
                    setAgeGroup("adult");
                    if (profile.age >= 41) setCustomLabel("Older Adult"); // >40
                    else if (profile.age >= 30) setCustomLabel("Mid-Life Adult"); // 30-40
                    else if (profile.age >= 13) setCustomLabel("Young Adult"); // 13-29
                    else setCustomLabel("Adult"); // Fallback
                } else {
                    setAgeGroup("elderly");
                    setCustomLabel("Elderly");
                }
            }

            // 2. Fetch Existing Level 2 Results
            try {
                const response = await fetch(buildApiUrl(`/api/level2/results/${session.user.id}`));
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        // We found old results, but we want the user to be able to RETAKE the test.
                        // So we do NOT set completed(true) here.
                        // We might store the latest result just in case we want to show "Previous Best",
                        // but for now, we ensure the game starts.
                        const latest = data[0];
                        // setResults(latest); 
                        // setLevel3Unlocked(latest.final_risk_percent >= 55.0);
                        // setCompleted(true); <--- REMOVED TO ALLOW RETAKE
                    }
                }
            } catch (e) {
                console.error("Failed to fetch existing results", e);
            }

            setLoading(false);
        };
        fetchProfileAndResults();
    }, [navigate]);

    const handleTaskComplete = async (scores?: any) => {
        setSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");

            const response = await fetch(buildApiUrl("/api/level2/submit"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: session.user.id,
                    age_group: ageGroup,
                    game_scores: scores // Pass the scores to backend
                })
            });

            if (!response.ok) throw new Error("Failed to submit");

            const data = await response.json();
            setResults(data.results);
            // Defensively check score on client-side too in case backend is stale
            const isRiskHigh = data.results.final_risk_percent >= 55.0;
            setLevel3Unlocked(data.level3_unlocked || isRiskHigh);
            setCompleted(true);

            toast({
                title: "Assessment Completed",
                description: "Your cognitive profile has been analyzed.",
                className: "bg-[#4A6FA5] text-white border-none"
            });

        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to save results. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-[#F8F9FF] gap-4">
                <div className="w-16 h-16 border-4 border-[#7C4DFF] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[#4A6FA5] font-medium animate-pulse">Loading Cognitive Engine...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: 'url("/medical-bg.png")' }}
            />
            <div className="fixed inset-0 bg-white/80 backdrop-blur-[2px] z-0 pointer-events-none"></div>

            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-[#E0E7FF] sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate("/dashboard")}
                                className="hover:bg-[#F0F4FF] text-[#4A6FA5]"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-[#4A6FA5] to-[#7C4DFF] p-2 rounded-lg shadow-lg shadow-[#7C4DFF]/20">
                                    <Brain className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-[#1E293B]">Level 2 Assessment</h1>
                                    <p className="text-xs text-[#64748B] font-medium">Advanced Cognitive Analysis</p>
                                </div>
                            </div>
                        </div>
                        {ageGroup && (
                            <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-[#F0F4FF] rounded-full border border-[#E0E7FF]">
                                <Activity className="w-4 h-4 text-[#7C4DFF]" />
                                <span className="text-sm font-semibold text-[#4A6FA5] uppercase tracking-wide">
                                    {customLabel || ageGroup} Module
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto space-y-8 relative z-10">
                {!completed ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {ageGroup === "child" && <ChildAssessment onComplete={handleTaskComplete} />}
                        {ageGroup === "adult" && <AdultAssessment onComplete={handleTaskComplete} />}
                        {ageGroup === "elderly" && <ElderlyAssessment onComplete={handleTaskComplete} />}
                    </div>
                ) : (
                    <div className="space-y-8 animate-in zoom-in-95 duration-500">
                        {/* Result Banner */}
                        <Card className={`overflow-hidden border-0 shadow-2xl ${level3Unlocked ? "shadow-red-200" : "shadow-green-200"}`}>
                            <div className={`h-2 w-full ${level3Unlocked ? "bg-red-500" : "bg-green-500"}`}></div>
                            <CardHeader className="pb-8 pt-8">
                                <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                                    <div className={`p-4 rounded-full ${level3Unlocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                                        {level3Unlocked ? <AlertTriangle className="h-12 w-12" /> : <CheckCircle className="h-12 w-12" />}
                                    </div>
                                    <div className="space-y-2">
                                        <CardTitle className="text-3xl font-bold text-[#1E293B]">
                                            {level3Unlocked ? "Clinical Attention Recommended" : "Cognitive Profile Analyzed"}
                                        </CardTitle>
                                        <CardDescription className="text-lg">
                                            Final Risk Assessment Score: <span className={`font-bold ${level3Unlocked ? "text-red-600" : "text-green-600"}`}>{results?.final_risk_percent}%</span>
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="bg-[#F8F9FF] border-t border-[#E0E7FF] p-8">
                                <p className={`text-lg leading-relaxed ${level3Unlocked ? "text-red-800" : "text-[#475569]"}`}>
                                    {level3Unlocked
                                        ? "Our analysis indicates potential markers that warrant further professional evaluation. Level-3 Emergency Guidance has been unlocked to assist you."
                                        : "Your results are within the expected range. We recommend maintaining a healthy lifestyle and regular check-ups."
                                    }
                                </p>
                            </CardContent>
                        </Card>

                        {/* Detailed Metrics */}
                        <div className="grid gap-6 md:grid-cols-3">
                            {results && Object.entries(results.domain_scores).map(([key, value]: [string, any], index) => (
                                <Card key={key} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
                                    <div className={`h-1.5 w-full bg-gradient-to-r from-[#4A6FA5] to-[#7C4DFF] opacity-70 group-hover:opacity-100 transition-opacity`}></div>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-bold text-[#64748B] uppercase tracking-wider">
                                            {key.replace(/_/g, " ")}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-end gap-2">
                                            <span className="text-4xl font-black text-[#1E293B]">{(value * 100).toFixed(0)}</span>
                                            <span className="text-sm font-medium text-[#94A3B8] mb-1.5">% Risk</span>
                                        </div>
                                        {/* Progress Bar Visual */}
                                        <div className="mt-4 h-2 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#7C4DFF] rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${value * 100}%` }}
                                            ></div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
                            <Button
                                onClick={() => navigate("/dashboard")}
                                variant="outline"
                                className="h-12 px-8 border-[#E0E7FF] text-[#64748B] hover:text-[#4A6FA5] hover:bg-white hover:border-[#4A6FA5]"
                            >
                                Return to Dashboard
                            </Button>
                            <Button
                                onClick={() => {
                                    if (results?.id) {
                                        window.open(buildApiUrl(`/api/reports/level2/${results.id}/pdf`), '_blank');
                                        toast({
                                            title: "Report Downloaded",
                                            description: "Your PDF report is ready.",
                                            className: "bg-[#4A6FA5] text-white border-none"
                                        });
                                    }
                                }}
                                className="h-12 px-8 bg-[#4A6FA5] hover:bg-[#3B5998] text-white shadow-lg shadow-[#4A6FA5]/30"
                            >
                                <Download className="mr-2 h-4 w-4" /> Download PDF Report
                            </Button>
                            {level3Unlocked && (
                                <Button
                                    onClick={() => navigate("/level3")}
                                    className="h-12 px-8 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 animate-pulse"
                                >
                                    Proceed to Level 3 Emergency
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Level2Assessment;
