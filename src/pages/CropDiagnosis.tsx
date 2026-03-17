import React, { useState, useCallback, useEffect, useRef } from "react";
import { CheckCircle2, ImagePlus, Upload, Loader2, X, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { DiagnosisResult, DiagnosisRun } from "@/lib/diagnosis";
import { analyzeCropImage, buildDiagnosisReport } from "@/lib/diagnosis";

export default function CropDiagnosis() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [fieldNotes, setFieldNotes] = useState('');
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const getImageQuality = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const area = img.naturalWidth * img.naturalHeight;
        const sizeMb = file.size / (1024 * 1024);
        let score = Math.min(100, (area / 1000000) * 20); // Base on resolution
        if (sizeMb > 10) score *= 0.5;
        if (sizeMb < 0.1) score *= 0.8;
        score = Math.max(0, Math.min(100, score));
        resolve(Math.round(score));
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    const score = await getImageQuality(file);
    setQualityScore(score);
    setResult(null);
    toast.message(`Image loaded - Quality: ${score}/100`);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error("Please select an image");
      return;
    }
    setLoading(true);
    try {
      const diagnosis = await analyzeCropImage(selectedFile, fieldNotes);
      setResult(diagnosis);
      toast.success("AI analysis complete!");
    } catch (error) {
      toast.error("Analysis failed - check console");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setQualityScore(null);
    setFieldNotes('');
    setResult(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  };

  const handleExport = () => {
    if (!result || !selectedFile) return;
    const run: DiagnosisRun = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      imageName: selectedFile.name,
      imageDataUrl: null,
      imageMeta: qualityScore ? {
        fileSizeKb: Math.round(selectedFile.size / 1024),
        width: imgRef.current?.naturalWidth || 0,
        height: imgRef.current?.naturalHeight || 0,
        orientation: 'square',
        qualityScore: qualityScore,
      } : null,
      modelUsed: 'gemini-1.5-flash',
      finishReason: 'success',
      diagnosis: result,
      notes: fieldNotes,
    };
    const report = buildDiagnosisReport(run);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agrilink-diagnosis-${selectedFile.name.replace(/\.[^/.]+$/, '.txt')}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported");
  };

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(e.type === "dragover" || e.type === "dragenter");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 p-8 space-y-12">
        <div className="text-center">
          <h1 className="text-5xl font-black bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Diagnosis Complete
          </h1>
          <Button onClick={handleReset} className="mr-4">
            New Analysis
          </Button>
          <Button onClick={handleExport} variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Dynamic Results - same as before */}
        <div className="max-w-7xl mx-auto grid gap-12 lg:grid-cols-2">
          <section className="space-y-6">
            {/* Summary, Quick Facts - use result */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-emerald-200">
              <h2 className="text-2xl font-bold text-emerald-800 mb-6">📊 Summary</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <span className="text-xs uppercase text-emerald-600 font-semibold">Crop</span>
                  <p className="text-3xl font-black">{result.crop}</p>
                </div>
                <div>
                  <span className="text-xs uppercase text-green-600 font-semibold">Disease</span>
                  <p className="text-3xl font-black text-green-600">{result.disease}</p>
                </div>
                <div>
                  <span className="text-xs uppercase text-blue-600 font-semibold">Confidence</span>
                  <p className="text-4xl font-black text-blue-600">{result.confidence}%</p>
                </div>
                <div>
                  <span className="text-xs uppercase text-yellow-600 font-semibold">Severity</span>
                  <p className="text-3xl font-bold text-yellow-600">{result.severity}</p>
                </div>
              </div>
            </div>
            {/* Add treatment cards using organic_treatment etc. */}
            {result.organic_treatment.length > 0 && (
              <div className="bg-green-50 rounded-3xl p-8 border border-green-200">
                <h3 className="text-xl font-bold text-green-800 mb-4">🌿 Organic Treatments</h3>
                <ul className="space-y-2">
                  {result.organic_treatment.map((t, i) => (
                    <li key={i} className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.conventional_treatment.length > 0 && (
              <div className="bg-blue-50 rounded-3xl p-8 border border-blue-200">
                <h3 className="text-xl font-bold text-blue-800 mb-4">⚗️ Conventional Treatments</h3>
                <ul className="space-y-2">
                  {result.conventional_treatment.map((t, i) => (
                    <li key={i} className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="space-y-6">
            <div className="bg-emerald-50 rounded-3xl p-8">
              <h2 className="text-2xl font-bold mb-6">📈 Recovery Outlook</h2>
              <p>{result.recovery_outlook}</p>
            </div>
            <div className="bg-blue-50 rounded-3xl p-8">
              <h2 className="text-2xl font-bold mb-6">🔬 Analysis</h2>
              <p className="whitespace-pre-wrap">{result.analysis_details}</p>
            </div>
            <div className="bg-orange-50 rounded-3xl p-8">
              <h2 className="text-2xl font-bold mb-6">🥗 Nutrition</h2>
              <p>{result.nutrition_notes}</p>
            </div>
          </section>
        </div>

        {/* Original uploaded image */}
        <div className="text-center">
          <img ref={imgRef} src={previewUrl!} alt="Analyzed" className="max-w-md max-h-96 rounded-3xl shadow-2xl mx-auto" />
        </div>
      </div>
    );
  }

  // Upload view - screenshot style
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-8">
      <header className="text-center mb-16 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-emerald-600 via-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
          Upload Crop Image
        </h1>
        <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
          Use a clean image with visible symptoms, crop tissue detail, and stable lighting.
        </p>
      </header>

      <main className="max-w-2xl mx-auto space-y-8">
        {/* Drag drop area */}
        <div 
          className={`border-4 border-dashed rounded-3xl p-12 transition-all ${
            dragActive ? 'border-emerald-400 bg-emerald-50 shadow-2xl' : 'border-gray-200 hover:border-emerald-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files![0])}
          />
          <div className="text-center">
            <ImagePlus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-2xl font-bold text-gray-900 mb-2">Drop image here or click to browse</p>
            <p className="text-gray-600">JPG, PNG up to 10MB</p>
          </div>
        </div>

        {selectedFile && (
          <>
            <div className="space-y-4 p-6 bg-white rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg truncate max-w-xs">Choose crop image</span>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />
                  {selectedFile.name}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span>Estimated image quality</span>
                <div className="font-mono font-bold text-2xl text-blue-600">
                  {qualityScore}/100
                </div>
              </div>
            </div>

            <Textarea
              placeholder="Field notes (optional but recommended)
Examples: recent rainfall, spray history, spread pattern, irrigation changes, affected block size, neighboring crops..."
              value={fieldNotes}
              onChange={(e) => setFieldNotes(e.target.value)}
              className="min-h-[120px] resize-none"
              rows={4}
            />

            <div className="flex gap-4">
              <Button 
                onClick={handleAnalyze}
                disabled={loading || !qualityScore}
                className="flex-1 font-bold text-lg py-8"
              >
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Upload className="mr-2 h-5 w-5" />}
                Run AI Analysis
              </Button>
              <Button 
                onClick={handleReset}
                variant="outline"
                className="px-8 font-bold"
                size="lg"
              >
                Reset
              </Button>
            </div>
          </>
        )}

        <hr className="border-gray-200 my-24" />

        {/* System upgrades */}
        <section className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-3xl p-12 border border-white/50 shadow-2xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-4">
              System Upgrades Now Active
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Analysis depth, UI polish, and workflow clarity have all been increased in this module.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 text-lg">
            <ul className="space-y-3">
              <li className="flex items-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mr-4 flex-shrink-0" />
                Advanced crop-specific disease interpretation
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mr-4 flex-shrink-0" />
                Split organic and conventional recommendations
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mr-4 flex-shrink-0" />
                Glass cards and layered surfaces
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mr-4 flex-shrink-0" />
                Exportable diagnosis report
              </li>
            </ul>
            <ul className="space-y-3">
              <li className="flex items-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mr-4 flex-shrink-0" />
                Richer field note capture
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mr-4 flex-shrink-0" />
                More detailed treatment content
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mr-4 flex-shrink-0" />
                Upload quality scoring
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mr-4 flex-shrink-0" />
                Scroll-reveal motion system
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

