import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft } from "lucide-react";

const LevelTwoHub = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const conditions = useMemo(() => {
    const value = params.get("conditions");
    if (!value) return [];
    return value
      .split(",")
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean);
  }, [params]);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-cyan-50 via-white to-sky-50 py-12">
      <div className="container mx-auto max-w-3xl px-4">
        <Button variant="ghost" className="mb-6" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to dashboard
        </Button>

        <Card className="border-blue-100 bg-white/90 shadow-xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-3xl font-semibold text-slate-900">Level 2 · Interactive Review</CardTitle>
            <CardDescription>
              Detailed Level-2 modules (video prompts, clinician Q&A, and interactive tasks) are rolling out. Your
              dashboard unlocked this step because of elevated Level-1 risk.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm leading-relaxed text-slate-600">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5" />
                <p className="font-semibold">Conditions flagged for Level-2 follow-up</p>
              </div>
              <p className="mt-2 text-sm">
                {conditions.length > 0 ? conditions.join(", ") : "Your profile will unlock Level-2 once a Level-1 score crosses 55%."}
              </p>
            </div>

            <p>
              Level-2 collects richer behavioural signals using scenario-based questions, audio/video tasks, and short
              caregiver interviews. This data is reviewed by specialists before unlocking Level-3 guidance.
            </p>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-blue-900">
              <p className="font-semibold">Coming soon</p>
              <p className="mt-1 text-sm">
                We will notify you by email when Level-2 becomes available for your condition. Meanwhile, you can chat
                with the AI assistant for interim recommendations.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button className="rounded-full" onClick={() => navigate("/chatbot")}>
                Ask AI assistant
              </Button>
              <Button variant="outline" className="rounded-full" onClick={() => navigate("/results")}>
                Review Level-1 results
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LevelTwoHub;

