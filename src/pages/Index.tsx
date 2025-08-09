import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, Sparkles, Download } from "lucide-react";
import heroImage from "@/assets/hero-coffee.jpg";
import { toast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { buildUrl } from "@/lib/api";
const Index = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [textColumn, setTextColumn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultsVisible, setResultsVisible] = useState(false);
  const [summary, setSummary] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [csvData, setCsvData] = useState<string | null>(null);
  const [sentimentCounts, setSentimentCounts] = useState<{ positive?: number; neutral?: number; negative?: number } | null>(null);
  const [wordcloudImage, setWordcloudImage] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<Array<Record<string, any>> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const pieConfig = useMemo(
    () => ({
      positive: { label: "Positif", color: "hsl(var(--success))" },
      neutral: { label: "Netral", color: "hsl(var(--warning))" },
      negative: { label: "Negatif", color: "hsl(var(--destructive))" },
    }),
    []
  );

  const pieData = useMemo(() => {
    if (!sentimentCounts) return [] as { name: string; value: number; fill: string }[];
    return [
      { name: "positive", value: sentimentCounts.positive || 0, fill: "var(--color-positive)" },
      { name: "neutral", value: sentimentCounts.neutral || 0, fill: "var(--color-neutral)" },
      { name: "negative", value: sentimentCounts.negative || 0, fill: "var(--color-negative)" },
    ];
  }, [sentimentCounts]);
  const canonical = useMemo(() => (typeof window !== "undefined" ? window.location.href : "https://sentimenkopi.local/"), []);

  useEffect(() => {
    if (error) {
      toast({ title: "Terjadi kesalahan", description: error });
    }
  }, [error]);

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      setFile(dropped);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f ?? null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file || !textColumn) {
      setError("Silakan unggah file dan tentukan nama kolom teks.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setResultsVisible(false);

    try {
      const response = await fetch(
        buildUrl("/process_and_suggest", { text_column: textColumn }),
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        let detail = "Terjadi kesalahan pada server.";
        try {
          const err = await response.json();
          detail = err.detail || detail;
        } catch {}
        throw new Error(detail);
      }

      const results = await response.json();
      setSummary((results.summary || "").toString());
      setSuggestions((results.suggestions || "").toString());
      setCsvData(results.csv_data || null);
      setWordcloudImage(results.wordcloud_image ? `data:image/png;base64,${results.wordcloud_image}` : null);
      setSentimentCounts(results.sentiment_counts || null);
      setPreviewData(Array.isArray(results.preview_data) ? results.preview_data : null);
      setResultsVisible(true);
    } catch (err: any) {
      setError(err?.message || "Gagal memproses permintaan.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!csvData || !file) return;
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const originalFilename = file.name.replace(/\.csv$/, "");
    a.download = `${originalFilename}_sentimen.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <>
      <Helmet>
        <title>SentimenKopi – Analisis Sentimen AI Ulasan Kopi</title>
        <meta name="description" content="Unggah CSV ulasan kedai kopi, dapatkan ringkasan dan saran perbaikan berbasis AI secara instan." />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="SentimenKopi – Analisis Sentimen AI" />
        <meta property="og:description" content="Ringkasan & saran AI untuk ulasan kedai kopi Anda." />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'SentimenKopi',
            applicationCategory: 'BusinessApplication',
            description:
              'Analisis sentimen ulasan kedai kopi dengan AI. Unggah CSV untuk ringkasan dan saran.',
            url: canonical,
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <header className="container py-6">
          <nav className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand text-brand-foreground font-bold">SK</span>
              <span className="text-lg font-semibold">SentimenKopi</span>
            </a>
            <div className="hidden md:flex items-center gap-3">
              <a href="#fitur" className="text-sm opacity-80 hover:opacity-100 transition-opacity">Fitur</a>
              <a href="#unggah" className="text-sm opacity-80 hover:opacity-100 transition-opacity">Unggah</a>
            </div>
          </nav>
        </header>

        <main className="container pb-20">
          <section className="grid items-center gap-10 md:gap-14 md:grid-cols-2">
            <article className="space-y-6 animate-enter">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-brand" />
                <span>Didukung model CNN-BiLSTM & Gemini</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                Analisis Ulasan Kedai Kopi Anda dengan AI
              </h1>
              <p className="text-muted-foreground text-base md:text-lg max-w-prose">
                Unggah CSV berisi ulasan pelanggan, dapatkan ringkasan yang mudah dipahami
                beserta saran perbaikan praktis secara instan.
              </p>
            </article>

            <aside className="relative">
              <img
                src={heroImage}
                alt="Ilustrasi cangkir kopi dengan aksen keemasan dan grafik data"
                className="w-full rounded-xl border border-border/60 shadow-lg"
                loading="lazy"
              />
            </aside>
          </section>

          <section id="unggah" className="mt-12 md:mt-16">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Langkah 1: Unggah File CSV</Label>
                  <div
                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
                    onDrop={onDrop}
                    className={
                      `flex justify-center items-center w-full px-6 py-10 rounded-lg border-2 border-dashed transition-colors ${dragActive ? 'border-brand bg-card/40' : 'border-border hover:border-brand'}`
                    }
                  >
                    <div className="text-center space-y-2">
                      <UploadCloud className="mx-auto h-10 w-10 opacity-80" />
                      <div className="text-sm text-muted-foreground">
                        <label className="relative cursor-pointer font-medium text-brand hover:opacity-90">
                          <span>Pilih file</span>
                          <input
                            id="file-upload"
                            ref={inputRef}
                            name="file"
                            type="file"
                            accept=".csv"
                            className="sr-only"
                            onChange={onFileChange}
                          />
                        </label>
                        <span className="pl-1">atau seret dan lepas</span>
                      </div>
                      <p className="text-xs opacity-70">CSV hingga 10MB</p>
                      {file && (
                        <p className="text-xs">Dipilih: <span className="font-medium">{file.name}</span></p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text-column">Langkah 2: Nama Kolom Teks</Label>
                  <Input
                    id="text-column"
                    placeholder="Contoh: Text, review, ulasan"
                    value={textColumn}
                    onChange={(e) => setTextColumn(e.target.value)}
                  />
                </div>

                <Button type="submit" variant="brand" className="w-full" disabled={loading}>
                  {!loading ? (
                    <span>Analisis & Beri Wawasan</span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-brand-foreground/20 border-t-brand-foreground animate-spin" />
                      Memproses...
                    </span>
                  )}
                </Button>

                {error && (
                  <div role="alert" aria-live="polite" className="text-sm text-destructive font-medium">
                    {error}
                  </div>
                )}
              </form>

              {/* Results */}
              <div className={`${resultsVisible ? 'animate-enter' : 'opacity-60'} space-y-8`}>
                <div className={`${resultsVisible ? '' : 'hidden'} space-y-8`}>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold">✨ Wawasan Berbasis AI</h2>
                    <p className="text-muted-foreground">Ringkasan dan saran oleh Gemini.</p>
                  </div>
                  <div className="space-y-6">
                    <article className="p-6 rounded-lg border border-border bg-card/50">
                      <h3 className="text-lg font-semibold text-brand mb-3">Ringkasan Ulasan</h3>
                      <div className="text-sm opacity-90" dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br/>') }} />
                    </article>
                    <article className="p-6 rounded-lg border border-border bg-card/50">
                      <h3 className="text-lg font-semibold text-brand mb-3">Saran Perbaikan</h3>
                      <div className="text-sm opacity-90" dangerouslySetInnerHTML={{ __html: suggestions.replace(/\n/g, '<br/>') }} />
                    </article>
                  </div>

                  <section className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold">📊 Visualisasi Data</h2>
                      <p className="text-muted-foreground">Proporsi sentimen & word cloud.</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6 items-start">
                      <article className="p-6 rounded-lg border border-border bg-card/50">
                        <h3 className="text-lg font-semibold text-brand mb-3">Proporsi Sentimen</h3>
                        {pieData.length > 0 ? (
                          <ChartContainer config={pieConfig} className="h-64">
                            <PieChart>
                              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} strokeWidth={2} />
                              <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                              <ChartLegend content={<ChartLegendContent />} />
                            </PieChart>
                          </ChartContainer>
                        ) : (
                          <p className="text-sm text-muted-foreground">Tidak ada data sentimen.</p>
                        )}
                      </article>

                      <article className="p-6 rounded-lg border border-border bg-card/50">
                        <h3 className="text-lg font-semibold text-brand mb-3">Word Cloud</h3>
                        {wordcloudImage ? (
                          <img src={wordcloudImage} alt="Word cloud ulasan pelanggan" className="w-full rounded-md border border-border bg-background" loading="lazy" />
                        ) : (
                          <p className="text-sm text-muted-foreground">Word cloud belum tersedia.</p>
                        )}
                      </article>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold">📋 Pratinjau Hasil</h2>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-border bg-card/50">
                      {previewData && previewData.length > 0 ? (
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr>
                              {Object.keys(previewData[0]).map((key) => (
                                <th key={key} className="px-4 py-2 text-left font-semibold text-muted-foreground border-b border-border/60">{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {previewData.map((row, i) => (
                              <tr key={i} className="hover:bg-muted/30">
                                {Object.keys(previewData[0]).map((key) => (
                                  <td key={key} className="px-4 py-2 border-b border-border/60">{String(row[key] ?? "")}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-6 text-sm text-muted-foreground">Tidak ada pratinjau data.</div>
                      )}
                    </div>

                    <div className="text-center">
                      <Button type="button" onClick={handleDownload} disabled={!csvData} className="inline-flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Unduh CSV Hasil Analisis
                      </Button>
                    </div>
                  </section>
                </div>

                {!resultsVisible && (
                  <div className="p-6 rounded-lg border border-dashed border-border/60 bg-card/30 text-center">
                    <p className="text-sm text-muted-foreground">Hasil analisis akan tampil di sini setelah proses selesai.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>

        <footer className="container py-8">
          <p className="text-center text-sm text-muted-foreground">
            Dibuat dengan MLOps | Model: CNN-BiLSTM & Google Gemini
          </p>
        </footer>
      </div>
    </>
  );
};

export default Index;
