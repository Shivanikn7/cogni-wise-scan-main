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
  options: { value: string; label: string }[];
};

const LIKERT_OPTIONS = [
  { value: "5", label: "Always" },
  { value: "4", label: "Often" },
  { value: "3", label: "Sometimes" },
  { value: "2", label: "Rarely" },
  { value: "1", label: "Never" },
];

const questions: Question[] = [
  {
    id: "eye_contact",
    feature: "eye_contact",
    en: "Does the child look at your face when you call their name?",
    kn: "ನೀವು ಹೆಸರಿನಿಂದ ಕರೆಸಿದಾಗ ಮಗು ನಿಮ್ಮ ಮುಖದ ಕಡೆ ನೋಡುತ್ತದೆಯೇ?",
    infoUrl: "https://www.cdc.gov/ncbddd/autism/hcp-dsm.html",
    options: LIKERT_OPTIONS,
  },
  {
    id: "joint_attention",
    feature: "social_interaction",
    en: "Does the child try to show toys or objects to others?",
    kn: "ಮಗು ತನ್ನ ಆಟಿಕೆಗಳನ್ನೋ ವಸ್ತುಗಳನ್ನೋ ಇತರರಿಗೆ ತೋರಿಸಲು ಪ್ರಯತ್ನಿಸುತ್ತದೆಯೇ?",
    infoUrl: "https://www.cdc.gov/ncbddd/autism/hcp-dsm.html",
    options: LIKERT_OPTIONS,
  },
  {
    id: "peer_interaction",
    feature: "social_interaction",
    en: "Does the child try to play with other children?",
    kn: "ಮಗು ಇತರ ಮಕ್ಕಳ ಜೊತೆ ಆಟ ಆಡಲು ಮುಂದಾಗುತ್ತದೆಯೇ?",
    infoUrl: "https://www.cdc.gov/ncbddd/autism/hcp-dsm.html",
    options: LIKERT_OPTIONS,
  },
  {
    id: "sensory_reaction_sound",
    feature: "sensory_sensitivity",
    en: "Does the child get upset by sudden loud sounds?",
    kn: "ಜೋರಾಗಿ ಶಬ್ದವಾದಾಗ ಮಗು ಬೇಸರಗೊಳ್ಳುತ್ತದೆಯೇ ಅಥವಾ ಹೆದರುತ್ತದೆಯೇ?",
    infoUrl: "https://www.cdc.gov/ncbddd/autism/hcp-dsm.html",
    options: LIKERT_OPTIONS,
  },
  {
    id: "sensory_reaction_touch",
    feature: "sensory_sensitivity",
    en: "Does the child avoid touching certain textures or clothing?",
    kn: "ಕೆಲವು ಬಟ್ಟೆಗಳ ಸ್ಪರ್ಶವನ್ನು ಮಗು ತಪ್ಪಿಸಿಕೊಳ್ಳುತ್ತದೆಯೇ?",
    infoUrl: "https://www.cdc.gov/ncbddd/autism/hcp-dsm.html",
    options: LIKERT_OPTIONS,
  },
  {
    id: "language_delay",
    feature: "communication_delay",
    en: "Does the child take time to respond when spoken to?",
    kn: "ಮಾತನಾಡಿದಾಗ ಮಗು ಪ್ರತಿಕ್ರಿಯಿಸಲು ಹೆಚ್ಚಿನ ಸಮಯ ತೆಗೆದುಕೊಳ್ಳುತ್ತದೆಯೇ?",
    infoUrl: "https://www.cdc.gov/ncbddd/autism/hcp-dsm.html",
    options: LIKERT_OPTIONS,
  },
  {
    id: "speech_clarity",
    feature: "communication_delay",
    en: "Does the child have difficulty expressing their needs in words?",
    kn: "ತನ್ನ ಅವಶ್ಯಕತೆಗಳನ್ನು ಮಾತಿನಲ್ಲಿ ಹೇಳಲು ಮಗುವಿಗೆ ಕಷ್ಟವಾಗುತ್ತದೆಯೇ?",
    infoUrl: "https://www.cdc.gov/ncbddd/autism/hcp-dsm.html",
    options: LIKERT_OPTIONS,
  },
  {
    id: "repetitive_movements",
    feature: "repetitive_behaviour",
    en: "Does the child flap hands, rock body, or repeat movements?",
    kn: "ಮಗು ಕೈಕುಲುಕುವುದು, ತೂಗುವುದು ಅಥವಾ ಒಂದೇ ಚಟುವಟಿಕೆಯನ್ನು ಮರುಮರು ಮಾಡುತ್ತದೆಯೇ?",
    infoUrl: "https://www.cdc.gov/ncbddd/autism/hcp-dsm.html",
    options: LIKERT_OPTIONS,
  },
  {
    id: "strict_routines",
    feature: "repetitive_behaviour",
    en: "Does the child get upset if a routine is changed?",
    kn: "ದಿನಚರಿಯಲ್ಲಿ ಬದಲಾವಣೆ ಮಾಡಿದರೆ ಮಗು ಬೇಸರಗೊಳ್ಳುತ್ತದೆಯೇ?",
    infoUrl: "https://www.cdc.gov/ncbddd/autism/hcp-dsm.html",
    options: LIKERT_OPTIONS,
  },
  {
    id: "focus_single_activity",
    feature: "score",
    en: "Does the child fixate on one object or topic for a long time?",
    kn: "ಒಂದೇ ಆಟಿಕೆ ಅಥವಾ ವಿಷಯದ ಮೇಲೆ ಮಗು ಹೆಚ್ಚು ಸಮಯ ಒತ್ತು ನೀಡುತ್ತದೆಯೇ?",
    infoUrl: "https://www.cdc.gov/ncbddd/autism/hcp-dsm.html",
    options: LIKERT_OPTIONS,
  },
];

const ASDAssessment = () => {
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

      // Calculate scores
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
          condition: "asd",
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
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        const progressRes = await fetch(buildApiUrl(`/api/progress/${currentSession.user.id}`));
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
              <span className="text-xl font-bold">ASD Screening</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-3xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Autism Spectrum Disorder Assessment</CardTitle>
              <CardDescription>
                Please answer all questions based on the child's behaviour. This form is meant for parents, teachers,
                or caregivers to complete in English or Kannada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {questions.map((question, index) => (
                <div key={question.id} className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">
                      {index + 1}. {question.en}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">{question.kn}</p>
                  </div>
                  <RadioGroup
                    value={answers[question.id]}
                    onValueChange={(value) => setAnswers({ ...answers, [question.id]: value })}
                  >
                    {question.options.map((option) => (
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

export default ASDAssessment;
