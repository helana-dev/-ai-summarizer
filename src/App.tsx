import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Trash2,
  HelpCircle,
  FileText,
  Moon,
  Sun,
  Info,
  Brain,
  Search,
  BookMarked,
  Clock,
  Settings,
  History,
  ChevronRight,
  ChevronDown,
  Zap,
} from "lucide-react";
import { SummaryResult, Screen } from "./types";

export default function App() {
  // Mobile app state
  const [screen, setScreen] = useState<Screen>("welcome");
  const [history, setHistory] = useState<SummaryResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<SummaryResult | null>(null);
  
  // Input form state
  const [inputText, setInputText] = useState("");
  const [summaryStyle, setSummaryStyle] = useState<"short" | "medium" | "detailed">("medium");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Search in History state
  const [searchQuery, setSearchQuery] = useState("");

  // Settings state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("ai_summarizer_dark_mode");
    return saved === "true";
  });

  // Active recall revealed questions indices
  const [revealedQuestions, setRevealedQuestions] = useState<Record<number, boolean>>({});

  // Clipboard copy state for feedback
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Digital clock state for mobile status bar
  const [currentTime, setCurrentTime] = useState("");

  // Update clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setCurrentTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000 * 60);
    return () => clearInterval(interval);
  }, []);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem("ai_summarizer_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history from local storage", e);
      }
    }
  }, []);

  // Save history on change
  const saveHistoryToLocalStorage = (newHistory: SummaryResult[]) => {
    setHistory(newHistory);
    localStorage.setItem("ai_summarizer_history", JSON.stringify(newHistory));
  };

  // Toggle dark mode
  const handleToggleDarkMode = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    localStorage.setItem("ai_summarizer_dark_mode", String(nextMode));
  };

  // Preset lesson texts for instant student testing
  const PRESETS = [
    {
      title: "Photosynthesis Lesson",
      text: "Photosynthesis is the process used by plants, algae, and certain bacteria to harness energy from sunlight and turn it into chemical energy. This chemical energy is stored in carbohydrate molecules, such as sugars, which are synthesized from carbon dioxide and water. The process takes place in organelles called chloroplasts, which contain chlorophyll—a green pigment that absorbs light. During photosynthesis, oxygen is released as a byproduct, which is vital for aerobic respiration in animals and humans. The reaction can be summarized by the equation: 6CO2 + 6H2O + light energy -> C6H12O6 + 6O2. Plants absorb carbon dioxide through microscopic pores on their leaves called stomata, while water is pulled up from the roots. Understanding this mechanism is fundamental to biology and environmental science.",
    },
    {
      title: "Newton's Laws of Motion",
      text: "Sir Isaac Newton's three laws of motion describe the relationship between the motion of an object and the forces acting on it. The first law, often called the law of inertia, states that an object at rest will remain at rest, and an object in motion will continue in motion at a constant velocity, unless acted upon by an external net force. The second law defines force mathematically: Force equals mass times acceleration (F = ma), which explains that the acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass. The third law states that for every action, there is an equal and opposite reaction. This means that forces always occur in pairs; when one body exerts a force on a second body, the second body simultaneously exerts an equal and opposite force back. These principles form the bedrock of classical mechanics.",
    },
    {
      title: "French Revolution Summary",
      text: "The French Revolution, which occurred between 1789 and 1799, was a watershed period of radical social and political upheaval in France. The revolution overthrew the absolute monarchy, established a republic, experienced violent periods of political turmoil, and finally culminated in a dictatorship under Napoleon Bonaparte. The root causes of the revolution were a combination of economic crises, rigid social structures of the Old Regime, and the spread of Enlightenment ideals challenging traditional authority. Critical turning points included the Storming of the Bastille on July 14, 1789, the signing of the Declaration of the Rights of Man and of the Citizen, and the execution of King Louis XVI and Queen Marie Antoinette. The revolution permanently altered French society and reshaped European politics by promoting national sovereignty and democratic ideals.",
    }
  ];

  // Progressive loading steps simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setInterval(() => {
        setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 2000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  // Request AI Summary
  const handleGenerateSummary = async (textToSummarize: string) => {
    if (!textToSummarize.trim()) {
      setError("Please enter or paste some text to summarize first.");
      return;
    }

    setIsLoading(true);
    setLoadingStep(0);
    setError(null);
    setRevealedQuestions({});

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSummarize, style: summaryStyle }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "An error occurred during summarization.");
      }

      // Generate a new history item
      const newResult: SummaryResult = {
        id: Date.now().toString(),
        title: data.title || "Untitled Summary",
        summary: data.summary || "",
        keyPoints: data.keyPoints || [],
        keywords: data.keywords || [],
        studyQA: data.studyQA || [],
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        originalText: textToSummarize,
        style: summaryStyle,
      };

      // Add to beginning of history
      const updatedHistory = [newResult, ...history];
      saveHistoryToLocalStorage(updatedHistory);

      setSelectedResult(newResult);
      setScreen("summary");
      setInputText(""); // Clear for next input
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to connect to the summarization server.");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete history item
  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((item) => item.id !== id);
    saveHistoryToLocalStorage(updated);
    if (selectedResult?.id === id) {
      setSelectedResult(null);
    }
  };

  // Clear all history
  const handleClearAllHistory = () => {
    if (window.confirm("Are you sure you want to clear your entire study history? This action cannot be undone.")) {
      saveHistoryToLocalStorage([]);
      setSelectedResult(null);
    }
  };

  // Copy text helper
  const copyToClipboard = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => {
      setCopiedSection(null);
    }, 2000);
  };

  // Filter history based on search query
  const filteredHistory = history.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keywords.some((kw) => kw.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Progressive steps wording
  const LOADING_MESSAGES = [
    "Reading lesson text & identifying structure...",
    "Extracting key concepts & vocabulary words...",
    "Drafting dynamic summaries & study notes...",
    "Formulating test prep Q&As for active recall...",
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-800"} flex flex-col items-center justify-center p-0 md:p-6 font-sans`}>
      
      {/* Decorative desktop backdrop elements */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none hidden md:block"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none hidden md:block"></div>

      {/* Main Smartphone Shell Container */}
      <div className={`relative w-full max-w-md h-screen md:h-[840px] md:rounded-[42px] overflow-hidden shadow-2xl flex flex-col border border-transparent md:border-slate-300 md:dark:border-slate-800 transition-all duration-300 ${darkMode ? "bg-slate-900 text-slate-100 md:shadow-indigo-500/5" : "bg-slate-50 text-slate-900 md:shadow-slate-400/30"}`}>
        
        {/* Smartphone top bar (status line) */}
        <div className={`px-6 pt-3 pb-1 flex justify-between items-center text-xs font-mono select-none z-20 ${darkMode ? "bg-slate-900/90 text-slate-400" : "bg-slate-50/90 text-slate-500"}`}>
          <div className="font-semibold tracking-tight">{currentTime || "12:30 PM"}</div>
          
          {/* Simulated hardware camera notch */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full hidden md:flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-indigo-950 rounded-full border border-slate-900"></div>
          </div>

          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1 rounded text-indigo-600 dark:text-indigo-400 font-bold tracking-tight">5G</span>
            <div className="w-5 h-2.5 border border-current rounded-sm p-[1px] flex items-center">
              <div className="w-3/4 h-full bg-current rounded-2xs"></div>
            </div>
          </div>
        </div>

        {/* Dynamic Screen Content Container */}
        <div className="flex-1 overflow-y-auto pb-24 relative flex flex-col">
          <AnimatePresence mode="wait">
            
            {/* 1. WELCOME / ONBOARDING SCREEN */}
            {screen === "welcome" && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col justify-between p-6 text-center"
              >
                <div className="flex-1 flex flex-col items-center justify-center my-auto space-y-8">
                  {/* Glowing Logo Visual */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full scale-110 animate-pulse-slow"></div>
                    <div className="relative w-24 h-24 rounded-3xl bg-linear-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                      <Brain className="w-12 h-12 text-white" />
                    </div>
                    {/* Tiny visual elements */}
                    <div className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 p-1.5 rounded-full shadow">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h1 className="text-3xl font-bold font-display tracking-tight bg-linear-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                      AI Summarizer
                    </h1>
                    <p className={`text-sm px-4 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                      Turn long texts into clear summaries and smart study notes instantly.
                    </p>
                  </div>

                  {/* App key features overview */}
                  <div className="w-full max-w-xs space-y-3 pt-2 text-left">
                    <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-700/30">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 mt-0.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold">Adaptive Length</h4>
                        <p className="text-[11px] text-slate-400">Summarize in Short, Medium, or Detailed style.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-700/30">
                      <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 mt-0.5">
                        <BookMarked className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold">Active Prep Tool</h4>
                        <p className="text-[11px] text-slate-400">Generates study cards and keywords for test review.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <button
                    onClick={() => setScreen("home")}
                    id="welcome-start-button"
                    className="w-full py-4 bg-linear-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                    Start Summarizing
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <p className="text-[10px] text-slate-400">
                    Designed for students • Powered by Gemini AI
                  </p>
                </div>
              </motion.div>
            )}

            {/* 2. HOME / INPUT SCREEN */}
            {screen === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="p-5 flex flex-col gap-5 flex-1"
              >
                {/* Header Welcome Title */}
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest font-mono">
                      Student Dashboard
                    </span>
                    <h2 className="text-xl font-bold font-display tracking-tight mt-0.5">
                      New Study Lesson
                    </h2>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>

                {/* Main input card */}
                <div className={`p-4 rounded-3xl border ${darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-100"} shadow-xs flex flex-col gap-3.5`}>
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      Lesson text
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {inputText.length} chars
                    </span>
                  </div>

                  <textarea
                    id="lesson-text-input"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste your lesson, article, textbook chapter, or notes here..."
                    className={`w-full h-44 p-3 rounded-2xl resize-none text-sm outline-hidden focus:ring-2 focus:ring-indigo-500/20 border transition-all ${
                      darkMode
                        ? "bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500"
                        : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500"
                    }`}
                  />

                  {/* Input controls / Paste preset lesson */}
                  <div className="flex flex-wrap justify-between items-center gap-2 pt-1">
                    <div className="flex gap-1">
                      {inputText.trim() && (
                        <button
                          onClick={() => setInputText("")}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 active:scale-95 transition-all"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 font-medium">Try Preset:</span>
                      <div className="flex gap-1">
                        {PRESETS.map((p, idx) => (
                          <button
                            key={idx}
                            onClick={() => setInputText(p.text)}
                            className="px-2 py-1 rounded-md text-[10px] font-semibold bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 active:scale-95 transition-all"
                            title={p.title}
                          >
                            {idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Length style selector */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400">
                    Summary Style Length
                  </span>
                  <div className={`p-1.5 rounded-2xl flex gap-1 ${darkMode ? "bg-slate-950" : "bg-slate-200/60"}`}>
                    {(["short", "medium", "detailed"] as const).map((style) => (
                      <button
                        key={style}
                        id={`style-btn-${style}`}
                        onClick={() => setSummaryStyle(style)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-xl capitalize transition-all duration-200 ${
                          summaryStyle === style
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error warning if any */}
                {error && (
                  <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-start gap-2 animate-pulse">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Generation Error</p>
                      <p className="opacity-90 leading-normal">{error}</p>
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <button
                  onClick={() => handleGenerateSummary(inputText)}
                  disabled={isLoading || !inputText.trim()}
                  id="generate-summary-btn"
                  className={`w-full py-4 rounded-2xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2 ${
                    !inputText.trim()
                      ? "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed shadow-none"
                      : "bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-600/10 active:scale-98"
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                  Generate Summary
                </button>

                {/* Loading state visual overlay */}
                <AnimatePresence>
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-slate-950/90 z-40 p-6 flex flex-col items-center justify-center text-center space-y-6"
                    >
                      <div className="relative">
                        {/* Orbit loader circles */}
                        <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                          <Brain className="w-8 h-8 text-indigo-500 animate-pulse" />
                        </div>
                      </div>

                      <div className="space-y-2 max-w-xs">
                        <h3 className="font-display font-bold text-lg text-white">
                          Synthesizing Study Materials
                        </h3>
                        <p className="text-xs text-indigo-300 font-mono min-h-[32px] px-2">
                          {LOADING_MESSAGES[loadingStep]}
                        </p>
                      </div>

                      <div className="flex gap-1.5 pt-2">
                        {LOADING_MESSAGES.map((_, i) => (
                          <div
                            key={i}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                              i <= loadingStep ? "bg-indigo-500 scale-110" : "bg-slate-800"
                            }`}
                          ></div>
                        ))}
                      </div>

                      <p className="text-[10px] text-slate-500">
                        This usually takes less than 10 seconds...
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* 3. AI SUMMARY SCREEN */}
            {screen === "summary" && selectedResult && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="p-5 flex flex-col gap-5 flex-1"
              >
                {/* Header Navigation and Title */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setScreen("home")}
                    className="p-2.5 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 transition-all text-slate-600 dark:text-slate-400"
                    id="summary-back-btn"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="overflow-hidden">
                    <span className="text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full">
                      {selectedResult.style} Summary
                    </span>
                    <h2 className="text-base font-bold truncate mt-1">
                      {selectedResult.title}
                    </h2>
                  </div>
                </div>

                {/* SECTION 1: Summary Card */}
                <div className={`p-4 rounded-3xl border ${darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-100"} shadow-xs space-y-3`}>
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold font-display flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      Summary
                    </h3>
                    <button
                      onClick={() => copyToClipboard(selectedResult.summary, "summary")}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 transition-colors"
                      title="Copy Summary"
                    >
                      {copiedSection === "summary" ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className={`text-sm leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                    {selectedResult.summary}
                  </p>
                </div>

                {/* SECTION 2: Key Points Card */}
                <div className={`p-4 rounded-3xl border ${darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-100"} shadow-xs space-y-3`}>
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold font-display flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      Key Points
                    </h3>
                    <button
                      onClick={() => copyToClipboard(selectedResult.keyPoints.join("\n"), "keypoints")}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 transition-colors"
                      title="Copy Points"
                    >
                      {copiedSection === "keypoints" ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {selectedResult.keyPoints.map((point, index) => (
                      <li key={index} className="flex gap-2 text-sm leading-relaxed items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-2"></span>
                        <span className={darkMode ? "text-slate-300" : "text-slate-600"}>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* SECTION 3: Important Keywords Card */}
                <div className={`p-4 rounded-3xl border ${darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-100"} shadow-xs space-y-3`}>
                  <h3 className="text-sm font-bold font-display flex items-center gap-2">
                    <BookMarked className="w-4 h-4 text-emerald-500" />
                    Important Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedResult.keywords.map((kw, index) => (
                      <button
                        key={index}
                        onClick={() => copyToClipboard(kw, `kw-${index}`)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 active:scale-95 transition-all ${
                          copiedSection === `kw-${index}`
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                            : "bg-slate-100 dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {kw}
                        {copiedSection === `kw-${index}` ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-40" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SECTION 4: Study Questions and Answers Card */}
                <div className={`p-4 rounded-3xl border ${darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-100"} shadow-xs space-y-3`}>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold font-display flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-purple-500" />
                      Active Recall Prep
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Tap any study card below to reveal the answer. Great for exam prep!
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {selectedResult.studyQA.map((qa, idx) => {
                      const isRevealed = revealedQuestions[idx] || false;
                      return (
                        <div
                          key={idx}
                          onClick={() => setRevealedQuestions(prev => ({ ...prev, [idx]: !isRevealed }))}
                          className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                            isRevealed
                              ? "bg-indigo-500/5 border-indigo-500/30"
                              : "bg-slate-50 dark:bg-slate-850 border-slate-200/50 dark:border-slate-800 hover:border-indigo-500/30"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs font-bold font-mono text-indigo-500 dark:text-indigo-400 mt-0.5">
                              Q{idx + 1}.
                            </span>
                            <span className="flex-1 text-xs font-semibold leading-normal text-slate-700 dark:text-slate-200">
                              {qa.question}
                            </span>
                            <span className="text-slate-400 shrink-0">
                              {isRevealed ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </span>
                          </div>
                          
                          <AnimatePresence initial={false}>
                            {isRevealed && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-2.5 mt-2.5 border-t border-slate-200/60 dark:border-slate-800/80">
                                  <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-500 font-bold block mb-1">
                                    Answer Key:
                                  </span>
                                  <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-300">
                                    {qa.answer}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions at the bottom of Summary Screen */}
                <div className="pt-2">
                  <button
                    onClick={() => setScreen("home")}
                    className="w-full py-3.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold rounded-2xl active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                    Summarize Another text
                  </button>
                </div>
              </motion.div>
            )}

            {/* 4. HISTORY SCREEN */}
            {screen === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="p-5 flex flex-col gap-5 flex-1"
              >
                <div>
                  <span className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest font-mono">
                    Past Studies
                  </span>
                  <h2 className="text-xl font-bold font-display tracking-tight mt-0.5">
                    Saved Summaries
                  </h2>
                </div>

                {/* Search bar */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search titles, summaries, or keywords..."
                    className={`w-full py-2.5 pl-10 pr-4 text-xs rounded-xl outline-hidden border transition-all ${
                      darkMode
                        ? "bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500"
                        : "bg-slate-100 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500"
                    }`}
                  />
                </div>

                {/* History Items list */}
                {filteredHistory.length > 0 ? (
                  <div className="space-y-3">
                    {filteredHistory.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedResult(item);
                          setScreen("summary");
                        }}
                        className={`p-4 rounded-3xl border text-left cursor-pointer transition-all flex gap-3 items-center justify-between group ${
                          darkMode
                            ? "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                            : "bg-white border-slate-100 hover:border-slate-200"
                        }`}
                      >
                        <div className="flex-1 space-y-1.5 overflow-hidden">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-sm">
                              {item.style}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.date}
                            </span>
                          </div>
                          
                          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                            {item.title}
                          </h4>
                          
                          <p className="text-xs text-slate-400 truncate leading-relaxed">
                            {item.summary}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 active:scale-95 transition-all"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-400">
                    <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 mb-3">
                      <BookMarked className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-semibold">
                      {searchQuery ? "No matches found" : "Your study drawer is empty"}
                    </p>
                    <p className="text-xs text-slate-500 max-w-xs mt-1">
                      {searchQuery
                        ? "Check your keywords spelling or try searching another term."
                        : "Analyze any lesson text in the Home screen to save your first summary notes!"}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* 5. SETTINGS SCREEN */}
            {screen === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="p-5 flex flex-col gap-6 flex-1 animate-fadeIn"
              >
                <div>
                  <span className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest font-mono">
                    Preferences
                  </span>
                  <h2 className="text-xl font-bold font-display tracking-tight mt-0.5">
                    Settings
                  </h2>
                </div>

                {/* Dark mode option */}
                <div className={`p-4 rounded-3xl border flex items-center justify-between ${
                  darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-100"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${darkMode ? "bg-purple-500/10 text-purple-400" : "bg-purple-100 text-purple-600"}`}>
                      {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold">Dark Interface Mode</h4>
                      <p className="text-[10px] text-slate-400">Better for night reading & eye safety.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleDarkMode}
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${
                      darkMode ? "bg-indigo-600" : "bg-slate-300"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-white transition-all shadow-sm absolute ${
                      darkMode ? "right-1" : "left-1"
                    }`}></span>
                  </button>
                </div>

                {/* Storage Manager */}
                <div className={`p-4 rounded-3xl border flex items-center justify-between ${
                  darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-100"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${darkMode ? "bg-slate-500/10 text-slate-400" : "bg-slate-100 text-slate-600"}`}>
                      <History className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold">Study History Manager</h4>
                      <p className="text-[10px] text-slate-400">
                        {history.length} saved guide{history.length === 1 ? "" : "s"} inside local storage.
                      </p>
                    </div>
                  </div>
                  {history.length > 0 && (
                    <button
                      onClick={handleClearAllHistory}
                      className="text-xs font-semibold text-red-500 bg-red-500/10 px-3 py-1.5 rounded-xl hover:bg-red-500/20 active:scale-95 transition-all"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* About the App */}
                <div className={`p-4 rounded-3xl border space-y-3 text-left ${
                  darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-100"
                }`}>
                  <h3 className="text-xs font-bold font-display flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-indigo-500" />
                    About AI Summarizer
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    AI Summarizer is a student-focused assistant designed to make lesson reading efficient. It utilizes Google's Gemini 3.5 Flash model to extract critical context instantly.
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    By distilling articles into custom length summaries, highlighting vital vocabulary keywords, and preparing automatic active recall questions, it aids in speed study and test preparation.
                  </p>
                  <div className="pt-2 mt-2 border-t border-slate-200/50 dark:border-slate-800/80 flex justify-between text-[10px] text-slate-400">
                    <span>App Version</span>
                    <span>1.1.0</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Backend Platform</span>
                    <span>Gemini 3.5 Flash</span>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* BOTTOM NAVIGATION BAR */}
        {screen !== "welcome" && (
          <div className={`absolute bottom-0 inset-x-0 h-20 border-t flex items-center justify-around px-6 z-30 transition-all ${
            darkMode ? "bg-slate-900/95 border-slate-800 text-slate-400" : "bg-white/95 border-slate-200 text-slate-500"
          }`}>
            
            {/* Nav: HOME */}
            <button
              onClick={() => setScreen("home")}
              className={`flex flex-col items-center gap-1 transition-all ${
                screen === "home" || screen === "summary"
                  ? "text-indigo-500 font-bold"
                  : "hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">Study</span>
            </button>

            {/* Nav: HISTORY */}
            <button
              onClick={() => setScreen("history")}
              className={`flex flex-col items-center gap-1 transition-all relative ${
                screen === "history"
                  ? "text-indigo-500 font-bold"
                  : "hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              <History className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">History</span>
              {history.length > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 bg-indigo-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center scale-90">
                  {history.length}
                </span>
              )}
            </button>

            {/* Nav: SETTINGS */}
            <button
              onClick={() => setScreen("settings")}
              className={`flex flex-col items-center gap-1 transition-all ${
                screen === "settings"
                  ? "text-indigo-500 font-bold"
                  : "hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">Settings</span>
            </button>

          </div>
        )}

      </div>
    </div>
  );
}
