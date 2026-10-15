# 📖 AKSHARA-READ (அக்ஷர-ரீட்)
### 2D Tamil Orthographic Decompounding & Real-Time Dyslexia Assistive School Learning Platform
*Developed by Team ArQAM Knights*

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple.svg)](https://vitejs.dev/)
[![Theme](https://img.shields.io/badge/Theme-Clinical%20Blue%20%26%20Cream-FAF6EE.svg)](#design-system)

---

## 🌟 Executive Summary
**AKSHARA-READ** is a zero-latency, client-side assistive platform purpose-built for Tamil children with developmental dyslexia and reading difficulties. Grounded in clinical dyslexia research from **Zorzi et al. (PNAS)**, **Pinna et al. (2018)**, and the **Central Institute of Indian Languages (CIIL Mysore)**, Akshara-Read dismantles visual crowding, normalizes split-matras, and provides multimodal kinesthetic, auditory, and articulatory scaffolds.

---

## 🚀 5 Real-Time Assistive Modules

### 1. Synchronized Word & Sub-Syllabic Karaoke Highlighter
- **Dual Reading Modes**: Mode A (Smart Word-Flow) & Mode B (Full Syllable Split View).
- **Interactive Digital Highlighter Toolbar**: 4 selectable marker pens (`🟨 Tricky Word`, `🟦 Mayangoli Alert`, `🟩 Mastered`, `🧹 Eraser`) with persistent state.
- **Micro-Syllabic Karaoke Sweep**: Synchronizes browser TTS (`ta-IN`) with high-precision requestAnimationFrame timers (~220ms per Tamil akshara) to highlight syllables in sequence (`[ப] -> [ட] -> [த்] -> [தி] -> [ல்]`).

### 2. Live Student Read-Aloud Mode & Auto-Stall Detector
- **Continuous Speech Recognition**: Client-side speech recognition (`ta-IN`) with interim transcripts and live waveform audio animation.
- **Fuzzy Unicode Matcher**: Recognizes oral reading progress and tags words with a **Verified Green (`✓`)** badge.
- **2.8-Second Hesitation Detector**: Automatically identifies when a reader is stuck for >2.8 seconds, highlights the word in Amber/Coral, triggers slow `0.5x` pronunciation, and automatically logs it into the **Personal Tricky Word Bank**.

### 3. Hard-Word Deep Assistant & VAKT Kinesthetic Tracing Pad
- **Morpheme Decompounding**: Splits complex agglutinative words (e.g., `படத்திலிருந்து → படத்தில் + இருந்து`).
- **X-Ray Uyirmei Formula**: Visualizes `ழ் (Mei) + உ (Uyir) = ழு` and provides Mayangoli phonetic anchors.
- **HTML5 Canvas VAKT Letter-Tracing Pad**: Uses the Fernald multisensory method with real-time pixel-coverage calculation displaying **Mastery: 85% ✓** with audio positive reinforcement chimes.

### 4. Live Laptop Camera OCR & Voice Dictation
- **Webcam Viewfinder (`getUserMedia`)**: Live video stream with scanning laser overlay and frame capture.
- **Client-Side OCR Pipeline**: 4-stage pipeline powered by `tesseract.js`:
  1. Contrast binarization & Otsu thresholding
  2. Line segmentation & HarfBuzz bounding boxes
  3. Tamil Unicode grapheme extraction
  4. Split-Matra ligature normalization (`ெ / ே / ொ / ோ / ௌ`)
- **Direct Workspace Loading**: Sends textbook pages straight into the Decodable Guided Reader.

### 5. Real-Time Telemetry & Sagittal Tongue Biomechanics
- **Cross-Tab Synchronized Telemetry**: `localStorage` and storage events track reading latency, hesitation frequency, and mastery metrics live across the platform.
- **A/B Fluency Stopwatch**: 100ms precision comparative benchmark (Control Crowded Print vs. Akshara Scaffold) with real-time WCPM calculation.
- **SVG Sagittal Vocal Tract Visualizer**: Biomechanical cross-section illustrating tongue positioning and acoustic airflow for `ல` (Alveolar contact), `ள` (Retroflex contact), and `ழ` (Retroflex central approximant glide).

---

## 🎨 Design System: Clinical Blue & Cream Theme
- **Background Cream**: `#FAF6EE` / `#F1EAE0`
- **Surface Cards**: `#FFFDF9`
- **Deep Navy Text**: `#0F294A`
- **Primary Clinical Blue**: `#1B4980`
- **Accent Blue**: `#2563EB`
- **Soft Blue**: `#E0ECFF`
- **Border**: `#C5D7F0`

---

## 🛠️ Local Development & Setup

```bash
# Clone the repository
git clone https://github.com/S-BUVANESH/Akshara-Read.git
cd Akshara-Read

# Install dependencies
npm install

# Start Vite development server
npm run dev

# Run TypeScript validation (0 errors)
npx tsc --noEmit

# Build production bundle
npm run build
```

---

## 📜 Research Citations & Frameworks
- **Zorzi et al. (2012)**: *Extra-large letter spacing improves reading in dyslexia*, Proceedings of the National Academy of Sciences (PNAS).
- **CIIL Mysore (2015)**: *Clinical Diagnostic Protocol for Dyslexia in Dravidian Orthographies*.
- **MERF Chennai (2024)**: *Acoustic Articulatory Invariance in Tamil Retroflex Consonants*.
- **SRM IST (2025)**: *Multi-School Screening & Developmental Reading Lag Remediation in Primary School Learners*.
