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

const FREQUENCY_SCALE = [
  { value: "5", label: "Very Often / ಬಹಳ ಹೆಚ್ಚಾಗಿ (High impact)" },
  { value: "4", label: "Often / ಹೆಚ್ಚಾಗಿ" },
  { value: "3", label: "Sometimes / ಕೆಲವೊಮ್ಮೆ" },
  { value: "2", label: "Rarely / ಅಪರೂಪ" },
  { value: "1", label: "Never / ಇಲ್ಲವೇ ಇಲ್ಲ" },
];

const questions: Question[] = [
  {
    id: "work_focus",
    feature: "attention",
    en: "Do you have trouble wrapping up the final details of a project once the challenging parts are done?",
    kn: "ಯೋಜನೆಯ ಸವಾಲಿನ ಭಾಗಗಳು ಮುಗಿದ ನಂತರ ಅಂತಿಮ ವಿವರಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಲು ನಿಮಗೆ ತೊಂದರೆಯಾಗುತ್ತದೆಯೇ?",
    infoUrl: "https://add.org/adhd-workplace/",
    options: FREQUENCY_SCALE
  },
  {
    id: "organization",
    feature: "attention",
    en: "Do you have difficulty getting things in order when you have to do a task that requires organization?",
    kn: "ವ್ಯವಸ್ಥಿತವಾಗಿ ಮಾಡಬೇಕಾದ ಕೆಲಸವನ್ನು ಮಾಡುವಾಗ ವಸ್ತುಗಳನ್ನು ಜೋಡಿಸಲು ಕಷ್ಟವಾಗುತ್ತದೆಯೇ?",
    infoUrl: "https://chadd.org/for-adults/organizing-the-home-and-office/",
    options: FREQUENCY_SCALE
  },
  {
    id: "appointments",
    feature: "memory_recall",
    en: "Do you have problems remembering appointments or obligations?",
    kn: "ನೇಮಕಾತಿ ಅಥವಾ ಜವಾಬ್ದಾರಿಗಳನ್ನು ನೆನಪಿಟ್ಟುಕೊಳ್ಳಲು ನಿಮಗೆ ಸಮಸ್ಯೆ ಇದೆಯೇ?",
    infoUrl: "https://www.nhs.uk/conditions/attention-deficit-hyperactivity-disorder-adhd/symptoms/",
    options: FREQUENCY_SCALE
  },
  {
    id: "procrastination",
    feature: "task_completion_time_sec",
    en: "When you have a task that requires a lot of thought, do you avoid or delay getting started?",
    kn: "ಹೆಚ್ಚು ಯೋಚನೆ ಮಾಡಬೇಕಾದ ಕೆಲಸವಿದ್ದಾಗ, ಅದನ್ನು ಪ್ರಾರಂಭಿಸಲು ನೀವು ವಿಳಂಬ ಮಾಡುತ್ತೀರಾ?",
    infoUrl: "https://www.additudemag.com/procrastination-adhd-symptoms-strategies/",
    options: FREQUENCY_SCALE
  },
  {
    id: "fidgeting",
    feature: "hyperactivity",
    en: "Do you fidget or squirm with your hands or feet when you have to sit down for a long time?",
    kn: "ದೀರ್ಘಕಾಲ ಕುಳಿತುಕೊಳ್ಳಬೇಕಾದಾಗ ನೀವು ಕೈ ಅಥವಾ ಕಾಲುಗಳನ್ನು ಅಲುಗಾಡಿಸುತ್ತೀರಾ?",
    infoUrl: "https://www.webmd.com/add-adhd/adult-adhd-symptoms",
    options: FREQUENCY_SCALE
  },
  {
    id: "motor_driven",
    feature: "hyperactivity",
    en: "Do you feel overly active and compelled to do things, like you were driven by a motor?",
    kn: "ನೀವು ಅತಿಯಾಗಿ ಸಕ್ರಿಯರಾಗಿದ್ದೀರಿ ಮತ್ತು ಮೋಟಾರ್‌ನಿಂದ ಓಡುತ್ತಿರುವಂತೆ ಕೆಲಸ ಮಾಡಲು ಒತ್ತಾಯಿಸುತ್ತೀರಾ?",
    infoUrl: "https://my.clevelandclinic.org/health/diseases/5197-adhd-adult-adhd",
    options: FREQUENCY_SCALE
  },
  {
    id: "careless_mistakes",
    feature: "attention",
    en: "How often do you make careless mistakes when you have to work on a boring or difficult project?",
    kn: "ಬೇಸರದ ಅಥವಾ ಕಷ್ಟಕರವಾದ ಯೋಜನೆಯಲ್ಲಿ ಕೆಲಸ ಮಾಡುವಾಗ ನೀವು ಎಷ್ಟು ಬಾರಿ ಅಜಾಗರೂಕ ತಪ್ಪುಗಳನ್ನು ಮಾಡುತ್ತೀರಿ?",
    infoUrl: "https://www.mayoclinic.org/diseases-conditions/adult-adhd/symptoms-causes/syc-20350878",
    options: FREQUENCY_SCALE
  },
  {
    id: "concentration_noise",
    feature: "attention",
    en: "Do you find it difficult to concentrate when there is noise or activity around you?",
    kn: "ಸುತ್ತಮುತ್ತ ಶಬ್ದ ಅಥವಾ ಚಟುವಟಿಕೆ ಇದ್ದಾಗ ಗಮನ ಹರಿಸಲು ಕಷ್ಟವಾಗುತ್ತದೆಯೇ?",
    infoUrl: "https://chadd.org/for-adults/workplace-issues/",
    options: FREQUENCY_SCALE
  },
  {
    id: "interruption",
    feature: "impulsivity",
    en: "Do you interrupt others when they are busy?",
    kn: "ಇತರರು ಕಾರ್ಯನಿರತರಾಗಿದ್ದಾಗ ನೀವು ಅವರಿಗೆ ಅಡ್ಡಿಪಡಿಸುತ್ತೀರಾ?",
    infoUrl: "https://www.help4adhd.org/understanding-adhd/adults/",
    options: FREQUENCY_SCALE
  },
  {
    id: "waiting_turn",
    feature: "impulsivity",
    en: "Do you have difficulty waiting your turn in situations when waiting is expected?",
    kn: "ಸರತಿ ಸಾಲಿನಲ್ಲಿ ಅಥವಾ ಕಾಯಬೇಕಾದ ಸಂದರ್ಭಗಳಲ್ಲಿ ಕಾಯಲು ನಿಮಗೆ ಕಷ್ಟವಾಗುತ್ತದೆಯೇ?",
    infoUrl: "https://www.verywellmind.com/adhd-symptoms-4157281",
    options: FREQUENCY_SCALE
  },
];

const ADHDAdultAssessment = () => {
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
        // if (retry.error) throw retry.error; // Dont throw, try to proceed with partial data or defaults
        profile = retry.data as any;
      }

      // If profile is still null, create a dummy one to avoid crash
      if (!profile) {
        console.warn("Profile not found even after retry, using defaults");
        profile = { age: 30, age_group: "Adult", full_name: session.user.email?.split('@')[0] || "User", gender: "Not Specified", address: "" } as any;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const typedProfile = profile as any;
      if (!typedProfile) throw new Error("Profile not found");

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
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ADHD Screening (Adults)</span>
          </div>
        </div>

      </header >

      <main className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-3xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>ADHD Assessment for Adults</CardTitle>
              <CardDescription>
                Please answer all questions honestly based on your recent behavior and experiences.
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
                    {(question.options ?? FREQUENCY_SCALE).map((option) => (
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
    </div >
  );
};

export default ADHDAdultAssessment;
