import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Brain, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { buildApiUrl } from "@/lib/api";

type Question = {
  id: string;
  feature: string;
  en: string;
  kn: string;
  infoUrl: string;
  options?: { value: string; label: string }[];
};

const SYMPTOM_FREQUENCY = [
  { value: "5", label: "Always / ಯಾವಾಗಲೂ (High concern)" },
  { value: "4", label: "Often / ಹೆಚ್ಚಾಗಿ" },
  { value: "3", label: "Sometimes / ಕೆಲವೊಮ್ಮೆ" },
  { value: "2", label: "Rarely / ಅಪರೂಪ" },
  { value: "1", label: "Never / ಇಲ್ಲವೇ ಇಲ್ಲ (No concern)" },
];

const questions: Question[] = [
  {
    id: "memory_recall",
    feature: "memory_recall",
    en: "How often do they forget recent conversations or events?",
    kn: "ಇತ್ತೀಚಿನ ಮಾತುಕತೆಯನ್ನು ಅಥವಾ ಘಟನೆಗಳನ್ನು ಎಷ್ಟು ಬಾರಿ ಮರೆತುಹೋಗುತ್ತಾರೆ?",
    infoUrl: "https://www.alz.org/alzheimers-dementia/10_signs",
    options: SYMPTOM_FREQUENCY
  },
  {
    id: "repeating_questions",
    feature: "memory_recall",
    en: "Do they repeat the same question or story within a short time?",
    kn: "ಒಂದೇ ಪ್ರಶ್ನೆ ಅಥವಾ ಕಥೆಯನ್ನು ಅಲ್ಪಾವಧಿಯಲ್ಲಿಯೇ ಮರುಮರು ಹೇಳುತ್ತಾರೆಯೇ?",
    infoUrl: "https://www.nia.nih.gov/health/alzheimers-symptoms-and-diagnosis/what-are-signs-alzheimers-disease",
    options: SYMPTOM_FREQUENCY
  },
  {
    id: "orientation_time",
    feature: "orientation_score",
    en: "Do they lose track of the date, season, or passage of time?",
    kn: "ದಿನಾಂಕ, ಋತು ಅಥವಾ ಸಮಯದ ಬಗ್ಗೆ ಅವರಿಗೆ ಅರಿವು ತಪ್ಪುತ್ತದೆಯೇ?",
    infoUrl: "https://www.mayoclinic.org/diseases-conditions/dementia/symptoms-causes/syc-20352013",
    options: SYMPTOM_FREQUENCY
  },
  {
    id: "orientation_place",
    feature: "orientation_score",
    en: "Do they get lost in familiar places or forget where they are?",
    kn: "ಪರಿಚಿತ ಸ್ಥಳಗಳಲ್ಲಿ ದಾರಿ ತಪ್ಪುತ್ತಾರೆಯೇ ಅಥವಾ ಎಲ್ಲಿದ್ದಾರೆಂದು ಮರೆಯುತ್ತಾರೆಯೇ?",
    infoUrl: "https://www.nhs.uk/conditions/dementia/symptoms/",
    options: SYMPTOM_FREQUENCY
  },
  {
    id: "language_difficulty",
    feature: "language_score",
    en: "Do they struggle to follow or join a conversation?",
    kn: "ಸಂಭಾಷಣೆಯನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಅಥವಾ ಭಾಗವಹಿಸಲು ಕಷ್ಟಪಡುತ್ತಾರೆಯೇ?",
    infoUrl: "https://www.alz.org/alzheimers-dementia/what-is-dementia/types-of-dementia/aphasia",
    options: SYMPTOM_FREQUENCY
  },
  {
    id: "misplacing_items",
    feature: "memory_recall",
    en: "Do they put things in unusual places and lose the ability to retrace steps?",
    kn: "ವಸ್ತುಗಳನ್ನು ವಿಚಿತ್ರ ಜಾಗಗಳಲ್ಲಿ ಇಡುತ್ತಾರೆಯೇ ಮತ್ತು ಅವುಗಳನ್ನು ಹುಡುಕಲು ಸಾಧ್ಯವಾಗುವುದಿಲ್ಲವೇ?",
    infoUrl: "https://www.nia.nih.gov/health/alzheimers-changes-thinking-and-memory/misplacing-things",
    options: SYMPTOM_FREQUENCY
  },
  {
    id: "problem_solving",
    feature: "problem_solving",
    en: "Do they have trouble handling money or paying bills?",
    kn: "ಹಣಕಾಸು ನಿರ್ವಹಣೆ ಅಥವಾ ಬಿಲ್ ಪಾವತಿಸಲು ತೊಂದರೆ ಅನುಭವಿಸುತ್ತಾರೆಯೇ?",
    infoUrl: "https://www.bgs.org.uk/resources/money-management-and-dementia",
    options: SYMPTOM_FREQUENCY
  },
  {
    id: "daily_tasks",
    feature: "problem_solving",
    en: "Do they struggle to complete familiar daily tasks (e.g., cooking, driving)?",
    kn: "ದಿನನಿತ್ಯದ ಪರಿಚಿತ ಕೆಲಸಗಳನ್ನು (ಅಡುಗೆ, ವಾಹನ ಚಾಲನೆ) ಮಾಡಲು ಕಷ್ಟವಾಗುತ್ತದೆಯೇ?",
    infoUrl: "https://www.alz.org/help-support/caregiving/daily-care/daily-care-plan",
    options: SYMPTOM_FREQUENCY
  },
  {
    id: "mood_changes",
    feature: "reaction_time_ms",
    en: "Have they become confused, suspicious, depressed, or anxious?",
    kn: "ಅವರು ಗೊಂದಲ, ಸಂಶಯ, ಖಿನ್ನತೆ ಅಥವಾ ಆತಂಕಕ್ಕೆ ಒಳಗಾಗಿದ್ದಾರೆಯೇ?",
    infoUrl: "https://www.alz.org/help-support/caregiving/stages-behaviors/anxiety-agitation",
    options: SYMPTOM_FREQUENCY
  },
  {
    id: "withdrawal",
    feature: "score",
    en: "Do they withdraw from work or social activities?",
    kn: "ಕೆಲಸ ಅಥವಾ ಸಾಮಾಜಿಕ ಚಟುವಟಿಕೆಗಳಿಂದ ದೂರ ಉಳಿಯುತ್ತಾರೆಯೇ?",
    infoUrl: "https://www.alz.org/alzheimers-dementia/10_signs",
    options: SYMPTOM_FREQUENCY
  },
];

const DementiaAssessment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    // Initialize with empty strings for all questions to keep RadioGroup controlled
    const initialAnswers: Record<string, string> = {};
    questions.forEach(question => {
      initialAnswers[question.id] = "";
    });
    return initialAnswers;
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const unansweredQuestions = questions.filter(q => !answers[q.id] || answers[q.id] === "");
    if (unansweredQuestions.length > 0) {
      toast({
        title: "Incomplete assessment",
        description: "Please answer all questions before submitting.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      let { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("age, age_group, full_name, gender, address")
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        console.warn("Extended profile fetch failed, retrying basics:", profileError);
        const retry = await supabase.from("profiles").select("age, full_name").eq("id", session.user.id).single();
        if (retry.error) throw retry.error;
        profile = retry.data as any;
      }

      if (!profile) throw new Error("Profile not found");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const typedProfile = profile as any;

      const featureGroups: Record<string, number[]> = {};
      questions.forEach((question) => {
        const value = Number(answers[question.id]);
        featureGroups[question.feature] = featureGroups[question.feature] || [];
        featureGroups[question.feature].push(value);
      });

      const features = Object.entries(featureGroups).reduce(
        (acc, [feature, values]) => ({
          ...acc,
          [feature]: Math.max(...values), // Use MAX to preserve highest symptom severity
        }),
        { age: typedProfile.age },
      );

      // Call Flask backend for prediction + storage
      const response = await fetch(buildApiUrl("/api/submit-level1"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: session.user.id,
          user_email: session.user.email,
          user_name: typedProfile.full_name,
          condition: "dementia",
          age: typedProfile.age,
          age_group: typedProfile.age_group,
          gender: typedProfile.gender,
          address: typedProfile.address,
          questionnaire_responses: answers,
          features,
        }),
      });

      const prediction = await response.json();

      if (!response.ok) {
        throw new Error(prediction.message || "Failed to submit assessment");
      }

      toast({
        title: "Assessment complete!",
        description: "Your results have been saved.",
      });

      // Check if user needs to complete more assessments
      const { data: { session: currentSession2 } } = await supabase.auth.getSession();
      if (currentSession2) {
        const progressRes = await fetch(buildApiUrl(`/api/progress/${currentSession2.user.id}`));
        const progressData = await progressRes.json();

        // If level 1 is not completed, there might be more assessments
        if (!progressData.level1_completed) {
          navigate("/dashboard");
          return;
        }
      }

      navigate("/results");
    } catch (error) {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative flex flex-col overflow-hidden">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("/medical-bg.png")' }}
      />
      <div className="fixed inset-0 bg-white/80 backdrop-blur-[2px] z-0 pointer-events-none"></div>

      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 shadow-sm relative">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Dementia Screening</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-3xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Dementia Cognitive Assessment</CardTitle>
              <CardDescription>
                Please answer all questions honestly. This assessment can be completed with the help of a family member or caregiver (English + Kannada mixed responses welcome).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {questions.map((question, index) => (
                <div key={question.id} className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">
                      {index + 1}. {question.en}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-3">
                      {question.kn}
                      <a
                        href={question.infoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-primary underline"
                      >
                        Why we ask this
                      </a>
                    </p>
                  </div>
                  <RadioGroup
                    value={answers[question.id]}
                    onValueChange={(value) => setAnswers({ ...answers, [question.id]: value })}
                  >
                    {(question.options ?? SYMPTOM_FREQUENCY).map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                        <Label htmlFor={`${question.id}-${option.value}`} className="font-normal cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}

              <Button
                onClick={handleSubmit}
                className="w-full"
                size="lg"
                disabled={loading || questions.some(q => !answers[q.id] || answers[q.id] === "")}
              >
                {loading ? "Analyzing..." : "Submit Assessment"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DementiaAssessment;
