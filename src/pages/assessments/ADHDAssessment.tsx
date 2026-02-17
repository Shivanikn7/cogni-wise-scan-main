import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, ArrowLeft } from "lucide-react";
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

const FREQUENCY_OPTIONS = [
  { value: "5", label: "Always / ಯಾವಾಗಲೂ" },
  { value: "4", label: "Often / ಹೆಚ್ಚಾಗಿ" },
  { value: "3", label: "Sometimes / ಕೆಲವೊಮ್ಮೆ" },
  { value: "2", label: "Rarely / ಅಪರೂಪ" },
  { value: "1", label: "Never / ಒಂದೂ ಬಾರಿ ಇಲ್ಲ" },
];

const PERFORMANCE_RATING = [
  { value: "5", label: "Excellent / ಅತ್ಯುತ್ತಮ" },
  { value: "4", label: "Good / ಉತ್ತಮ" },
  { value: "3", label: "Fair / ಸರಾಸರಿ" },
  { value: "2", label: "Needs support / ಸಹಾಯ ಬೇಕು" },
  { value: "1", label: "Poor / ಕಳಪೆ" },
];

const HOMEWORK_PUNCTUALITY = [
  { value: "5", label: "Complete & on time" },
  { value: "4", label: "Mostly on time" },
  { value: "3", label: "Needs one reminder" },
  { value: "2", label: "Needs several reminders" },
  { value: "1", label: "Rarely completed" },
];

const questions: Question[] = [
  {
    id: "attention_focus",
    feature: "attention",
    en: "How often do they stay focused on homework or class tasks without drifting away?",
    kn: "ಮನೆಕೆಲಸ/ಪಾಠದಲ್ಲಿ ಗಮನ ಬೇರೆಡೆ ತೆರಳದೆ ಏಷ್ಟು ಬಾರಿ ಕೇಂದ್ರೀತವಾಗಿರುತ್ತಾರೆ?",
    infoUrl: "https://www.cdc.gov/ncbddd/adhd/diagnosis.html",
  },
  {
    id: "attention_instructions",
    feature: "attention",
    en: "Do teachers or parents need to repeat instructions multiple times for them to follow?",
    kn: "ಸೂಚನೆಗಳನ್ನು ಅನುಸರಿಸಲು ಶಿಕ್ಷಕರು/ಪೋಷಕರು ಹಲವಾರು ಬಾರಿ ಹೇಳಬೇಕಾಗುತ್ತದೆಯೇ?",
    infoUrl: "https://childmind.org/article/what-are-the-signs-of-adhd/",
  },
  {
    id: "impulsivity_interrupt",
    feature: "impulsivity",
    en: "How frequently do they interrupt conversations or shout out answers before being called?",
    kn: "ಸಂವಾದ ಅಡ್ಡಗಟ್ಟುವುದು ಅಥವಾ ಗುರು ಕೇಳುವ ಮೊದಲು ಉತ್ತರ ಕೂಗುವುದು ಎಷ್ಟು ಬಾರಿ?",
    infoUrl: "https://www.aap.org/en/patient-care/adhd-toolkit/",
  },
  {
    id: "impulsivity_decision",
    feature: "impulsivity",
    en: "Do they act quickly without thinking (running off, grabbing items suddenly)?",
    kn: "ಯೋಚಿಸದೆ ವೇಗವಾಗಿ ಕೆಲಸ (ಓಡುವುದು, ವಸ್ತು ಹಿಡಿಯುವುದು) ಮಾಡುವಿಕೆ ಎಷ್ಟು?",
    infoUrl: "https://www.chadd.org/for-parents/overview/",
  },
  {
    id: "hyperactivity_restless",
    feature: "hyperactivity",
    en: "How restless or fidgety do they appear during seated tasks?",
    kn: "ಕುಳಿತು ಮಾಡುವ ಕೆಲಸಗಳ ಸಮಯದಲ್ಲಿ ಎಷ್ಟು ಚಂಚಲ/ಅಲುಗಾಡುತ್ತಾರೆ?",
    infoUrl: "https://www.cdc.gov/ncbddd/adhd/facts.html",
  },
  {
    id: "hyperactivity_seat",
    feature: "hyperactivity",
    en: "Do they leave their seat or study place even after being reminded to stay seated?",
    kn: "ಕುಳಿತುಕೊಳ್ಳಲು ನೆನಪಿಸಿದರೂ, ಮತ್ತೆ ಕುರ್ಚಿಯಿಂದ ಎದ್ದು ತಿರುಗುತ್ತಾರೆ?",
    infoUrl: "https://www.additudemag.com/adhd-symptoms-in-children/",
  },
  {
    id: "school_feedback",
    feature: "school_performance",
    en: "How do teachers rate the child’s classwork quality and readiness?",
    kn: "ತರಗತಿ ಕಾರ್ಯದ ಗುಣಮಟ್ಟ ಹಾಗೂ ತಯಾರಿಯನ್ನು ಶಿಕ್ಷಕರು ಹೇಗೆ ಅಂಕೆ ಹಾಕುತ್ತಾರೆ?",
    infoUrl: "https://www.cdc.gov/adhd/school-success.html",
    options: PERFORMANCE_RATING,
  },
  {
    id: "school_assignments",
    feature: "school_performance",
    en: "Homework submission: neat, complete, and turned in on time?",
    kn: "ಮನೆಕೆಲಸ neat ಆಗಿ, ಪೂರ್ಣವಾಗಿ, ಸಮಯಕ್ಕೆ ತರುವ ಆವರ್ತಿ?",
    infoUrl: "https://kidshealth.org/en/parents/adhd-school.html",
    options: HOMEWORK_PUNCTUALITY,
  },
  {
    id: "task_homework",
    feature: "task_completion_time_sec",
    en: "Completes a 30-minute homework block within the expected duration without frustration.",
    kn: "30 ನಿಮಿಷದ ಮನೆಕೆಲಸವನ್ನು ನಿರೀಕ್ಷಿತ ಸಮಯದಲ್ಲಿ ಬೇಸರವಿಲ್ಲದೆ ಮುಗಿಸುತ್ತಾನೆಯೇ?",
    infoUrl: "https://www.understood.org/en/articles/homework-adhd",
    options: HOMEWORK_PUNCTUALITY,
  },
  {
    id: "task_reminder",
    feature: "task_completion_time_sec",
    en: "How many reminders do they need to finish chores or study routines?",
    kn: "ಕೈಪಾಡು/ಅಧ್ಯಯನ ಮುಗಿಸಲು ಎಷ್ಟು ಬಾರಿ ನೆನಪಿಸಬೇಕಾಗುತ್ತದೆ?",
    infoUrl: "https://childmind.org/article/homework-help/",
    options: [
      { value: "5", label: "Completes after one reminder" },
      { value: "4", label: "Needs a couple of reminders" },
      { value: "3", label: "Needs reminders plus supervision" },
      { value: "2", label: "Needs constant supervision" },
      { value: "1", label: "Even with supervision struggles" },
    ],
  },
];

const ADHDAssessment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    questions.forEach((q) => {
      initial[q.id] = "";
    });
    return initial;
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
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

      // Calculate features for ADHD
      const featureGroups: Record<string, number[]> = {};

      // Questions where High Score (5) = Good Performance (Low Risk).
      // We invert these so that 5 becomes 1 (Low Risk) and 1 becomes 5 (High Risk).
      // This ensures that for all features, HIGHER value = HIGHER RISK.
      const positiveTraits = [
        "attention_focus",
        "school_feedback",
        "school_assignments",
        "task_homework",
        "task_reminder"
      ];

      questions.forEach((question) => {
        let value = Number(answers[question.id]);

        if (positiveTraits.includes(question.id)) {
          value = 6 - value; // Invert 1-5 scale
        }

        featureGroups[question.feature] = featureGroups[question.feature] || [];
        featureGroups[question.feature].push(value);
      });

      const features = Object.entries(featureGroups).reduce(
        (acc, [feature, values]) => ({
          ...acc,
          [feature]: Math.max(...values),
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
          condition: "adhd",
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
              <AlertCircle className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">ADHD Screening (Children & Teens)</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-3xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>ADHD Assessment for Children & Teens</CardTitle>
              <CardDescription>
                Parent, guardian, ಅಥವಾ ಶಿಕ್ಷಕರು ಈ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸುವುದು. English + Kannada mix ಸ್ವೀಕಾರಾರ್ಹ.
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
                    {(question.options ?? FREQUENCY_OPTIONS).map((option) => (
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
                disabled={loading || Object.keys(answers).length !== questions.length}
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

export default ADHDAssessment;
