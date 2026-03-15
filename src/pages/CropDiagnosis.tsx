import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Copy, Download, Loader2, Microscope, RefreshCcw, ScanSearch, Sparkles, Upload } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { buildDiagnosisReport, DiagnosisRun, normalizeDiagnosis } from "@/lib/diagnosis";

const STORAGE_KEY = "agrilink-diagnosis-history";

type ImageMeta = DiagnosisRun["imageMeta"];

const labelize = (value: string) =>
  value
    .split(/[_-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const measureQuality = (fileSizeKb: number, width: number, height: number) =>
  Math.max(20, Math.min(100, Math.round((width * height) / 140000 + Math.min(fileSizeKb / 30, 20) + 18)));

const listWithFallback = (items: string[], fallback: string) => (items.length ? items : [fallback]);

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Image reading failed."));
    reader.readAsDataURL(file);
  });

const readMeta = (file: File, dataUrl: string) =>
  new Promise<ImageMeta>((resolve, reject) => {
    const image = new Image();
    image.onload = () =>
      resolve({
        fileSizeKb: Math.max(1, Math.round(file.size / 1024)),
        width: image.width,
        height: image.height,
        orientation: image.width === image.height ? "square" : image.width > image.height ? "landscape" : "portrait",
        qualityScore: measureQuality(Math.max(1, Math.round(file.size / 1024)), image.width, image.height),
      });
    image.onerror = () => reject(new Error("Image inspection failed."));
    image.src = dataUrl;
  });

export default function CropDiagnosis() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<ImageMeta>(null);
  const [fieldNotes, setFieldNotes] = useState("");
  const [history, setHistory] = useState<DiagnosisRun[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as DiagnosisRun[];
      if (Array.isArray(parsed)) {
        setHistory(parsed);
        setActiveRunId(parsed[0]?.id || null);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const activeRun = useMemo(() => history.find((item) => item.id === activeRunId) || history[0] || null, [activeRunId, history]);

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readAsDataUrl(file);
      setSelectedFile(file);
      setImageDataUrl(dataUrl);
      setImageMeta(await readMeta(file, dataUrl));
    } catch (error) {
      toast({ title: "Upload failed", description: error instanceof Error ? error.message : "Image upload failed.", variant: "destructive" });
    }
  };

  const runAnalysis = async () => {
    if (!imageDataUrl || !selectedFile) {
      toast({ title: "No image selected", description: "Upload a crop image before running analysis.", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("analyze-crop", {
        body: { imageBase64: imageDataUrl.split(",")[1] },
      });
      if (error) {
        const isAnonymousAuthBlock =
          !sessionData.session && error.message.includes("non-2xx");
        throw new Error(
          isAnonymousAuthBlock
            ? "The diagnosis service is currently blocking anonymous requests. Redeploy the Edge Function with JWT verification disabled for public use, or sign in before retrying."
            : error.message || "Analysis request failed.",
        );
      }

      const run: DiagnosisRun = {
        id: crypto.randomUUID(),
        createdAt: data?.generated_at || new Date().toISOString(),
        imageName: selectedFile.name,
        imageDataUrl,
        imageMeta,
        modelUsed: data?.model_used || "Unknown",
        finishReason: data?.finish_reason || "unknown",
        diagnosis: normalizeDiagnosis(data?.diagnosis ?? data),
        notes: fieldNotes.trim(),
      };

      setHistory((current) => [run, ...current].slice(0, 8));
      setActiveRunId(run.id);
      toast({ title: "Analysis ready", description: "The advanced diagnosis details have been updated." });
    } catch (error) {
      toast({ title: "Analysis failed", description: error instanceof Error ? error.message : "Analysis failed.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportReport = async (mode: "copy" | "download") => {
    if (!activeRun) return;
    const report = buildDiagnosisReport(activeRun);
    if (mode === "copy") {
      await navigator.clipboard.writeText(report);
      toast({ title: "Copied", description: "Diagnosis report copied to clipboard." });
      return;
    }
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeRun.diagnosis.crop}-${activeRun.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const diagnosis = activeRun?.diagnosis;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-20">
        <section className="hero-mesh surface-grid">
          <div className="container py-12 md:py-16">
            <ScrollReveal>
              <div className="glass-strong rounded-[2rem] p-8 md:p-10">
                <div className="flex flex-wrap gap-3">
                  <Badge variant="secondary"><Sparkles className="mr-2 h-4 w-4" />Advanced diagnosis workspace</Badge>
                  <Badge variant="outline"><ScanSearch className="mr-2 h-4 w-4" />Crop-specific recommendations</Badge>
                </div>
                <div className="mt-6 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
                  <Card className="glass rounded-[1.75rem]">
                    <CardHeader>
                      <CardTitle>Upload crop image</CardTitle>
                      <CardDescription>Use a clean image with visible symptoms, crop tissue detail, and stable lighting.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <label htmlFor="crop-upload" className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.5rem] border border-dashed border-border/70 bg-white/75 p-10 text-center transition hover:border-primary/50">
                        <div className="rounded-full bg-primary/10 p-4 text-primary"><Upload className="h-6 w-6" /></div>
                        <div>
                          <p className="font-semibold">Choose crop image</p>
                          <p className="text-sm text-muted-foreground">{selectedFile?.name || "PNG, JPG, GIF, or WEBP"}</p>
                        </div>
                      </label>
                      <input id="crop-upload" type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Estimated image quality</span>
                          <span className="font-semibold">{imageMeta?.qualityScore ?? 0}/100</span>
                        </div>
                        <Progress value={imageMeta?.qualityScore ?? 0} className="h-3" />
                      </div>
                      <Textarea
                        value={fieldNotes}
                        onChange={(event) => setFieldNotes(event.target.value)}
                        placeholder="Field notes: rainfall, spray history, spread pattern, irrigation changes, affected block..."
                        className="min-h-[120px] border-border/70 bg-white/75"
                      />
                      <div className="flex flex-wrap gap-3">
                        <Button className="gradient-hero text-primary-foreground" onClick={runAnalysis} disabled={isAnalyzing}>
                          {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Microscope className="mr-2 h-4 w-4" />}
                          Run AI analysis
                        </Button>
                        <Button variant="outline" onClick={() => { setSelectedFile(null); setImageDataUrl(null); setImageMeta(null); }}>
                          Reset
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-strong rounded-[1.75rem]">
                    <CardHeader>
                      <CardTitle>System upgrades now active</CardTitle>
                      <CardDescription>Analysis depth, UI polish, and workflow clarity have all been increased in this module.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2">
                      {[
                        "Advanced crop-specific disease interpretation",
                        "More detailed treatment and prevention content",
                        "Split organic and conventional recommendations",
                        "Persistent local diagnosis history",
                        "Glass cards and layered surfaces",
                        "Scroll-reveal motion system",
                        "Exportable diagnosis report",
                        "Upload quality scoring",
                        "Richer field note capture",
                        "Improved route and dashboard consistency",
                      ].map((item) => (
                        <div key={item} className="flex gap-3 rounded-2xl border border-border/70 bg-white/75 p-4">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="container -mt-8 grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <ScrollReveal delayMs={100}>
            <Card className="glass-strong rounded-[1.75rem]">
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Analysis details</CardTitle>
                  <CardDescription>Better structured disease analysis, actions, and follow-up guidance.</CardDescription>
                </div>
                {activeRun ? (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => exportReport("copy")}><Copy className="mr-2 h-4 w-4" />Copy</Button>
                    <Button variant="outline" size="sm" onClick={() => exportReport("download")}><Download className="mr-2 h-4 w-4" />Export</Button>
                  </div>
                ) : null}
              </CardHeader>
              <CardContent>
                {diagnosis ? (
                  <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                      <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview" className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {[
                          { label: "Crop", value: diagnosis.crop },
                          { label: "Diagnosis", value: diagnosis.disease },
                          { label: "Confidence", value: `${diagnosis.confidence}%` },
                          { label: "Severity", value: labelize(diagnosis.severity), danger: diagnosis.severity === "high" },
                        ].map((item) => (
                          <div key={item.label} className="rounded-[1.5rem] border border-border/70 bg-white/75 p-5">
                            <p className="text-sm text-muted-foreground">{item.label}</p>
                            <p className={`mt-2 text-xl font-bold ${item.danger ? "text-destructive" : ""}`}>{item.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                        <div className="rounded-[1.5rem] border border-border/70 bg-white/75 p-5">
                          <h3 className="font-semibold">Analysis details</h3>
                          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">{diagnosis.analysis_details}</p>
                        </div>
                        <div className="space-y-4">
                          {[
                            { label: "Spread risk", value: diagnosis.spread_risk },
                            { label: "Recovery outlook", value: diagnosis.recovery_outlook },
                            { label: "Review window", value: diagnosis.recommended_review_window },
                            { label: "Nutrition notes", value: diagnosis.nutrition_notes },
                          ].map((item) => (
                            <div key={item.label} className="rounded-[1.5rem] border border-border/70 bg-white/75 p-5">
                              <p className="text-sm text-muted-foreground">{item.label}</p>
                              <p className="mt-2 text-sm leading-7">{item.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="recommendations" className="grid gap-4 lg:grid-cols-2">
                      {[
                        { title: "Urgent actions", items: listWithFallback(diagnosis.urgent_actions, "No urgent actions returned.") },
                        { title: "Treatment", items: listWithFallback(diagnosis.treatment, "No treatment returned.") },
                        { title: "Organic treatment", items: listWithFallback(diagnosis.organic_treatment, "No organic treatment returned.") },
                        { title: "Conventional treatment", items: listWithFallback(diagnosis.conventional_treatment, "No conventional treatment returned.") },
                        { title: "Prevention", items: listWithFallback(diagnosis.prevention, "No prevention returned.") },
                      ].map((group) => (
                        <div key={group.title} className="rounded-[1.5rem] border border-border/70 bg-white/75 p-5">
                          <h3 className="font-semibold">{group.title}</h3>
                          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                            {group.items.map((item) => (
                              <li key={item} className="flex gap-3">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </TabsContent>
                    <TabsContent value="monitoring" className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-[1.5rem] border border-border/70 bg-white/75 p-5">
                        <h3 className="font-semibold">Monitoring steps</h3>
                        <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                          {listWithFallback(diagnosis.monitoring_steps, "No monitoring steps returned.").map((item) => (
                            <li key={item} className="flex gap-3">
                              <RefreshCcw className="mt-0.5 h-4 w-4 text-primary" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-[1.5rem] border border-border/70 bg-white/75 p-5">
                        <h3 className="font-semibold">Contributing signals</h3>
                        <div className="mt-4 space-y-4 text-sm text-muted-foreground">
                          <div><span className="font-semibold text-foreground">Indicators:</span> {listWithFallback(diagnosis.key_indicators, "No indicators returned.").join(", ")}</div>
                          <div><span className="font-semibold text-foreground">Likely causes:</span> {listWithFallback(diagnosis.likely_causes, "No causes returned.").join(", ")}</div>
                          <div><span className="font-semibold text-foreground">Risk factors:</span> {listWithFallback(diagnosis.risk_factors, "No risk factors returned.").join(", ")}</div>
                          <div><span className="font-semibold text-foreground">Field notes:</span> {activeRun?.notes || "No notes captured."}</div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-white/70 p-10 text-center">
                    <AlertTriangle className="mx-auto h-10 w-10 text-primary" />
                    <h3 className="mt-4 text-xl font-semibold">No analysis yet</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Upload an image and run the upgraded diagnosis flow to populate this workspace.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </ScrollReveal>

          <ScrollReveal delayMs={180}>
            <div className="space-y-6">
              <Card className="glass rounded-[1.75rem]">
                <CardHeader>
                  <CardTitle>Current upload</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-muted/40">
                    {imageDataUrl ? <img src={imageDataUrl} alt="Uploaded crop" className="h-[260px] w-full object-cover" /> : <div className="flex h-[260px] items-center justify-center px-6 text-center text-muted-foreground">The crop preview appears here after upload.</div>}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { label: "Resolution", value: imageMeta ? `${imageMeta.width} x ${imageMeta.height}` : "Not available" },
                      { label: "Orientation", value: imageMeta ? labelize(imageMeta.orientation) : "Not available" },
                      { label: "File size", value: imageMeta ? `${imageMeta.fileSizeKb} KB` : "Not available" },
                      { label: "Quality score", value: imageMeta ? `${imageMeta.qualityScore}/100` : "Not available" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-border/70 bg-white/75 p-4">
                        <p className="text-sm text-muted-foreground">{item.label}</p>
                        <p className="mt-1 font-semibold">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass rounded-[1.75rem]">
                <CardHeader>
                  <CardTitle>Diagnosis history</CardTitle>
                  <CardDescription>Recent runs are stored locally for quick comparison.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {history.length ? history.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveRunId(item.id)}
                      className={`w-full rounded-[1.5rem] border p-4 text-left transition ${activeRunId === item.id ? "border-primary bg-primary/5 shadow-soft" : "border-border/70 bg-white/75 hover:border-primary/40"}`}
                    >
                      <p className="font-semibold">{item.diagnosis.crop}</p>
                      <p className="text-sm text-muted-foreground">{item.diagnosis.disease}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
                    </button>
                  )) : <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-white/70 p-5 text-sm text-muted-foreground">No diagnosis history yet.</div>}
                </CardContent>
              </Card>
            </div>
          </ScrollReveal>
        </section>
      </main>
      <Footer />
    </div>
  );
}
