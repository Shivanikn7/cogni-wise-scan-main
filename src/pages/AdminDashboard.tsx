import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Users, ClipboardList, NotebookPen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { buildApiUrl } from "@/lib/api";
import { clearAdminToken, getAdminToken } from "@/lib/admin-auth";

type LevelProgress = {
  user_id: string;
  level1_completed: boolean;
  level2_completed?: boolean;
  level3_completed?: boolean;
  level2_unlocked: boolean;
  level3_unlocked: boolean;
  level2_conditions: string[];
  level3_conditions: string[];
  updated_at: string;
};

type AdminUserRecord = {
  user_id: string;
  name: string | null;
  email: string | null;
  age: number | null;
  gender?: string | null;
  address?: string | null;
  age_group: string | null;
  last_assessed: string;
  level_progress: LevelProgress;
};

type AssessmentRecord = {
  id: number;
  user_id: string;
  condition_type: string;
  age_group: string;
  questionnaire_responses: Record<string, string | number>;
  ml_features: Record<string, number>;
  risk_score: number;
  risk_level: string;
  risk_label: string;
  requires_level2: boolean;
  admin_notes?: string | null;
  assessed_at: string;
};

function getDisplayAgeGroup(user: AdminUserRecord): string {
  if (user.age_group) return user.age_group.replace(/^\w/, (c) => c.toUpperCase());
  if (user.age == null) return "N/A";
  const a = Number(user.age);
  if (Number.isNaN(a)) return "N/A";
  if (a < 13) return "Child";
  if (a < 18) return "Teen";
  if (a < 65) return "Adult";
  return "Elderly";
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [notesDrafts, setNotesDrafts] = useState<Record<number, string>>({});
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingAssessments, setLoadingAssessments] = useState(false);

  const token = getAdminToken();

  useEffect(() => {
    if (!token) {
      navigate("/admin-login");
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await fetch(buildApiUrl("/api/admin/users"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          clearAdminToken();
          navigate("/admin-login");
          return;
        }

        const data = await response.json();
        setUsers(data);
        if (data.length > 0) {
          setSelectedUserId(data[0].user_id);
        }
      } catch (error) {
        console.error(error);
        toast({
          title: "Failed to load users",
          description: "Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [navigate, toast, token]);

  useEffect(() => {
    const fetchAssessments = async () => {
      if (!token || !selectedUserId) return;
      setLoadingAssessments(true);
      try {
        const response = await fetch(buildApiUrl(`/api/admin/users/${selectedUserId}/assessments`), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          clearAdminToken();
          navigate("/admin-login");
          return;
        }

        const data = await response.json();
        setAssessments(data);
        const drafts: Record<number, string> = {};
        data.forEach((item: AssessmentRecord) => {
          drafts[item.id] = item.admin_notes || "";
        });
        setNotesDrafts(drafts);
      } catch (error) {
        console.error(error);
        toast({
          title: "Failed to load assessments",
          description: "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingAssessments(false);
      }
    };

    fetchAssessments();
  }, [navigate, selectedUserId, toast, token]);

  const selectedUser = useMemo(
    () => users.find((user) => user.user_id === selectedUserId) || null,
    [users, selectedUserId],
  );

  const handleSaveSuggestion = async (assessmentId: number) => {
    if (!token) return;
    const notes = notesDrafts[assessmentId] || "";

    try {
      const response = await fetch(buildApiUrl(`/api/admin/assessments/${assessmentId}/suggestion`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        throw new Error("Failed to save suggestion");
      }

      toast({
        title: "Suggestion saved",
        description: "The user will now see your updated recommendation.",
      });
    } catch (error) {
      toast({
        title: "Unable to save suggestion",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    clearAdminToken();
    navigate("/admin-login");
  };

  return (
    <div className="min-h-screen bg-slate-50 relative flex flex-col overflow-hidden">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("/medical-bg.png")' }}
      />
      <div className="fixed inset-0 bg-indigo-50/70 backdrop-blur-[2px] z-0 pointer-events-none"></div>

      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md px-6 py-4 shadow-sm">
        <div className="container mx-auto flex items-end justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-blue-600">Admin Panel</p>
            <h1 className="text-3xl font-bold text-slate-900">CogniWise Monitoring Console</h1>
            <p className="mt-2 text-muted-foreground">
              Monitor user assessments, review Level-1 outcomes, and leave bilingual guidance for families.
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <AlertTriangle className="h-4 w-4 rotate-180" /> Log out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 flex-1 relative z-10">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_2fr]">
          <Card className="border-blue-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xl">Users</CardTitle>
                <CardDescription>Filtered list from latest Level-1 assessments</CardDescription>
              </div>
              <div className="rounded-full bg-blue-50 p-2">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[520px] pr-4">
                {loadingUsers ? (
                  <p className="text-sm text-muted-foreground">Loading users...</p>
                ) : users.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No assessments submitted yet.</p>
                ) : (
                  <div className="space-y-3">
                    {users.map((user) => (
                      <button
                        key={user.user_id}
                        className={`w-full rounded-2xl border p-4 text-left transition hover:border-blue-300 ${selectedUserId === user.user_id
                          ? "border-blue-500 bg-blue-50/60"
                          : "border-slate-200 bg-white"
                          }`}
                        onClick={() => setSelectedUserId(user.user_id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{user.name || "Unregistered User"}</p>
                            <p className="text-xs text-muted-foreground">{user.email || "Email pending"}</p>
                          </div>
                          {user.level_progress.level2_unlocked && (
                            <Badge variant="destructive" className="text-xs">
                              Level 2 required
                            </Badge>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>Age: {user.age || "N/A"}</span>
                          <span>•</span>
                          <span>Group: {getDisplayAgeGroup(user)}</span>
                          <span>•</span>
                          <span>Updated: {new Date(user.last_assessed).toLocaleDateString()}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xl">Assessment Insights</CardTitle>
                <CardDescription>
                  Review risk scores, unlock Level-2, and share practical recommendations.
                </CardDescription>
              </div>
              <div className="rounded-full bg-slate-100 p-2">
                <ClipboardList className="h-5 w-5 text-slate-600" />
              </div>
            </CardHeader>
            <CardContent>
              {!selectedUser ? (
                <p className="text-sm text-muted-foreground">Select a user to view details.</p>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-blue-100 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-blue-600">Selected Profile</p>
                    <p className="text-xl font-semibold text-slate-900">
                      {selectedUser.name || "Unregistered User"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span>{selectedUser.email || "Email not captured"}</span>
                      <span>•</span>
                      <span>Age: {selectedUser.age || "N/A"}</span>
                      <span>•</span>
                      <span>Last update: {new Date(selectedUser.last_assessed).toLocaleString()}</span>
                    </div>
                    {selectedUser.address && (
                      <div className="mt-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="font-semibold text-xs uppercase text-slate-400 block mb-1">Address</span>
                        {selectedUser.address}
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">
                        Level 1 {selectedUser.level_progress.level1_completed ? "completed" : "pending"}
                      </Badge>
                      <Badge variant={selectedUser.level_progress.level2_unlocked ? "destructive" : "outline"}>
                        Level 2 {selectedUser.level_progress.level2_unlocked ? "unlocked" : "locked"}
                      </Badge>
                      <Badge variant={selectedUser.level_progress.level3_unlocked ? "default" : "outline"}>
                        Level 3 {selectedUser.level_progress.level3_unlocked ? "unlocked" : "locked"}
                      </Badge>
                    </div>
                  </div>

                  <Tabs defaultValue="assessments" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-slate-100">
                      <TabsTrigger value="assessments" className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" />
                        Assessments
                      </TabsTrigger>
                      <TabsTrigger value="suggestions" className="flex items-center gap-2">
                        <NotebookPen className="h-4 w-4" />
                        Suggestions
                      </TabsTrigger>
                      <TabsTrigger value="alerts" className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Alerts
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="assessments" className="mt-4 space-y-4">
                      {loadingAssessments ? (
                        <p className="text-sm text-muted-foreground">Loading assessments...</p>
                      ) : assessments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No assessments found.</p>
                      ) : (
                        assessments.map((assessment) => (
                          <div
                            key={assessment.id}
                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-lg font-semibold uppercase">{assessment.condition_type}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(assessment.assessed_at).toLocaleString()}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  assessment.risk_level === "high"
                                    ? "destructive"
                                    : assessment.risk_level === "moderate"
                                      ? "default"
                                      : "secondary"
                                }
                              >
                                {assessment.risk_label} ({assessment.risk_score.toFixed(1)}%)
                              </Badge>
                            </div>
                            {assessment.requires_level2 && (
                              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                                Level-2 recommended for this condition.
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </TabsContent>

                    <TabsContent value="suggestions" className="mt-4 space-y-4">
                      {assessments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Complete a Level-1 screening to add recommendations.
                        </p>
                      ) : (
                        assessments.map((assessment) => (
                          <div key={assessment.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold uppercase text-slate-800">
                                {assessment.condition_type} guidance
                              </p>
                              <Badge variant="outline">#{assessment.id}</Badge>
                            </div>
                            <Textarea
                              className="mt-3"
                              rows={4}
                              placeholder="Add bilingual recommendations (English + Kannada preferred)..."
                              value={notesDrafts[assessment.id] ?? ""}
                              onChange={(event) =>
                                setNotesDrafts((prev) => ({
                                  ...prev,
                                  [assessment.id]: event.target.value,
                                }))
                              }
                            />
                            <div className="mt-3 flex justify-end">
                              <Button size="sm" onClick={() => handleSaveSuggestion(assessment.id)}>
                                Save suggestion
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </TabsContent>

                    <TabsContent value="alerts" className="mt-4">
                      {selectedUser.level_progress.level2_unlocked ? (
                        <div className="space-y-4">
                          <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 text-sm text-red-900">
                            <p className="font-semibold">Level-2 follow-up pending</p>
                            <p className="mt-1">
                              Conditions flagged:{" "}
                              {(selectedUser.level_progress.level2_conditions || [])
                                .map((condition) => condition.toUpperCase())
                                .join(", ") || "N/A"}
                            </p>
                          </div>

                          {selectedUser.level_progress.level3_unlocked && (
                            <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
                              <p className="font-semibold text-purple-900">Level 3: Emergency Guidance Required</p>
                              <p className="text-sm text-purple-800 mt-1 mb-3">
                                This user has unlocked Level 3. Provide specific recommendation notes here.
                              </p>
                              {assessments.length > 0 ? (
                                <>
                                  <Textarea
                                    className="bg-white border-purple-200"
                                    placeholder="Enter Level-3 specific doctor notes..."
                                    rows={3}
                                    value={notesDrafts[assessments[0].id] || ""}
                                    onChange={(e) =>
                                      setNotesDrafts((prev) => ({
                                        ...prev,
                                        [assessments[0].id]: e.target.value,
                                      }))
                                    }
                                  />
                                  <Button
                                    size="sm"
                                    className="mt-2 bg-purple-600 hover:bg-purple-700"
                                    onClick={() => handleSaveSuggestion(assessments[0].id)}
                                  >
                                    Send Level-3 Note
                                  </Button>
                                </>
                              ) : (
                                <p className="text-sm text-red-600">No assessment record found to attach notes to.</p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No critical alerts. Continue monitoring Level-1 completions.
                        </p>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
