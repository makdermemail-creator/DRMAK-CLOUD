'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Sparkles,
  Camera,
  Upload,
  RefreshCw,
  Scan,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Pill,
  ChevronRight
} from 'lucide-react';
import { analyzeSkinAction } from '@/app/actions';
import type { AnalyzeSkinOutput } from '@/ai/flows/analyze-skin';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { SalesTraining } from '@/lib/types';
import { collection, orderBy, query } from 'firebase/firestore';
import Webcam from 'react-webcam';
import { cn } from '@/lib/utils';

export default function RecommendationsPage() {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<AnalyzeSkinOutput | null>(null);
  const [imageBase64, setImageBase64] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<'camera' | 'upload'>('upload');
  const webcamRef = React.useRef<Webcam>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const firestore = useFirestore();
  const trainingsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'salesTrainings'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: trainings, isLoading: trainingsLoading } = useCollection<SalesTraining>(trainingsQuery);

  const capture = React.useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImageBase64(imageSrc.split(',')[1]);
      setMode('upload'); // Switch to preview mode
    }
  }, [webcamRef]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImageBase64(base64.split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    let currentImage = imageBase64;

    // Auto-capture if in camera mode and no image is captured yet
    if (!currentImage && mode === 'camera') {
      const imageSrc = webcamRef.current?.getScreenshot();
      if (imageSrc) {
        currentImage = imageSrc.split(',')[1];
        setImageBase64(currentImage);
      }
    }

    if (!currentImage) {
      toast({
        variant: 'destructive',
        title: 'No image',
        description: 'Please upload an image or ensure your camera is active.',
      });
      return;
    }

    if (!trainings || trainings.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No training data',
        description: 'Wait for training materials to load.',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    const formattedTrainings = trainings.map(t => ({
      title: t.title,
      content: t.content,
    }));

    const response = await analyzeSkinAction({
      imageBase64: currentImage,
      trainingData: formattedTrainings,
    });

    if (response.success && response.data) {
      setResult(response.data);
      toast({
        title: 'Analysis Complete',
        description: 'Your skin consultation results are ready.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: response.error || 'Unable to analyze skin image.',
      });
    }
    setLoading(false);
  };

  const reset = () => {
    setImageBase64(null);
    setResult(null);
    setMode('upload');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
          <Sparkles className="h-10 w-10 text-primary" />
          AI Skin Consultation
        </h1>
        <p className="text-muted-foreground text-lg">
          Upload a photo or use your camera to get an instant skin diagnosis and treatment suggestions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input/Preview */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-6">
          <Card className="overflow-hidden border-2 border-primary/10 shadow-xl bg-gradient-to-b from-card to-muted/20">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  {imageBase64 ? <CheckCircle2 className="text-emerald-500" /> : <Scan className="text-primary" />}
                  {imageBase64 ? 'Image Ready' : 'Capture or Upload'}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={mode === 'camera' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setMode('camera'); setImageBase64(null); }}
                  >
                    <Camera className="mr-2 h-4 w-4" /> Camera
                  </Button>
                  <Button
                    variant={mode === 'upload' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMode('upload')}
                  >
                    <Upload className="mr-2 h-4 w-4" /> Upload
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="aspect-video relative bg-slate-900 flex items-center justify-center overflow-hidden">
                {mode === 'camera' && !imageBase64 ? (
                  <>
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 border-[40px] border-slate-900/40 pointer-events-none">
                      <div className="w-full h-full border-2 border-dashed border-primary/50 rounded-lg animate-pulse"></div>
                    </div>
                    <Button
                      onClick={capture}
                      size="lg"
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full h-16 w-16 p-0 border-4 border-white shadow-2xl hover:scale-110 transition-transform"
                    >
                      <div className="h-12 w-12 rounded-full bg-red-500"></div>
                    </Button>
                  </>
                ) : imageBase64 ? (
                  <div className="relative w-full h-full">
                    <img
                      src={`data:image/jpeg;base64,${imageBase64}`}
                      alt="Skin Preview"
                      className="w-full h-full object-contain"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-4 right-4 rounded-full"
                      onClick={() => setImageBase64(null)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 text-slate-400 p-12 text-center">
                    <div className="p-6 rounded-full bg-slate-800 animate-bounce">
                      <Upload className="h-10 w-10 text-primary" />
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-white">No Image Selected</p>
                      <p>Drag and drop or click the button below to upload a photo.</p>
                    </div>
                    <Button onClick={() => fileInputRef.current?.click()}>
                      Select Image
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                      aria-label="Upload skin image"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              onClick={handleAnalyze}
              disabled={loading || !imageBase64 || trainingsLoading}
              size="lg"
              className="flex-1 py-8 text-xl font-bold rounded-2xl shadow-lg hover:shadow-primary/25 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  Analyzing Skin...
                </>
              ) : (
                <>
                  <Sparkles className="mr-3 h-6 w-6" />
                  Get AI Diagnosis
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={reset}
              size="lg"
              className="px-8 rounded-2xl"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-6">
          {loading ? (
            <Card className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4 border-dashed border-2">
              <div className="relative">
                <div className="h-20 w-20 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                <Stethoscope className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">Consulting AI Specialist</h3>
              <p className="text-muted-foreground">We're analyzing the textures, tones, and patterns in your photo to find the best treatments.</p>
            </Card>
          ) : result ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <Card className={cn("border-primary/20 shadow-lg overflow-hidden", result && !result.isHumanSkin && "border-destructive/50")}>
                <div className={cn("bg-primary/10 p-4 border-b border-primary/10 flex items-center gap-2", result && !result.isHumanSkin && "bg-destructive/10 border-destructive/10")}>
                  {result && result.isHumanSkin ? (
                    <Stethoscope className="h-5 w-5 text-primary" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  <h3 className={cn("font-bold text-lg uppercase tracking-wider", result && !result.isHumanSkin && "text-destructive")}>
                    {result && result.isHumanSkin ? 'AI Diagnosis' : 'Validation Error'}
                  </h3>
                </div>
                <CardContent className="pt-6">
                  <p className={cn("text-lg leading-relaxed italic text-foreground/90", result && !result.isHumanSkin && "text-destructive font-medium")}>
                    "{result.diagnosis}"
                  </p>
                </CardContent>
              </Card>

              {result.isHumanSkin && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Pill className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold">Suggested Treatments</h2>
                  </div>

                  <div className="grid gap-4">
                    {result.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="group p-5 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all flex items-start gap-4 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 group-hover:scale-110 transition-all">
                          <ChevronRight className="h-8 w-8 text-primary" />
                        </div>
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="font-bold text-primary">{i + 1}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{rec.productName}</h4>
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            {rec.reason}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    <strong>Note:</strong> This AI diagnosis is for informational purposes only. Please consult with our physical doctors for a final medical assessment before starting any treatment.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="h-full flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-dashed border-2">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Sparkles className="h-10 w-10 opacity-20" />
              </div>
              <h3 className="text-xl font-medium">Ready for Analysis</h3>
              <p className="max-w-[250px] mx-auto mt-2">Upload or capture an image to see results here.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
