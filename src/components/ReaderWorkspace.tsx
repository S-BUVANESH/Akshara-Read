import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
    Volume2,
    Square,
    Eye,
    Sliders,
    Layers,
    Sparkles,
    BookOpen,
    Grid,
    BookmarkPlus,
    PenTool,
    RotateCcw,
    Mic,
    MicOff,
    Check,
    AlertTriangle,
    Play,
    MousePointer,
    Paintbrush,
    Eraser,
    CheckCircle2
} from 'lucide-react';
import { SAMACHEER_PASSAGES } from '../data/diagnosticCorpus';
import {
    tokenizeTamilPassage,
    speakTamil,
    stopTamilSpeech,
    analyzeAksharaBead,
    playSuccessChime,
    playStallChime,
    isTamilWordMatch,
    calculateAksharaDurationMs
} from '../engine/tamilOrthographyEngine';
import {
    AksharaBead,
    TokenizedWord,
    TypographySettings,
    HighlightColor,
    MicWordStatus
} from '../types/tamil';
import { useTelemetry } from '../context/TelemetryContext';

interface ReaderWorkspaceProps {
    passageText: string;
    setPassageText: (text: string) => void;
}

export const ReaderWorkspace: React.FC<ReaderWorkspaceProps> = ({
    passageText,
    setPassageText
}) => {
    const { telemetry, recordWordRead, recordStall, addTrickyWord, removeTrickyWord } = useTelemetry();

    // Mode A: Smart Word-Flow (Default) vs Mode B: Full Syllable Split View
    const [readingMode, setReadingMode] = useState<'flow' | 'full-split'>('flow');

    // ACM Eye-Tracking Settings
    const [settings, setSettings] = useState<TypographySettings>({
        beadGapEm: 0.38,
        lineHeightScale: 2.2,
        fontSizePx: 28,
        audioRate: 0.5,
        enableBeads: true,
        enableDecompound: true,
        enableMayangoli: true,
        enableSplitMatraBadge: true,
        enableFocusRuler: false
    });

    const { words, metrics } = useMemo(
        () => tokenizeTamilPassage(passageText, settings.enableDecompound),
        [passageText, settings.enableDecompound]
    );

    // Active Selection State
    const [activeWordIndex, setActiveWordIndex] = useState<number>(0);
    const [activeSyllableIndex, setActiveSyllableIndex] = useState<number>(-1);
    const [selectedBead, setSelectedBead] = useState<AksharaBead>(() =>
        analyzeAksharaBead('கொ', 'init-0')
    );

    // Digital Highlighter State
    const [activeMarker, setActiveMarker] = useState<HighlightColor | 'eraser' | 'inspect'>('inspect');
    const [highlights, setHighlights] = useState<Record<number, HighlightColor>>({});

    // Karaoke Playback State
    const [isPlayingKaraoke, setIsPlayingKaraoke] = useState<boolean>(false);
    const karaokeTimerRef = useRef<number | null>(null);
    const syllableSweepTimerRef = useRef<number | null>(null);

    // Real-Time Microphone "Read-Aloud Follow-Along" State
    const [isMicActive, setIsMicActive] = useState<boolean>(false);
    const [micTranscript, setMicTranscript] = useState<string>('');
    const [micWordStatuses, setMicWordStatuses] = useState<Record<number, MicWordStatus>>({});
    const [stallAlertWord, setStallAlertWord] = useState<string | null>(null);

    // References for Speech Recognition & Hesitation Timer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);
    const stallTimerRef = useRef<number | null>(null);
    const micTargetIndexRef = useRef<number>(0);
    micTargetIndexRef.current = activeWordIndex;

    // Focus Ruler & Tracing Pad State
    const [rulerY, setRulerY] = useState<number>(80);
    const [showTracingPad, setShowTracingPad] = useState<boolean>(true);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [tracingMastery, setTracingMastery] = useState<number>(0);
    const targetPixelIndicesRef = useRef<Set<number>>(new Set());
    const drawnPixelIndicesRef = useRef<Set<number>>(new Set());

    const selectedWordObj: TokenizedWord | undefined = words[activeWordIndex] || words[0];

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (karaokeTimerRef.current) window.clearInterval(karaokeTimerRef.current);
            if (syllableSweepTimerRef.current) window.clearInterval(syllableSweepTimerRef.current);
            if (stallTimerRef.current) window.clearTimeout(stallTimerRef.current);
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch {
                    // Ignore
                }
            }
        };
    }, []);

    // Flattened beads of the active word for syllable sweep
    const currentWordFlatBeads: AksharaBead[] = useMemo(() => {
        if (!selectedWordObj) return [];
        return selectedWordObj.morphemes.flat();
    }, [selectedWordObj]);

    // Keep selected bead in sync when active word changes
    useEffect(() => {
        if (selectedWordObj?.morphemes[0]?.[0]) {
            setSelectedBead(selectedWordObj.morphemes[0][0]);
            setActiveSyllableIndex(0);
        }
    }, [activeWordIndex, selectedWordObj]);

    // Initialize VAKT Tracing Canvas with Guide Glyph and Target Pixel Mask
    const initTracingCanvas = useCallback(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw guide grid lines
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Render light guide Tamil glyph
        ctx.font = 'bold 88px "Noto Sans Tamil", sans-serif';
        ctx.fillStyle = 'rgba(37, 99, 235, 0.16)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(selectedBead.grapheme, canvas.width / 2, canvas.height / 2 + 4);

        // Scan alpha channel to map guide glyph pixels
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const targets = new Set<number>();
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 25) {
                targets.add(i / 4);
            }
        }
        targetPixelIndicesRef.current = targets;
        drawnPixelIndicesRef.current = new Set();
        setTracingMastery(0);
    }, [selectedBead]);

    useEffect(() => {
        if (showTracingPad) {
            initTracingCanvas();
        }
    }, [selectedBead, showTracingPad, initTracingCanvas]);

    // Handle Preset Selection
    const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const found = SAMACHEER_PASSAGES.find((p) => p.id === e.target.value);
        if (found) {
            stopKaraokePlayback();
            stopMicReadAloud();
            setPassageText(found.text);
            setActiveWordIndex(0);
            setActiveSyllableIndex(0);
            setHighlights({});
            setMicWordStatuses({});
        }
    };

    // -------------------------------------------------------------
    // FEATURE 1: DIGITAL HIGHLIGHTER TOOLBAR & CLICK HANDLERS
    // -------------------------------------------------------------
    const handleWordClick = (word: TokenizedWord, index: number) => {
        if (activeMarker === 'inspect') {
            // Standard pointer mode: inspect & deep assistant
            stopKaraokePlayback();
            setActiveWordIndex(index);
            setActiveSyllableIndex(0);
            const firstBead = word.morphemes[0]?.[0];
            if (firstBead) setSelectedBead(firstBead);
            speakTamil(word.cleanWord, settings.audioRate);
            return;
        }

        if (activeMarker === 'eraser') {
            setHighlights((prev) => {
                const next = { ...prev };
                delete next[index];
                return next;
            });
            return;
        }

        // Color highlighter: toggle color
        setHighlights((prev) => {
            const current = prev[index];
            if (current === activeMarker) {
                const next = { ...prev };
                delete next[index];
                return next;
            }
            return { ...prev, [index]: activeMarker };
        });

        if (activeMarker === 'tricky') {
            addTrickyWord(word.cleanWord);
        }

        setActiveWordIndex(index);
    };

    // -------------------------------------------------------------
    // FEATURE 1: REAL-TIME KARAOKE WORD & SUB-SYLLABIC SWEEP
    // -------------------------------------------------------------
    const sweepSyllablesForWord = (word: TokenizedWord, onDone?: () => void) => {
        if (syllableSweepTimerRef.current) {
            window.clearInterval(syllableSweepTimerRef.current);
            syllableSweepTimerRef.current = null;
        }

        const flatBeads = word.morphemes.flat();
        if (flatBeads.length === 0) {
            onDone?.();
            return;
        }

        let sIdx = 0;
        setActiveSyllableIndex(0);
        setSelectedBead(flatBeads[0]);

        const aksharaMs = calculateAksharaDurationMs(settings.audioRate);

        syllableSweepTimerRef.current = window.setInterval(() => {
            sIdx++;
            if (sIdx >= flatBeads.length) {
                if (syllableSweepTimerRef.current) {
                    window.clearInterval(syllableSweepTimerRef.current);
                    syllableSweepTimerRef.current = null;
                }
                onDone?.();
                return;
            }
            setActiveSyllableIndex(sIdx);
            setSelectedBead(flatBeads[sIdx]);
        }, aksharaMs);
    };

    const startKaraokePlayback = () => {
        stopKaraokePlayback();
        stopMicReadAloud();
        if (words.length === 0) return;

        setIsPlayingKaraoke(true);
        let currentIdx = 0;
        setActiveWordIndex(0);

        const playWordStep = (idx: number) => {
            if (idx >= words.length) {
                stopKaraokePlayback();
                return;
            }

            const current = words[idx];
            setActiveWordIndex(idx);
            speakTamil(current.cleanWord, settings.audioRate);

            // Sweep through individual syllables of current word
            sweepSyllablesForWord(current, () => {
                // Word finished speaking; pause slightly before next word
                const pauseMs = Math.round(350 / settings.audioRate);
                karaokeTimerRef.current = window.setTimeout(() => {
                    currentIdx++;
                    playWordStep(currentIdx);
                }, pauseMs);
            });
        };

        playWordStep(0);
    };

    const stopKaraokePlayback = () => {
        if (karaokeTimerRef.current) {
            window.clearTimeout(karaokeTimerRef.current);
            karaokeTimerRef.current = null;
        }
        if (syllableSweepTimerRef.current) {
            window.clearInterval(syllableSweepTimerRef.current);
            syllableSweepTimerRef.current = null;
        }
        setIsPlayingKaraoke(false);
        setActiveSyllableIndex(-1);
        stopTamilSpeech();
    };

    // -------------------------------------------------------------
    // FEATURE 2: LIVE MIC READ-ALOUD & 2.8S AUTO-STALL DETECTOR
    // -------------------------------------------------------------
    const resetStallTimer = useCallback(() => {
        if (stallTimerRef.current) {
            window.clearTimeout(stallTimerRef.current);
            stallTimerRef.current = null;
        }

        const targetWord = words[micTargetIndexRef.current];
        if (!targetWord) return;

        // 2.8 second hesitation threshold
        stallTimerRef.current = window.setTimeout(() => {
            const currentIdx = micTargetIndexRef.current;
            const stalledWord = words[currentIdx];
            if (!stalledWord) return;

            // 1. Highlight in Amber/Coral
            setMicWordStatuses((prev) => ({
                ...prev,
                [currentIdx]: 'stalled'
            }));

            // 2. Open Hard-Word Deep Assistant
            setActiveWordIndex(currentIdx);
            setActiveSyllableIndex(0);
            const firstBead = stalledWord.morphemes[0]?.[0];
            if (firstBead) setSelectedBead(firstBead);

            // 3. Trigger slow 0.5x audio and chime
            playStallChime();
            speakTamil(stalledWord.cleanWord, 0.5);

            // 4. Record to Tricky Word Bank & Telemetry
            addTrickyWord(stalledWord.cleanWord);
            recordStall(stalledWord.cleanWord);

            setStallAlertWord(
                `Hesitation detected on "${stalledWord.cleanWord}" (>2.8s) — Remedial 0.5× audio triggered & added to Word Bank!`
            );
            setTimeout(() => setStallAlertWord(null), 5000);

            // Restart timer for next word
            resetStallTimer();
        }, 2800);
    }, [words, addTrickyWord, recordStall]);

    const startMicReadAloud = () => {
        stopKaraokePlayback();
        const SpeechRec =
            (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
                .SpeechRecognition ||
            (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

        if (!SpeechRec) {
            alert(
                'SpeechRecognition API is not natively supported in this browser. Please use Chrome or Edge for live microphone read-aloud.'
            );
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recognition = new (SpeechRec as any)();
        recognition.lang = 'ta-IN';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 2;

        recognitionRef.current = recognition;
        setIsMicActive(true);
        setMicTranscript('');
        setActiveWordIndex(0);
        micTargetIndexRef.current = 0;

        resetStallTimer();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
            let fullInterim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                fullInterim += event.results[i][0].transcript;
            }
            setMicTranscript(fullInterim);

            const targetIndex = micTargetIndexRef.current;
            const targetWord = words[targetIndex];
            if (!targetWord) return;

            // Check if spoken text matches target word
            if (isTamilWordMatch(fullInterim, targetWord.cleanWord)) {
                // Word matched successfully!
                playSuccessChime();
                recordWordRead(targetWord.cleanWord);

                setMicWordStatuses((prev) => ({
                    ...prev,
                    [targetIndex]: 'verified'
                }));

                // Advance to next word
                const nextIdx = targetIndex + 1;
                if (nextIdx < words.length) {
                    micTargetIndexRef.current = nextIdx;
                    setActiveWordIndex(nextIdx);
                    setActiveSyllableIndex(0);
                    resetStallTimer();
                } else {
                    // Passage complete!
                    stopMicReadAloud();
                    playSuccessChime();
                    setStallAlertWord('🎉 Splendid reading! Entire Tamil passage completed!');
                    setTimeout(() => setStallAlertWord(null), 5000);
                }
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (e: any) => {
            if (e.error !== 'no-speech') {
                console.warn('SpeechRecognition error:', e);
            }
        };

        recognition.onend = () => {
            if (isMicActive) {
                try {
                    recognition.start();
                } catch {
                    setIsMicActive(false);
                }
            }
        };

        try {
            recognition.start();
        } catch (err) {
            console.error('Failed to start SpeechRecognition:', err);
            setIsMicActive(false);
        }
    };

    const stopMicReadAloud = () => {
        setIsMicActive(false);
        if (stallTimerRef.current) {
            window.clearTimeout(stallTimerRef.current);
            stallTimerRef.current = null;
        }
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch {
                // Ignore
            }
            recognitionRef.current = null;
        }
    };

    // -------------------------------------------------------------
    // FEATURE 3: VAKT CANVAS DRAWING & REAL-TIME MASTERY CALCULATION
    // -------------------------------------------------------------
    const calculateMasteryCoverage = (
        ctx: CanvasRenderingContext2D,
        canvas: HTMLCanvasElement
    ) => {
        const totalTargets = targetPixelIndicesRef.current.size;
        if (totalTargets === 0) return;

        const drawnSet = drawnPixelIndicesRef.current;
        let overlap = 0;
        for (const idx of drawnSet) {
            if (targetPixelIndicesRef.current.has(idx)) {
                overlap++;
            }
        }

        const coverage = Math.min(100, Math.round((overlap / totalTargets) * 100));
        setTracingMastery(coverage);

        if (coverage >= 80 && tracingMastery < 80) {
            playSuccessChime();
        }
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.strokeStyle = '#0F294A';
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);

        const pixelIndex = Math.floor(y) * canvas.width + Math.floor(x);
        drawnPixelIndicesRef.current.add(pixelIndex);
    };

    const drawMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();

        // Mark neighboring pixels as drawn for realistic brush coverage
        const radius = 6;
        for (let dx = -radius; dx <= radius; dx += 2) {
            for (let dy = -radius; dy <= radius; dy += 2) {
                const px = Math.floor(x + dx);
                const py = Math.floor(y + dy);
                if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
                    drawnPixelIndicesRef.current.add(py * canvas.width + px);
                }
            }
        }

        calculateMasteryCoverage(ctx, canvas);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const handleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!settings.enableFocusRuler) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top - 34;
        setRulerY(Math.max(12, Math.min(rect.height - 76, y)));
    };

    return (
        <div className="workspace-grid">
            {/* Left Configuration & Settings Sidebar */}
            <aside className="card-surface no-print">
                <div style={{ marginBottom: '1.25rem' }}>
                    <div className="section-header-tag">
                        <span>1. Samacheer Kalvi Passages</span>
                        <Layers size={15} />
                    </div>
                    <select className="select-box" onChange={handlePresetChange} defaultValue="p1">
                        {SAMACHEER_PASSAGES.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.grade}: {p.title}
                            </option>
                        ))}
                    </select>
                    <textarea
                        className="textarea-box"
                        value={passageText}
                        onChange={(e) => setPassageText(e.target.value)}
                        placeholder="இங்கே தமிழ் உரையை உள்ளிடவும்..."
                    />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                    <div className="section-header-tag">
                        <span>2. ACM Eye-Tracking Physics</span>
                        <Sliders size={15} />
                    </div>

                    <div className="slider-block">
                        <div className="slider-label-row">
                            <span>Syllable Bead Spacing</span>
                            <span className="slider-value-badge">{settings.beadGapEm} em</span>
                        </div>
                        <input
                            type="range"
                            min="0.05"
                            max="0.85"
                            step="0.05"
                            value={settings.beadGapEm}
                            onChange={(e) =>
                                setSettings({ ...settings, beadGapEm: parseFloat(e.target.value) })
                            }
                        />
                    </div>

                    <div className="slider-block">
                        <div className="slider-label-row">
                            <span>Vertical Line Height</span>
                            <span className="slider-value-badge">{settings.lineHeightScale}×</span>
                        </div>
                        <input
                            type="range"
                            min="1.4"
                            max="3.2"
                            step="0.1"
                            value={settings.lineHeightScale}
                            onChange={(e) =>
                                setSettings({ ...settings, lineHeightScale: parseFloat(e.target.value) })
                            }
                        />
                    </div>

                    <div className="slider-block">
                        <div className="slider-label-row">
                            <span>Font Size</span>
                            <span className="slider-value-badge">{settings.fontSizePx} px</span>
                        </div>
                        <input
                            type="range"
                            min="20"
                            max="46"
                            step="2"
                            value={settings.fontSizePx}
                            onChange={(e) =>
                                setSettings({ ...settings, fontSizePx: parseInt(e.target.value, 10) })
                            }
                        />
                    </div>

                    <div className="slider-block">
                        <div className="slider-label-row">
                            <span>Remedial TTS Speed (ta-IN)</span>
                            <span className="slider-value-badge">{settings.audioRate}×</span>
                        </div>
                        <input
                            type="range"
                            min="0.4"
                            max="1.0"
                            step="0.05"
                            value={settings.audioRate}
                            onChange={(e) =>
                                setSettings({ ...settings, audioRate: parseFloat(e.target.value) })
                            }
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                    <div className="section-header-tag">
                        <span>3. 2D Orthographic Scaffolds</span>
                        <Eye size={15} />
                    </div>

                    <div className="toggle-item">
                        <div>
                            <span className="toggle-title">Punarchi Decompounder</span>
                            <span className="toggle-desc">Splits படத்திலிருந்து → படத்தில் + இருந்து</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.enableDecompound}
                            onChange={(e) =>
                                setSettings({ ...settings, enableDecompound: e.target.checked })
                            }
                        />
                    </div>

                    <div className="toggle-item">
                        <div>
                            <span className="toggle-title">Mayangoli Color Anchors</span>
                            <span className="toggle-desc">Distinguishes ல/ள/ழ, ர/ற, ந/ன/ண</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.enableMayangoli}
                            onChange={(e) =>
                                setSettings({ ...settings, enableMayangoli: e.target.checked })
                            }
                        />
                    </div>

                    <div className="toggle-item">
                        <div>
                            <span className="toggle-title">Split-Matra Lock Badges (⇄)</span>
                            <span className="toggle-desc">Flags flanking vowels (ெ + க + ா)</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.enableSplitMatraBadge}
                            onChange={(e) =>
                                setSettings({ ...settings, enableSplitMatraBadge: e.target.checked })
                            }
                        />
                    </div>

                    <div className="toggle-item">
                        <div>
                            <span className="toggle-title">Focus Reading Ruler</span>
                            <span className="toggle-desc">Dims peripheral lines to stop skipping</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.enableFocusRuler}
                            onChange={(e) =>
                                setSettings({ ...settings, enableFocusRuler: e.target.checked })
                            }
                        />
                    </div>
                </div>

                {/* Tricky Word Bank Widget */}
                <div>
                    <div className="section-header-tag">
                        <span>4. My Tricky Word Bank ({telemetry.trickyWords.length})</span>
                        <BookmarkPlus size={15} />
                    </div>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                        Auto-collected when you stall or click tricky words. Tap to replay:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                        {telemetry.trickyWords.map((w) => (
                            <span
                                key={w}
                                style={{
                                    background: 'var(--blue-soft)',
                                    border: '1px solid var(--blue-border)',
                                    color: 'var(--blue-deep)',
                                    padding: '0.3rem 0.65rem',
                                    borderRadius: '8px',
                                    fontFamily: 'Noto Sans Tamil, sans-serif',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    cursor: 'pointer'
                                }}
                                onClick={() => speakTamil(w, settings.audioRate)}
                            >
                                🔊 {w}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeTrickyWord(w);
                                    }}
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        color: '#166534',
                                        cursor: 'pointer',
                                        fontWeight: 800
                                    }}
                                    title="Mark Mastered"
                                >
                                    ✓
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            </aside>

            {/* Main Interactive Stage */}
            <section>
                {/* Real-time KPI Ribbon */}
                <div className="metrics-grid no-print">
                    <div className="metric-tile">
                        <div className="metric-tile-label">Total Akshara Beads</div>
                        <div className="metric-tile-val">{metrics.totalBeads}</div>
                        <div className="metric-tile-sub">Unified Uyirmei Units</div>
                    </div>
                    <div className="metric-tile">
                        <div className="metric-tile-label">Split-Matras Locked</div>
                        <div className="metric-tile-val">{metrics.splitMatraCount}</div>
                        <div className="metric-tile-sub">Flanking ெ / ே / ொ / ோ / ௌ</div>
                    </div>
                    <div className="metric-tile">
                        <div className="metric-tile-label">Live Words Verified</div>
                        <div className="metric-tile-val" style={{ color: '#16A34A' }}>
                            {telemetry.wordsReadCount}
                        </div>
                        <div className="metric-tile-sub">Via Real-Time Voice Mic</div>
                    </div>
                    <div className="metric-tile">
                        <div className="metric-tile-label">Stalls Detected</div>
                        <div className="metric-tile-val" style={{ color: '#DC2626' }}>
                            {telemetry.stallsDetectedCount}
                        </div>
                        <div className="metric-tile-sub">&gt;2.8s Auto Remediation</div>
                    </div>
                </div>

                {/* Hesitation & Stall Alert Toast */}
                {stallAlertWord && (
                    <div
                        className="no-print"
                        style={{
                            padding: '0.75rem 1.1rem',
                            borderRadius: '12px',
                            background: '#FEF3C7',
                            border: '2px solid #F59E0B',
                            color: '#92400E',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            marginBottom: '1rem',
                            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)'
                        }}
                    >
                        <AlertTriangle size={18} color="#D97706" />
                        <span>{stallAlertWord}</span>
                    </div>
                )}

                {/* Live Mic Read-Aloud Streaming Waveform Banner */}
                {isMicActive && (
                    <div className="mic-live-banner no-print">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <span className="mic-pulse-indicator" />
                            <div className="waveform-anim">
                                <span className="waveform-bar" />
                                <span className="waveform-bar" />
                                <span className="waveform-bar" />
                                <span className="waveform-bar" />
                                <span className="waveform-bar" />
                            </div>
                            <span style={{ fontWeight: 800, color: 'var(--blue-deep)', fontSize: '0.85rem' }}>
                                LIVE STUDENT READ-ALOUD ACTIVE:
                            </span>
                            <span
                                style={{
                                    fontFamily: 'Noto Sans Tamil, sans-serif',
                                    fontSize: '0.95rem',
                                    fontWeight: 700,
                                    color: 'var(--blue-accent)'
                                }}
                            >
                                &ldquo;{micTranscript || 'Speak the highlighted word aloud in Tamil...'}&rdquo;
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span
                                style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    background: '#DBEAFE',
                                    color: '#1E40AF',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '6px'
                                }}
                            >
                                Target: {words[activeWordIndex]?.cleanWord || '—'}
                            </span>
                            <button
                                className="btn-secondary"
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderColor: '#DC2626', color: '#DC2626' }}
                                onClick={stopMicReadAloud}
                            >
                                <MicOff size={13} /> Stop Mic
                            </button>
                        </div>
                    </div>
                )}

                {/* Reading Stage Card */}
                <div className="reading-stage" onMouseMove={handleStageMouseMove}>
                    {settings.enableFocusRuler && (
                        <div className="focus-ruler" style={{ top: `${rulerY}px` }} />
                    )}

                    {/* Toolbar Header */}
                    <div className="stage-header no-print">
                        {/* Dual-Mode Selector */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                                className={readingMode === 'flow' ? 'btn-primary' : 'btn-secondary'}
                                onClick={() => setReadingMode('flow')}
                            >
                                <BookOpen size={15} /> Mode A: Smart Word-Flow
                            </button>
                            <button
                                className={readingMode === 'full-split' ? 'btn-primary' : 'btn-secondary'}
                                onClick={() => setReadingMode('full-split')}
                            >
                                <Grid size={15} /> Mode B: Full Syllable Split
                            </button>
                        </div>

                        {/* Audio & Mic Mode Action Buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            {/* Live Mic Toggle */}
                            {!isMicActive ? (
                                <button
                                    className="btn-primary"
                                    style={{ background: '#16A34A' }}
                                    onClick={startMicReadAloud}
                                    title="Listen via Tamil Speech Recognition & auto-detect stalls (>2.8s)"
                                >
                                    <Mic size={15} /> 🎙️ Live Student Mic
                                </button>
                            ) : (
                                <button
                                    className="btn-secondary"
                                    style={{ borderColor: '#DC2626', color: '#DC2626' }}
                                    onClick={stopMicReadAloud}
                                >
                                    <MicOff size={15} /> End Mic Mode
                                </button>
                            )}

                            {/* Karaoke Playback Toggle */}
                            {!isPlayingKaraoke ? (
                                <button className="btn-primary" onClick={startKaraokePlayback}>
                                    <Volume2 size={15} /> Karaoke Read-Along ({settings.audioRate}×)
                                </button>
                            ) : (
                                <button
                                    className="btn-secondary"
                                    style={{ borderColor: '#DC2626', color: '#DC2626' }}
                                    onClick={stopKaraokePlayback}
                                >
                                    <Square size={14} /> Stop Karaoke
                                </button>
                            )}

                            <button
                                className="btn-secondary"
                                onClick={() => setShowTracingPad((prev) => !prev)}
                            >
                                <PenTool size={14} /> {showTracingPad ? 'Hide Tracing' : 'Trace Letter'}
                            </button>
                        </div>
                    </div>

                    {/* Interactive Digital Highlighter Toolbar */}
                    <div
                        className="no-print"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.65rem',
                            marginBottom: '1rem',
                            padding: '0.45rem 0.8rem',
                            background: '#FFFDF9',
                            borderRadius: '12px',
                            border: '1.5px solid var(--blue-border)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span
                                style={{
                                    fontSize: '0.74rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    color: 'var(--blue-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem'
                                }}
                            >
                                <Paintbrush size={13} /> Digital Highlighter Bar:
                            </span>

                            {/* Pointer / Assist tool */}
                            <button
                                className={`marker-pen-btn ${activeMarker === 'inspect' ? 'active' : ''}`}
                                style={{ background: '#F1F5F9', color: '#334155' }}
                                onClick={() => setActiveMarker('inspect')}
                                title="Click any word to inspect & open Deep Assistant"
                            >
                                <MousePointer size={13} /> Click to Inspect
                            </button>

                            {/* Tricky Yellow Marker */}
                            <button
                                className={`marker-pen-btn ${activeMarker === 'tricky' ? 'active' : ''}`}
                                style={{ background: '#FEF08A', color: '#854D0E' }}
                                onClick={() => setActiveMarker('tricky')}
                                title="Paint word as Tricky (Yellow)"
                            >
                                🟨 Tricky Word (#FEF08A)
                            </button>

                            {/* Mayangoli Blue Marker */}
                            <button
                                className={`marker-pen-btn ${activeMarker === 'mayangoli' ? 'active' : ''}`}
                                style={{ background: '#BFDBFE', color: '#1E40AF' }}
                                onClick={() => setActiveMarker('mayangoli')}
                                title="Paint word as Mayangoli Alert (Blue)"
                            >
                                🟦 Mayangoli Alert (#BFDBFE)
                            </button>

                            {/* Mastered Green Marker */}
                            <button
                                className={`marker-pen-btn ${activeMarker === 'mastered' ? 'active' : ''}`}
                                style={{ background: '#BBF7D0', color: '#166534' }}
                                onClick={() => setActiveMarker('mastered')}
                                title="Paint word as Mastered (Green)"
                            >
                                🟩 Mastered (#BBF7D0)
                            </button>

                            {/* Eraser Marker */}
                            <button
                                className={`marker-pen-btn ${activeMarker === 'eraser' ? 'active' : ''}`}
                                style={{ background: '#FFFFFF', color: '#475569', border: '1px solid #CBD5E1' }}
                                onClick={() => setActiveMarker('eraser')}
                                title="Erase highlight from word"
                            >
                                <Eraser size={13} /> Eraser
                            </button>
                        </div>

                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Active Tool:{' '}
                            <strong>
                                {activeMarker === 'inspect'
                                    ? 'Inspect Mode (Click to decode)'
                                    : activeMarker === 'eraser'
                                        ? 'Eraser Mode (Click word to clear)'
                                        : `Marker Pen: ${activeMarker.toUpperCase()}`}
                            </strong>
                        </span>
                    </div>

                    {/* Mode A: Smart Word-Flow Mode */}
                    {readingMode === 'flow' ? (
                        <div>
                            <div
                                className="akshara-canvas"
                                style={{
                                    fontSize: `${settings.fontSizePx}px`,
                                    lineHeight: settings.lineHeightScale,
                                    columnGap: '0.65em'
                                }}
                            >
                                {words.map((word, wIdx) => {
                                    const isCurrentWordActive = activeWordIndex === wIdx;
                                    const customHighlight = highlights[wIdx];
                                    const micStatus = micWordStatuses[wIdx];

                                    // Dynamic styling based on highlight, mic verification, or karaoke
                                    let bg = 'transparent';
                                    let borderColor = 'transparent';
                                    let textColor = 'inherit';

                                    if (micStatus === 'verified') {
                                        bg = '#DCFCE7';
                                        borderColor = '#16A34A';
                                        textColor = '#14532D';
                                    } else if (micStatus === 'stalled') {
                                        bg = '#FEF3C7';
                                        borderColor = '#DC2626';
                                        textColor = '#991B1B';
                                    } else if (customHighlight === 'tricky') {
                                        bg = '#FEF08A';
                                        borderColor = '#F59E0B';
                                    } else if (customHighlight === 'mayangoli') {
                                        bg = '#BFDBFE';
                                        borderColor = '#3B82F6';
                                    } else if (customHighlight === 'mastered') {
                                        bg = '#BBF7D0';
                                        borderColor = '#22C55E';
                                    } else if (word.isDecompounded) {
                                        bg = 'rgba(37, 99, 235, 0.06)';
                                        borderColor = 'var(--blue-border)';
                                    }

                                    return (
                                        <span
                                            key={word.id}
                                            onClick={() => handleWordClick(word, wIdx)}
                                            className={`${isCurrentWordActive ? 'karaoke-active-word' : ''}`}
                                            style={{
                                                padding: '0.12em 0.42em',
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                transition: 'all 0.18s ease',
                                                background: isCurrentWordActive ? '#FEF08A' : bg,
                                                border: isCurrentWordActive
                                                    ? '2.5px solid #2563EB'
                                                    : borderColor !== 'transparent'
                                                        ? `2px solid ${borderColor}`
                                                        : word.isDecompounded
                                                            ? '1.5px dashed var(--blue-border)'
                                                            : '2px solid transparent',
                                                color: textColor,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.2rem'
                                            }}
                                        >
                                            {word.rawWord}
                                            {micStatus === 'verified' && (
                                                <span
                                                    style={{
                                                        fontSize: '0.55em',
                                                        color: '#16A34A',
                                                        fontWeight: 900
                                                    }}
                                                >
                                                    ✓
                                                </span>
                                            )}
                                            {micStatus === 'stalled' && (
                                                <span
                                                    style={{
                                                        fontSize: '0.55em',
                                                        color: '#DC2626',
                                                        fontWeight: 900
                                                    }}
                                                >
                                                    ⚠️
                                                </span>
                                            )}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        /* Mode B: Full Syllable Split View */
                        <div
                            className={`akshara-canvas ${settings.enableBeads ? 'beads-enabled' : ''} ${settings.enableMayangoli ? 'mayangoli-enabled' : ''
                                } ${settings.enableSplitMatraBadge ? 'split-badge-enabled' : ''}`}
                            style={{
                                fontSize: `${settings.fontSizePx}px`,
                                lineHeight: settings.lineHeightScale
                            }}
                        >
                            {words.map((word, wIdx) => {
                                const isCurrentWordActive = activeWordIndex === wIdx;
                                const customHighlight = highlights[wIdx];
                                const micStatus = micWordStatuses[wIdx];

                                return (
                                    <span
                                        key={word.id}
                                        className="word-unit"
                                        style={{
                                            gap: `${settings.beadGapEm}em`,
                                            background:
                                                micStatus === 'verified'
                                                    ? 'rgba(220, 252, 231, 0.65)'
                                                    : micStatus === 'stalled'
                                                        ? 'rgba(254, 243, 199, 0.8)'
                                                        : isCurrentWordActive
                                                            ? 'rgba(254, 240, 138, 0.65)'
                                                            : customHighlight === 'tricky'
                                                                ? 'rgba(254, 240, 138, 0.4)'
                                                                : customHighlight === 'mayangoli'
                                                                    ? 'rgba(191, 219, 254, 0.4)'
                                                                    : customHighlight === 'mastered'
                                                                        ? 'rgba(187, 247, 208, 0.4)'
                                                                        : undefined,
                                            border:
                                                micStatus === 'verified'
                                                    ? '2px solid #16A34A'
                                                    : micStatus === 'stalled'
                                                        ? '2.5px solid #DC2626'
                                                        : isCurrentWordActive
                                                            ? '2px solid var(--blue-accent)'
                                                            : undefined,
                                            borderRadius: '12px'
                                        }}
                                        onClick={() => handleWordClick(word, wIdx)}
                                    >
                                        {word.morphemes.map((morpheme, mIdx) => (
                                            <React.Fragment key={`${word.id}-m-${mIdx}`}>
                                                {morpheme.map((bead, bIdx) => {
                                                    const isBeadActiveInKaraoke =
                                                        isCurrentWordActive &&
                                                        activeSyllableIndex === bIdx;

                                                    return (
                                                        <span
                                                            key={bead.id}
                                                            className={`akshara-bead ${selectedBead.id === bead.id ? 'selected' : ''
                                                                } ${isBeadActiveInKaraoke ? 'bead-active-sweep' : ''}`}
                                                            data-mayangoli={bead.mayangoliGroup || undefined}
                                                            data-split={bead.isSplitOrPreMatra ? 'true' : undefined}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveWordIndex(wIdx);
                                                                setActiveSyllableIndex(bIdx);
                                                                setSelectedBead(bead);
                                                                speakTamil(bead.grapheme, settings.audioRate);
                                                            }}
                                                        >
                                                            {bead.grapheme}
                                                        </span>
                                                    );
                                                })}
                                                {mIdx < word.morphemes.length - 1 && (
                                                    <span className="morpheme-plus">+</span>
                                                )}
                                            </React.Fragment>
                                        ))}
                                        {word.trailingPunctuation && (
                                            <span style={{ marginLeft: '2px' }}>
                                                {word.trailingPunctuation}
                                            </span>
                                        )}
                                        {micStatus === 'verified' && (
                                            <span style={{ fontSize: '0.6em', color: '#16A34A', fontWeight: 900 }}>
                                                ✓
                                            </span>
                                        )}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* FEATURE 3: ON-DEMAND HARD-WORD DEEP ASSISTANT SPOTLIGHT CARD */}
                {selectedWordObj && (
                    <div
                        className="card-surface no-print"
                        style={{
                            marginBottom: '1.25rem',
                            border: '2px solid var(--blue-accent)',
                            background: 'linear-gradient(to right, #FFFDF9, #F0F7FF)',
                            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.12)'
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '0.75rem',
                                marginBottom: '0.85rem'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <span
                                    style={{
                                        background: 'var(--blue-primary)',
                                        color: '#FFFFFF',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '999px',
                                        fontSize: '0.74rem',
                                        fontWeight: 800
                                    }}
                                >
                                    🎯 HARD-WORD DEEP ASSISTANT
                                </span>
                                <span
                                    style={{
                                        fontFamily: 'Noto Sans Tamil, sans-serif',
                                        fontSize: '1.45rem',
                                        fontWeight: 800,
                                        color: 'var(--blue-deep)'
                                    }}
                                >
                                    {selectedWordObj.cleanWord}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button
                                    className="btn-primary"
                                    onClick={() => speakTamil(selectedWordObj.cleanWord, 0.5)}
                                >
                                    <Volume2 size={14} /> 0.5× Slow Audio
                                </button>
                                <button
                                    className="btn-secondary"
                                    onClick={() =>
                                        sweepSyllablesForWord(selectedWordObj, () => {
                                            speakTamil(selectedWordObj.cleanWord, settings.audioRate);
                                        })
                                    }
                                >
                                    <Play size={14} /> Syllable Sweep
                                </button>
                                <button
                                    className="btn-secondary"
                                    onClick={() => addTrickyWord(selectedWordObj.cleanWord)}
                                >
                                    <BookmarkPlus size={14} /> + Save to Word Bank
                                </button>
                            </div>
                        </div>

                        {/* Real-time Syllable Sweep Beads Row */}
                        <div
                            className="akshara-canvas beads-enabled mayangoli-enabled split-badge-enabled"
                            style={{ fontSize: '32px', padding: '0.5rem 0' }}
                        >
                            {selectedWordObj.morphemes.map((morpheme, mIdx) => {
                                return (
                                    <React.Fragment key={`assist-m-${mIdx}`}>
                                        {morpheme.map((bead, bIdx) => {
                                            // Find bead index in flattened array
                                            let flatIndex = 0;
                                            for (let i = 0; i < mIdx; i++) {
                                                flatIndex += selectedWordObj.morphemes[i].length;
                                            }
                                            flatIndex += bIdx;

                                            const isSweeping = activeSyllableIndex === flatIndex;

                                            return (
                                                <span
                                                    key={`assist-${bead.id}`}
                                                    className={`akshara-bead ${selectedBead.id === bead.id ? 'selected' : ''
                                                        } ${isSweeping ? 'bead-active-sweep' : ''}`}
                                                    data-mayangoli={bead.mayangoliGroup || undefined}
                                                    data-split={bead.isSplitOrPreMatra ? 'true' : undefined}
                                                    style={{ marginRight: '0.3em' }}
                                                    onClick={() => {
                                                        setActiveSyllableIndex(flatIndex);
                                                        setSelectedBead(bead);
                                                        speakTamil(bead.grapheme, 0.5);
                                                    }}
                                                >
                                                    {bead.grapheme}
                                                </span>
                                            );
                                        })}
                                        {mIdx < selectedWordObj.morphemes.length - 1 && (
                                            <span className="morpheme-plus" style={{ marginRight: '0.4em' }}>
                                                +
                                            </span>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* FEATURE 3: INTERACTIVE VAKT KINESTHETIC LETTER-TRACING PAD WITH REAL MASTERY CALCULATION */}
                {showTracingPad && (
                    <div
                        className="card-surface no-print"
                        style={{
                            marginBottom: '1.25rem',
                            display: 'grid',
                            gridTemplateColumns: '1fr auto',
                            gap: '1.5rem',
                            alignItems: 'center'
                        }}
                    >
                        <div>
                            <div className="section-header-tag">
                                <span>VAKT Kinesthetic Muscle-Memory Tracing Pad</span>
                                <PenTool size={15} />
                            </div>
                            <h3 style={{ fontSize: '1.2rem', color: 'var(--blue-deep)', marginBottom: '0.35rem' }}>
                                Trace the Syllable: &ldquo;{selectedBead.grapheme}&rdquo; ({selectedBead.formula})
                            </h3>
                            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                Tracing over the guide glyph builds neurological tactile memory (Fernald VAKT method).
                                Real-time stroke coverage detector:
                            </p>

                            {/* Live Mastery Meter */}
                            <div style={{ maxWidth: '340px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 800 }}>
                                    <span style={{ color: 'var(--blue-deep)' }}>Stroke Coverage:</span>
                                    <span
                                        style={{
                                            color:
                                                tracingMastery >= 80
                                                    ? '#16A34A'
                                                    : tracingMastery >= 50
                                                        ? 'var(--blue-accent)'
                                                        : '#D97706'
                                        }}
                                    >
                                        Mastery: {tracingMastery}% {tracingMastery >= 80 ? '✓' : ''}
                                    </span>
                                </div>
                                <div className="mastery-progress-bar">
                                    <div
                                        className="mastery-fill"
                                        style={{
                                            width: `${tracingMastery}%`,
                                            background:
                                                tracingMastery >= 80
                                                    ? 'linear-gradient(90deg, #22C55E, #16A34A)'
                                                    : tracingMastery >= 50
                                                        ? 'linear-gradient(90deg, #3B82F6, #1D4ED8)'
                                                        : 'linear-gradient(90deg, #F59E0B, #D97706)'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
                                <button className="btn-secondary" onClick={initTracingCanvas}>
                                    <RotateCcw size={14} /> Clear Pad
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={() => speakTamil(selectedBead.grapheme, 0.5)}
                                >
                                    <Volume2 size={14} /> Sound &ldquo;{selectedBead.grapheme}&rdquo;
                                </button>
                            </div>
                        </div>

                        {/* Interactive Canvas */}
                        <div className="tracing-canvas-wrap">
                            <canvas
                                ref={canvasRef}
                                width={280}
                                height={180}
                                onMouseDown={startDrawing}
                                onMouseMove={drawMove}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={drawMove}
                                onTouchEnd={stopDrawing}
                                style={{
                                    display: 'block',
                                    cursor: 'crosshair',
                                    background: '#FFFFFF'
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* X-Ray Uyirmei Phonetic Decomposition Banner */}
                <div className="xray-banner no-print">
                    <div className="xray-glyph">{selectedBead.grapheme}</div>
                    <div>
                        <div
                            style={{
                                fontSize: '0.8rem',
                                textTransform: 'uppercase',
                                color: '#93C5FD',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem'
                            }}
                        >
                            <Sparkles size={14} /> {selectedBead.category}
                        </div>
                        <div
                            style={{
                                fontSize: '1.4rem',
                                fontWeight: 800,
                                color: '#FFFFFF',
                                margin: '0.2rem 0'
                            }}
                        >
                            {selectedBead.formula}
                        </div>
                        <p style={{ fontSize: '0.88rem', color: '#DBEAFE' }}>
                            {selectedBead.articulationTip}
                        </p>
                    </div>
                    <button
                        className="btn-print-nav"
                        onClick={() => speakTamil(selectedBead.grapheme, settings.audioRate)}
                    >
                        <Volume2 size={16} /> Replay Bead
                    </button>
                </div>
            </section>
        </div>
    );
};