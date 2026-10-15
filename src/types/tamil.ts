export type MayangoliGroup = 'lateral' | 'rhotic' | 'nasal' | null;

export interface AksharaBead {
    id: string;
    grapheme: string;
    baseChar: string;
    modifierCode: string | null;
    mayangoliGroup: MayangoliGroup;
    isSplitOrPreMatra: boolean;
    isPulliMei: boolean;
    category: string;
    formula: string;
    articulationTip: string;
}

export interface TokenizedWord {
    id: string;
    rawWord: string;
    cleanWord: string;
    trailingPunctuation: string;
    isDecompounded: boolean;
    morphemes: AksharaBead[][];
}

export interface TypographySettings {
    beadGapEm: number;
    lineHeightScale: number;
    fontSizePx: number;
    audioRate: number;
    enableBeads: boolean;
    enableDecompound: boolean;
    enableMayangoli: boolean;
    enableSplitMatraBadge: boolean;
    enableFocusRuler: boolean;
}

export interface PassagePreset {
    id: string;
    title: string;
    grade: string;
    focusTag: string;
    text: string;
}

export interface MayangoliMinimalPair {
    id: string;
    groupLabel: string;
    groupType: 'lateral' | 'rhotic' | 'nasal';
    wordA: {
        tamil: string;
        targetLetter: string;
        transliteration: string;
        meaning: string;
        emoji: string;
        sampleSentence: string;
        tongueTip: string;
    };
    wordB: {
        tamil: string;
        targetLetter: string;
        transliteration: string;
        meaning: string;
        emoji: string;
        sampleSentence: string;
        tongueTip: string;
    };
}

export interface StudentRecord {
    id: string;
    name: string;
    grade: string;
    schoolBlock: string;
    uyirmeiAccuracy: number;
    splitMatraScore: number;
    mayangoliScore: number;
    readingLagMonths: number;
    status: 'Critical Intervention' | 'Moderate Scaffold' | 'On Track';
}

export type HighlightColor = 'tricky' | 'mayangoli' | 'mastered' | 'none';

export type MicWordStatus = 'unreached' | 'target' | 'verified' | 'stalled';

export interface TelemetryData {
    wordsReadCount: number;
    stallsDetectedCount: number;
    uyirmeiAccuracy: number;
    trickyWords: string[];
    mayangoliScore: { total: number; correct: number };
    studentCohort: StudentRecord[];
}