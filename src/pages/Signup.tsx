import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showCaretakerFields, setShowCaretakerFields] = useState(false);
  const [showHealthStatusField, setShowHealthStatusField] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    age: "",
    guardianName: "",
    guardianRelation: "",
    phone: "",
    caretakerName: "",
    caretakerRelation: "",
    healthStatusSummary: "",
    gender: "",
    address: "",
  });

  const determineAgeGroup = (age: number): string => {
    if (age >= 0 && age <= 12) return "child";
    if (age >= 13 && age <= 20) return "teen";
    if (age >= 21 && age <= 59) return "adult";
    return "elderly";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const age = parseInt(formData.age);
      if (isNaN(age) || age < 3 || age > 90) {
        throw new Error("Invalid age. The valid age range for cognitive screening is 3 to 90 years.");
      }

      const ageGroup = determineAgeGroup(age);

      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // Create profile with dynamic column handling for caretaker fields
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const profileData: any = {
          id: authData.user.id,
          full_name: formData.fullName,
          age: age,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          age_group: ageGroup as any,
          phone: formData.phone || null,
          guardian_name: age <= 12 ? formData.guardianName : null,
          guardian_relation: age <= 12 ? formData.guardianRelation : null,
          gender: formData.gender,
          address: formData.address,
        };

        // Add caretaker fields if they exist in the form (for users 60+)
        if (age >= 60) {
          profileData.caretaker_name = formData.caretakerName;
          profileData.caretaker_relation = formData.caretakerRelation;
          profileData.health_status_summary = formData.healthStatusSummary;
        }

        const { error: profileError } = await supabase
          .from("profiles")
          .insert([profileData]);

        if (profileError) {
          console.warn("Full profile insert failed, retrying with basic data:", profileError);

          // Fallback: minimal fields only
          const basicProfileData = {
            id: authData.user.id,
            full_name: formData.fullName,
            age: age,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            age_group: ageGroup as any,
            // Try to include phone and guardian if possible, assuming they are standard columns?
            // If they fail too, we might need an even simpler fallback.
            // Let's assume phone/guardian are safer.
            phone: formData.phone || null,
            guardian_name: age <= 12 ? formData.guardianName : null,
            guardian_relation: age <= 12 ? formData.guardianRelation : null,
            gender: formData.gender,
            address: formData.address,
          };

          const { error: basicProfileError } = await supabase
            .from("profiles")
            .insert([basicProfileData]);

          if (basicProfileError) {
            console.error("Basic profile insert failed:", basicProfileError);
            // One last desperate attempt: just ID, Name, Age (assuming other columns nullable)
            const minimalProfileData = {
              id: authData.user.id,
              full_name: formData.fullName,
              age: age,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              age_group: ageGroup as any,
            };
            const { error: minimalError } = await supabase.from("profiles").insert([minimalProfileData]);
            if (minimalError) throw minimalError;
          }

          toast({
            title: "Account created!",
            description: "Welcome to NeuroAssess AI. Let's get started.",
            variant: "default",
          });
        } else {
          toast({
            title: "Account created!",
            description: "Welcome to NeuroAssess AI. Let's get started.",
          });
        }

        navigate("/dashboard");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Signup process failed:", error);
      toast({
        title: "Signup failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate age-related visibility flags
  const ageNum = formData.age ? parseInt(formData.age) : 0;
  const showGuardianFields = ageNum > 0 && ageNum <= 12;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4 relative overflow-hidden">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("/medical-bg.png")' }}
      />
      <div className="fixed inset-0 bg-white/40 backdrop-blur-[3px] z-0 pointer-events-none"></div>
      <Card className="w-full max-w-2xl relative z-10 bg-white/90 backdrop-blur-md shadow-2xl border-white/50">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Brain className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            Get started with your cognitive health assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="25"
                min="3"
                max="90"
                value={formData.age}
                onChange={(e) => {
                  const newAge = e.target.value;
                  const ageNum = newAge ? parseInt(newAge) : 0;
                  setFormData({ ...formData, age: newAge });
                  setShowCaretakerFields(ageNum >= 60);
                  setShowHealthStatusField(ageNum >= 60);
                }}
                required
              />
            </div>

            {showGuardianFields && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="guardianName">Guardian/Parent Name</Label>
                  <Input
                    id="guardianName"
                    placeholder="Parent's name"
                    value={formData.guardianName}
                    onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guardianRelation">Relation to Child</Label>
                  <Select
                    value={formData.guardianRelation}
                    onValueChange={(value) => setFormData({ ...formData, guardianRelation: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select relation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="caregiver">Caregiver</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {showCaretakerFields && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="caretakerName">Caretaker Name</Label>
                  <Input
                    id="caretakerName"
                    placeholder="Caretaker's full name"
                    value={formData.caretakerName}
                    onChange={(e) => setFormData({ ...formData, caretakerName: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Required for patients 60+ who may need assistance with assessments</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="caretakerRelation">Relation to Patient</Label>
                  <Select
                    value={formData.caretakerRelation}
                    onValueChange={(value) => setFormData({ ...formData, caretakerRelation: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select relation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="relative">Relative</SelectItem>
                      <SelectItem value="caregiver">Caregiver</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {showHealthStatusField && (
              <div className="space-y-2">
                <Label htmlFor="healthStatusSummary">Health Status Summary (Optional)</Label>
                <Textarea
                  id="healthStatusSummary"
                  placeholder="Brief summary of current health conditions, medications, or concerns (especially relevant for dementia assessment)"
                  value={formData.healthStatusSummary}
                  onChange={(e) => setFormData({ ...formData, healthStatusSummary: e.target.value })}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">This information helps provide more accurate assessments</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Enter full address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 1234567890"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
              ← Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
