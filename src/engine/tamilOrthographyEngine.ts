import { AksharaBead, MayangoliGroup, TokenizedWord } from '../types/tamil';

const MATRA_TO_UYIR: Record<string, { uyir: string; name: string }> = {
    '\u0BBE': { uyir: 'ஆ', name: 'Nedil (Long Vowel Sign ா)' },
    '\u0BBF': { uyir: 'இ', name: 'Kuril (Short Vowel Sign ி)' },
    '\u0BC0': { uyir: 'ஈ', name: 'Nedil (Long Vowel Sign ீ)' },
    '\u0BC1': { uyir: 'உ', name: 'Kuril (Short Vowel Sign ு)' },
    '\u0BC2': { uyir: 'ஊ', name: 'Nedil (Long Vowel Sign ூ)' },
    '\u0BC6': { uyir: 'எ', name: 'Pre-Base Left Kombu (ெ)' },
    '\u0BC7': { uyir: 'ஏ', name: 'Pre-Base Double Kombu (ே)' },
    '\u0BC8': { uyir: 'ஐ', name: 'Pre-Base Ai-kaaram (ை)' },
    '\u0BCA': { uyir: 'ஒ', name: '2D Split-Matra (ெ + Consonant + ா)' },
    '\u0BCB': { uyir: 'ஓ', name: '2D Split-Matra (ே + Consonant + ா)' },
    '\u0BCC': { uyir: 'ஔ', name: '2D Split-Matra (ெ + Consonant + ள)' }
};

const MAYANGOLI_LOOKUP: Record<string, { group: MayangoliGroup; tip: string }> = {
    'ல': {
        group: 'lateral',
        tip: 'நுனிநா லகரம் (Alveolar la): Touch tongue tip gently behind upper teeth (e.g., வால் = Tail).'
    },
    'ள': {
        group: 'lateral',
        tip: 'மடக்கு ளகரம் (Retroflex La): Curl tongue tip back to roof of mouth (e.g., வாள் = Sword).'
    },
    'ழ': {
        group: 'lateral',
        tip: 'சிறப்பு ழகரம் (Approximant zha): Deep retroflex curl without touching palate (e.g., தமிழ், மழை).'
    },
    'ர': {
        group: 'rhotic',
        tip: 'இடையின ரகரம் (Soft tap ra): Light single tap of the tongue (e.g., கரை = Riverbank).'
    },
    'ற': {
        group: 'rhotic',
        tip: 'வல்லின றகரம் (Hard trill Rra): Firm alveolar trill (e.g., கறை = Stain).'
    },
    'ந': {
        group: 'nasal',
        tip: 'தந்த நகரம் (Dental na): Tongue touches upper teeth; commonly word-initial (e.g., நன்றி).'
    },
    'ன': {
        group: 'nasal',
        tip: 'றன்னகரம் (2-Loop Alveolar na): Tongue touches alveolar ridge (e.g., மனம் = Mind).'
    },
    'ண': {
        group: 'nasal',
        tip: 'டண்ணகரம் (3-Loop Retroflex Na): Curl tongue back to palate (e.g., மணம் = Fragrance).'
    }
};

const PUNARCHI_DICTIONARY: Record<string, string[]> = {
    'படத்திலிருந்து': ['படத்தில்', 'இருந்து'],
    'பள்ளிக்கூடத்திலிருந்து': ['பள்ளிக்கூடத்தில்', 'இருந்து'],
    'கொடுக்கப்பட்டது': ['கொடுக்கப்', 'பட்டது'],
    'மகிழ்ச்சியுடன்': ['மகிழ்ச்சி', 'உடன்'],
    'ஒளியிலிருந்து': ['ஒளியில்', 'இருந்து'],
    'ஒளிச்சேர்க்கை': ['ஒளிச்', 'சேர்க்கை'],
    'சுற்றுச்சூழல்': ['சுற்றுச்', 'சூழல்'],
    'குழந்தைகள்': ['குழந்தை', 'கள்'],
    'தயாரிக்கின்றன': ['தயாரிக்', 'கின்றன'],
    'வந்தார்கள்': ['வந்தார்', 'கள்'],
    'வானத்திலிருந்து': ['வானத்தில்', 'இருந்து'],
    'பெய்ததால்': ['பெய்தது', 'ஆல்'],
    'கடமையாகும்': ['கடமை', 'ஆகும்'],
    'வீரனைப்': ['வீரனை', 'ப்'],
    'தாவரங்கள்': ['தாவரம்', 'கள்']
};

/**
 * Segments a Tamil string into authentic orthographic Akshara graphemes
 * without shattering HarfBuzz OpenType ligatures.
 */
export function segmentTamilGraphemes(text: string): string[] {
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
        const segmenter = new Intl.Segmenter('ta', { granularity: 'grapheme' });
        return Array.from(segmenter.segment(text), (s) => s.segment);
    }
    const regex =
        /[\u0B85-\u0B94]|[\u0B95-\u0BB9][\u0BBE-\u0BCD\u0BD7]*|[\u0B82\u0B83]|[^\u0B80-\u0BFF]/g;
    return text.match(regex) || [text];
}

/**
 * Deterministic Punarchi & Agglutinative Suffix Decompounder
 */
export function decompoundAgglutinatedWord(cleanWord: string): string[] {
    if (PUNARCHI_DICTIONARY[cleanWord]) {
        return PUNARCHI_DICTIONARY[cleanWord];
    }

    const graphemes = segmentTamilGraphemes(cleanWord);
    if (graphemes.length < 5) {
        return [cleanWord];
    }

    const suffixRules: Array<{ suffix: string; replacement: [string, string] }> = [
        { suffix: 'த்திலிருந்து', replacement: ['த்தில்', 'இருந்து'] },
        { suffix: 'யிலிருந்து', replacement: ['யில்', 'இருந்து'] },
        { suffix: 'களிலிருந்து', replacement: ['களில்', 'இருந்து'] },
        { suffix: 'ப்பட்டிருந்தது', replacement: ['ப்பட்டு', 'இருந்தது'] },
        { suffix: 'ப்படுகின்றன', replacement: ['ப்படு', 'கின்றன'] },
        { suffix: 'ச்சேர்க்கை', replacement: ['ச்', 'சேர்க்கை'] },
        { suffix: 'த்தினால்', replacement: ['த்தின்', 'ஆல்'] },
        { suffix: 'களுடைய', replacement: ['கள்', 'உடைய'] },
        { suffix: 'யுடன்', replacement: ['', 'உடன்'] },
        { suffix: 'வுடன்', replacement: ['', 'உடன்'] },
        { suffix: 'லிருந்து', replacement: ['ல்', 'இருந்து'] },
        { suffix: 'த்தோடு', replacement: ['த்து', 'ஓடு'] },
        { suffix: 'களுடன்', replacement: ['கள்', 'உடன்'] },
        { suffix: 'யாகும்', replacement: ['', 'ஆகும்'] }
    ];

    for (const rule of suffixRules) {
        if (cleanWord.endsWith(rule.suffix) && cleanWord.length > rule.suffix.length + 2) {
            const root = cleanWord.slice(0, cleanWord.length - rule.suffix.length) + rule.replacement[0];
            return [root, rule.replacement[1]];
        }
    }

    return [cleanWord];
}

/**
 * Analyzes a single Tamil Akshara grapheme into its phonetic & visual metadata.
 */
export function analyzeAksharaBead(grapheme: string, idPrefix: string): AksharaBead {
    const codePoints = Array.from(grapheme);
    const baseChar = codePoints[0] || grapheme;
    const modifierCode = codePoints[1] || null;

    const mayangoliEntry = MAYANGOLI_LOOKUP[baseChar] || null;
    const isSplitOrPreMatra =
        modifierCode !== null &&
        ['\u0BC6', '\u0BC7', '\u0BC8', '\u0BCA', '\u0BCB', '\u0BCC'].includes(modifierCode);
    const isPulliMei = modifierCode === '\u0BCD';

    let category = 'Tamil Akshara Unit';
    let formula = `${grapheme} (Independent Letter)`;
    let articulationTip =
        'Click any syllable bead to isolate its boundary and hear 0.6× remedial audio.';

    if (isPulliMei) {
        category = 'Mei Ezhuthu (மெய்யெழுத்து • Pure Consonant)';
        formula = `${baseChar} + ் (Pulli Dot) = ${grapheme}`;
        articulationTip =
            'The top Pulli dot suppresses the inherent "அ" vowel. Hold the consonant sound briefly without adding a vowel.';
    } else if (modifierCode && MATRA_TO_UYIR[modifierCode]) {
        const uyirInfo = MATRA_TO_UYIR[modifierCode];
        category = uyirInfo.name;
        formula = `${baseChar}் (Mei) + ${uyirInfo.uyir} (Uyir) = ${grapheme}`;
        if (isSplitOrPreMatra) {
            articulationTip = `2D Split/Pre-Matra Shield Active: Vowel sign wraps around '${baseChar}'. Locked inside one bead so the eye decodes it as a single syllable.`;
        }
    } else if (baseChar >= '\u0B95' && baseChar <= '\u0BB9' && !modifierCode) {
        category = 'Uyirmei Kuril (உயிர்மெய் குறில்)';
        formula = `${baseChar}் (Mei) + அ (Inherent Uyir) = ${baseChar}`;
    } else if (baseChar >= '\u0B85' && baseChar <= '\u0B94') {
        category = 'Uyir Ezhuthu (உயிரெழுத்து • Primary Vowel)';
        formula = `${baseChar} (Pure Vowel Sound)`;
    }

    if (mayangoliEntry) {
        articulationTip = `Mayangoli Phonetic Anchor (${baseChar}): ${mayangoliEntry.tip}`;
    }

    return {
        id: idPrefix,
        grapheme,
        baseChar,
        modifierCode,
        mayangoliGroup: mayangoliEntry ? mayangoliEntry.group : null,
        isSplitOrPreMatra,
        isPulliMei,
        category,
        formula,
        articulationTip
    };
}

/**
 * Full Passage Tokenizer Pipeline
 */
export function tokenizeTamilPassage(
    passage: string,
    enableDecompounding: boolean
): {
    words: TokenizedWord[];
    metrics: {
        totalBeads: number;
        splitMatraCount: number;
        decompoundedCount: number;
        mayangoliCount: number;
    };
} {
    const rawTokens = passage.trim().split(/\s+/).filter(Boolean);
    let totalBeads = 0;
    let splitMatraCount = 0;
    let decompoundedCount = 0;
    let mayangoliCount = 0;

    const words: TokenizedWord[] = rawTokens.map((rawWord, wIdx) => {
        const match = rawWord.match(/^(.+?)([.,!?;:"'()]+)$/);
        const cleanWord = match ? match[1] : rawWord;
        const trailingPunctuation = match ? match[2] : '';

        const morphemeStrings = enableDecompounding
            ? decompoundAgglutinatedWord(cleanWord)
            : [cleanWord];

        if (morphemeStrings.length > 1) {
            decompoundedCount++;
        }

        const morphemes: AksharaBead[][] = morphemeStrings.map((mStr, mIdx) => {
            const graphemes = segmentTamilGraphemes(mStr);
            return graphemes.map((g, gIdx) => {
                const bead = analyzeAksharaBead(g, `w${wIdx}-m${mIdx}-b${gIdx}`);
                totalBeads++;
                if (bead.isSplitOrPreMatra) splitMatraCount++;
                if (bead.mayangoliGroup) mayangoliCount++;
                return bead;
            });
        });

        return {
            id: `word-${wIdx}`,
            rawWord,
            cleanWord,
            trailingPunctuation,
            isDecompounded: morphemeStrings.length > 1,
            morphemes
        };
    });

    return {
        words,
        metrics: {
            totalBeads,
            splitMatraCount,
            decompoundedCount,
            mayangoliCount
        }
    };
}

/**
 * Client-Side Web Speech API Synthesizer for Tamil (ta-IN)
 */
export function speakTamil(text: string, rate = 0.6): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ta-IN';
    utterance.rate = rate;
    const voices = window.speechSynthesis.getVoices();
    const tamilVoice = voices.find((v) => v.lang.toLowerCase().includes('ta'));
    if (tamilVoice) {
        utterance.voice = tamilVoice;
    }
    window.speechSynthesis.speak(utterance);
}

export function stopTamilSpeech(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}

/**
 * Self-contained Web Audio API chime for positive reinforcement
 * (Ding: D5 587Hz -> A5 880Hz)
 */
export function playSuccessChime(): void {
    if (typeof window === 'undefined') return;
    try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.14);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.28);
    } catch {
        // AudioContext might be restricted until user gesture; silently ignore
    }
}

/**
 * Soft gentle hesitation/stall notification tone
 * (C4 261Hz gentle hum)
 */
export function playStallChime(): void {
    if (typeof window === 'undefined') return;
    try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(329.63, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(261.63, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
    } catch {
        // Ignore AudioContext issues
    }
}

/**
 * Normalizes Tamil string by removing trailing punctuation and extra spaces
 */
export function cleanTamilWord(word: string): string {
    return word.replace(/[.,!?;:"'()\-—]/g, '').trim().normalize('NFC');
}

/**
 * Fuzzy matcher for live streaming Tamil speech recognition
 * Accounts for colloquial suffixes, minor matra variants, and interim stream noise.
 */
export function isTamilWordMatch(spokenStream: string, targetWord: string): boolean {
    const cleanTarget = cleanTamilWord(targetWord);
    const cleanSpoken = cleanTamilWord(spokenStream);

    if (!cleanTarget || !cleanSpoken) return false;

    // Direct match
    if (cleanTarget === cleanSpoken) return true;

    // Check if whole clean target is contained in spoken stream or vice versa
    if (cleanSpoken.includes(cleanTarget) || cleanTarget.includes(cleanSpoken)) {
        return true;
    }

    // Tokenized search: check if any spoken token matches the target
    const spokenTokens = cleanSpoken.split(/\s+/);
    for (const token of spokenTokens) {
        if (token === cleanTarget) return true;
        // Prefix match for agglutinated endings (e.g. "படத்தில்" matches "படத்திலிருந்து")
        if (token.length >= 3 && cleanTarget.startsWith(token)) return true;
        if (cleanTarget.length >= 3 && token.startsWith(cleanTarget)) return true;

        // Sub-grapheme overlap similarity
        const targetGraphemes = segmentTamilGraphemes(cleanTarget);
        const tokenGraphemes = segmentTamilGraphemes(token);
        if (targetGraphemes.length > 0 && tokenGraphemes.length > 0) {
            let shared = 0;
            for (const g of tokenGraphemes) {
                if (targetGraphemes.includes(g)) shared++;
            }
            const ratio = shared / Math.max(targetGraphemes.length, tokenGraphemes.length);
            if (ratio >= 0.65) return true;
        }
    }

    return false;
}

/**
 * Calculates per-akshara display duration in milliseconds based on reading rate
 */
export function calculateAksharaDurationMs(audioRate = 0.6): number {
    const baseMs = 220; // 220ms per Tamil akshara
    return Math.max(120, Math.round(baseMs / Math.max(0.35, Math.min(1.2, audioRate))));
}