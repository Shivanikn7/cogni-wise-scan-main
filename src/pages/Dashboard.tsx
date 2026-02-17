import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowRight, Brain, ClipboardList, MessageSquare, Shield, Sparkles, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { buildApiUrl } from "@/lib/api";

type AssessmentResult = {
  id: number;
  condition_type: string;
  risk_score: number;
  risk_level: string;
  risk_label: string;
  requires_level2: boolean;
  admin_notes?: string | null;
  assessed_at: string;
};

type LevelProgress = {
  level1_completed: boolean;
  level2_completed?: boolean;
  level3_completed?: boolean;
  level2_unlocked: boolean;
  level3_unlocked: boolean;
  level2_conditions: string[];
  level3_conditions: string[];
};

type UserProfile = {
  full_name: string;
  age: number;
  age_group: string;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [progress, setProgress] = useState<LevelProgress | null>(null);
  const [results, setResults] = useState<AssessmentResult[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, age, age_group")
        .eq("id", session.user.id)
        .single();

      if (profileError || !profileData) {
        toast({
          title: "Profile not found",
          description: "Please complete your profile to continue.",
          variant: "destructive",
        });
        navigate("/signup");
        return;
      }

      const typedProfile: UserProfile = {
        full_name: profileData.full_name,
        age: profileData.age,
        age_group: profileData.age_group,
      };

      setProfile(typedProfile);

      try {
        const [progressRes, resultsRes, level2Res] = await Promise.all([
          fetch(buildApiUrl(`/api/progress/${session.user.id}`)),
          fetch(buildApiUrl(`/api/results/${session.user.id}`)),
          fetch(buildApiUrl(`/api/level2/results/${session.user.id}`)),
        ]);

        const progressData = await progressRes.json();
        const resultsData = await resultsRes.json();
        const level2Data = await level2Res.json();

        // Robust check: If most recent L2 score >= 55, force unlock L3 locally
        let forceL3Unlock = false;
        let isL2Done = progressData?.level2_completed || false;

        if (level2Data && level2Data.length > 0) {
          const lastL2 = level2Data[0];
          if (lastL2.final_risk_percent >= 55.0) {
            forceL3Unlock = true;
          }
          isL2Done = true; // If we have results, it's done.
        }

        // Merge logic
        setProgress({
          ...progressData,
          level2_completed: isL2Done,
          level3_unlocked: progressData?.level3_unlocked || forceL3Unlock
        });
        setResults(resultsData || []);
      } catch (error) {
        console.error(error);
        toast({
          title: "Unable to load data",
          description: "Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate, toast]);

  const latestResult = useMemo(() => results?.[0], [results]);
  const adminSuggestion = useMemo(() => results.find((item) => item.admin_notes)?.admin_notes, [results]);

  const getAvailableAssessments = () => {
    if (!profile) return [];
    const age = profile.age;
    const assessments = [];

    if (age <= 12) {
      assessments.push({
        title: "ASD Screening",
        description: "Parent/teacher questionnaire for children",
        path: "/assessment/asd",
        icon: Brain,
      });
      assessments.push({
        title: "ADHD Screening (Child/Teen)",
        description: "Caregiver responses on focus, restlessness, impulsivity",
        path: "/assessment/adhd",
        icon: AlertCircle,
      });
    } else if (age <= 20) {
      assessments.push({
        title: "ADHD Screening (Teen)",
        description: "Homework, attention, and social impulse control",
        path: "/assessment/adhd",
        icon: AlertCircle,
      });
    } else if (age <= 59) {
      assessments.push({
        title: "ADHD Screening (Adult)",
        description: "Work focus, decision making, daily planning",
        path: "/assessment/adhd-adult",
        icon: AlertCircle,
      });
    } else {
      assessments.push({
        title: "Dementia Screening",
        description: "Memory recall, orientation, and safety awareness",
        path: "/assessment/dementia",
        icon: Brain,
      });
    }

    return assessments;
  };

  const assessments = getAvailableAssessments();

  const flaggedConditionsParam = (progress?.level2_conditions || []).join(",");

  const levelCards = [
    {
      title: "Level 1 · Screening",
      description: "Complete the bilingual questionnaire to unlock deeper levels.",
      accent: "border-blue-200 bg-gradient-to-b from-blue-50/50 to-white",
      status: progress?.level1_completed ? "Completed" : "In progress",
      button: progress?.level1_completed ? "Review results" : "Start screening",
      action: progress?.level1_completed ? () => navigate("/results") : () => navigate(assessments[0]?.path || "/results"),
      disabled: false,
    },
    {
      title: "Level 2 · Interactive",
      description: "Unlocks when any risk ≥ 55%. Includes interactive follow-ups.",
      accent: progress?.level2_unlocked ? "border-amber-200 bg-gradient-to-b from-amber-50/50 to-white" : "border-slate-200 bg-slate-50/50",
      status: progress?.level2_completed ? "Completed" : (progress?.level2_unlocked ? "Unlocked" : "Locked"),
      button: progress?.level2_completed ? "Retake Assessment" : (progress?.level2_unlocked ? "Start / Retry Level 2" : "Locked until risk ≥55%"),
      action: progress?.level2_unlocked
        ? () => navigate(`/level2${flaggedConditionsParam ? `?conditions=${encodeURIComponent(flaggedConditionsParam)}` : ""}`)
        : undefined,
      disabled: !progress?.level2_unlocked,
    },
    {
      title: "Level 3 · Guidance",
      description: "Personalised care pathways, unlocked after Level-2 review.",
      accent: progress?.level3_unlocked ? "border-rose-200 bg-gradient-to-b from-rose-50/50 to-white" : "border-slate-200 bg-slate-50/50",
      status: progress?.level3_unlocked ? "Unlocked" : "Locked",
      button: progress?.level3_unlocked ? "View Emergency Plan" : "Pending Level-2 completion",
      action: progress?.level3_unlocked ? () => navigate("/level3") : undefined,
      disabled: !progress?.level3_unlocked,
    },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
        <p className="text-sm text-muted-foreground">Preparing your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 relative overflow-hidden">
      {/* Background Image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("/medical-bg.png")' }}
      />
      <div className="fixed inset-0 bg-indigo-50/60 backdrop-blur-[2px] z-0 pointer-events-none"></div>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8 flex items-center justify-between rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur-md border border-white/50">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-indigo-600" />
            <span className="font-bold text-indigo-900">CogniWise Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/update-password">
              <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-indigo-600">
                <Lock className="h-4 w-4" /> Change Password
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-100">
              <ArrowRight className="h-4 w-4 rotate-180" /> Log out
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/50 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-slate-900">Hello, {profile?.full_name}</CardTitle>
              <CardDescription>
                Age {profile?.age} · {profile?.age_group?.toUpperCase()} • Level-1 {progress?.level1_completed ? "completed" : "pending"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                <Shield className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Level navigation logic</p>
                  <p className="text-sm text-blue-900/70">
                    Level 2 unlocks automatically only when the backend detects moderate/high risk (≥55%).
                  </p>
                </div>
              </div>
              {progress?.level2_unlocked && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900">
                  We detected elevated risk for:{" "}
                  {(progress.level2_conditions || []).map((condition) => condition.toUpperCase()).join(", ") || "N/A"}
                  . A detailed Level-2 review is recommended.
                </div>
              )}
              {adminSuggestion && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
                  <p className="text-sm font-semibold text-emerald-800">Admin suggestion</p>
                  <p className="mt-1 text-sm text-emerald-900">{adminSuggestion}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/80 shadow-sm">
            <CardHeader>
              <CardTitle>Latest status</CardTitle>
              <CardDescription>Most recent Level-1 result summary</CardDescription>
            </CardHeader>
            <CardContent>
              {latestResult ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold uppercase">{latestResult.condition_type}</p>
                    <Badge
                      variant={
                        latestResult.risk_level === "high"
                          ? "destructive"
                          : latestResult.risk_level === "moderate"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {latestResult.risk_label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Assessed on {new Date(latestResult.assessed_at).toLocaleDateString()} • Score{" "}
                    {latestResult.risk_score.toFixed(1)}%
                  </p>
                  {latestResult.requires_level2 && (
                    <div className="rounded-2xl border border-red-200 bg-red-50/80 p-3 text-sm text-red-900">
                      Level-2 is recommended for deeper evaluation.
                    </div>
                  )}
                  <Button variant="outline" className="w-full" onClick={() => navigate("/results")}>
                    View full history
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 text-sm text-muted-foreground">
                  <p>No Level-1 assessments yet.</p>
                  <Button className="w-full" onClick={() => navigate(assessments[0]?.path || "/assessment/asd")}>
                    Start your first screening
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          {levelCards.map((card) => (
            <Card key={card.title} className={`border ${card.accent} shadow-sm hover:shadow-md transition-all duration-300`}>
              <CardHeader>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge variant={card.disabled ? "outline" : "secondary"}>{card.status}</Badge>
                <Button
                  disabled={card.disabled}
                  variant={card.disabled ? "outline" : "default"}
                  className="w-full"
                  onClick={card.action}
                >
                  {card.button}
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">Level-1 screenings for you</h2>
            <Button variant="ghost" onClick={() => navigate("/chatbot")}>
              Need help? <MessageSquare className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {assessments.map((assessment) => (
              <Card
                key={assessment.path}
                className="cursor-pointer border border-slate-200 bg-white/90 shadow-sm transition hover:-translate-y-1 hover:border-blue-200"
                onClick={() => navigate(assessment.path)}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                      <assessment.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>{assessment.title}</CardTitle>
                      <CardDescription>{assessment.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="mt-2 w-full" variant="secondary">
                    Begin <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-2">
          <Card className="border-slate-200 bg-white/80 shadow-sm">
            <CardHeader>
              <CardTitle>Results & Reports</CardTitle>
              <CardDescription>Review each Level-1 submission.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reports yet. Complete Level-1 to view results.</p>
              ) : (
                results.slice(0, 3).map((result) => (
                  <div key={result.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold uppercase text-slate-800">{result.condition_type}</p>
                      <Badge
                        variant={
                          result.risk_level === "high"
                            ? "destructive"
                            : result.risk_level === "moderate"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {result.risk_label}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(result.assessed_at).toLocaleString()} • Score {result.risk_score.toFixed(1)}%
                    </p>
                    {result.admin_notes && (
                      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-900">
                        Admin note: {result.admin_notes}
                      </div>
                    )}
                  </div>
                ))
              )}
              <Button variant="outline" className="w-full" onClick={() => navigate("/results")}>
                View full history
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/80 shadow-sm">
            <CardHeader>
              <CardTitle>AI Assistant</CardTitle>
              <CardDescription>Chat in English or Kannada for clarification.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border border-purple-100 bg-purple-50/80 p-4 text-sm text-purple-900">
                <Sparkles className="mb-2 h-5 w-5" />
                Ask how to interpret results, prepare for Level-2, or share assessments with your doctor.
              </div>
              <Button className="mt-4 w-full" onClick={() => navigate("/chatbot")}>
                Open AI Assistant
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
