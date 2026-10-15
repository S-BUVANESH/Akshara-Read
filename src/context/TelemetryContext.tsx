import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StudentRecord, TelemetryData } from '../types/tamil';
import { INITIAL_STUDENT_COHORT } from '../data/diagnosticCorpus';

interface TelemetryContextType {
    telemetry: TelemetryData;
    recordWordRead: (word: string) => void;
    recordStall: (word: string) => void;
    addTrickyWord: (word: string) => void;
    removeTrickyWord: (word: string) => void;
    recordQuizResult: (isCorrect: boolean) => void;
    addScreeningRecord: (student: StudentRecord) => void;
    resetTelemetry: () => void;
}

const STORAGE_KEY = 'akshara_read_telemetry_v1';

const DEFAULT_TELEMETRY: TelemetryData = {
    wordsReadCount: 42,
    stallsDetectedCount: 3,
    uyirmeiAccuracy: 76,
    trickyWords: ['படத்திலிருந்து', 'கொடுக்கப்பட்டது', 'ஒளிச்சேர்க்கை'],
    mayangoliScore: { total: 8, correct: 7 },
    studentCohort: INITIAL_STUDENT_COHORT
};

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [telemetry, setTelemetry] = useState<TelemetryData>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    ...DEFAULT_TELEMETRY,
                    ...parsed,
                    studentCohort: parsed.studentCohort || INITIAL_STUDENT_COHORT
                };
            }
        } catch (e) {
            console.warn('Failed to load telemetry from localStorage:', e);
        }
        return DEFAULT_TELEMETRY;
    });

    // Save to localStorage whenever telemetry changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(telemetry));
        } catch (e) {
            console.warn('Failed to save telemetry to localStorage:', e);
        }
    }, [telemetry]);

    // Cross-tab real-time synchronization via storage event
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && e.newValue) {
                try {
                    const updated = JSON.parse(e.newValue);
                    setTelemetry(updated);
                } catch (err) {
                    console.warn('Failed to sync storage across tabs:', err);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const recordWordRead = useCallback((_word: string) => {
        setTelemetry((prev) => {
            const nextWords = prev.wordsReadCount + 1;
            // Slightly recalculate accuracy as practice increases
            const nextAccuracy = Math.min(
                98,
                Math.round(prev.uyirmeiAccuracy + (nextWords % 4 === 0 ? 1 : 0))
            );
            return {
                ...prev,
                wordsReadCount: nextWords,
                uyirmeiAccuracy: nextAccuracy
            };
        });
    }, []);

    const recordStall = useCallback((word: string) => {
        setTelemetry((prev) => {
            const nextStalls = prev.stallsDetectedCount + 1;
            const updatedTricky = prev.trickyWords.includes(word)
                ? prev.trickyWords
                : [word, ...prev.trickyWords];
            const nextAccuracy = Math.max(50, prev.uyirmeiAccuracy - 1);
            return {
                ...prev,
                stallsDetectedCount: nextStalls,
                trickyWords: updatedTricky,
                uyirmeiAccuracy: nextAccuracy
            };
        });
    }, []);

    const addTrickyWord = useCallback((word: string) => {
        if (!word) return;
        setTelemetry((prev) => {
            if (prev.trickyWords.includes(word)) return prev;
            return {
                ...prev,
                trickyWords: [word, ...prev.trickyWords]
            };
        });
    }, []);

    const removeTrickyWord = useCallback((word: string) => {
        setTelemetry((prev) => ({
            ...prev,
            trickyWords: prev.trickyWords.filter((w) => w !== word)
        }));
    }, []);

    const recordQuizResult = useCallback((isCorrect: boolean) => {
        setTelemetry((prev) => {
            const nextTotal = prev.mayangoliScore.total + 1;
            const nextCorrect = prev.mayangoliScore.correct + (isCorrect ? 1 : 0);
            const ratio = Math.round((nextCorrect / nextTotal) * 100);
            const newUyirmei = Math.round((prev.uyirmeiAccuracy * 0.7) + (ratio * 0.3));
            return {
                ...prev,
                mayangoliScore: { total: nextTotal, correct: nextCorrect },
                uyirmeiAccuracy: Math.min(99, Math.max(45, newUyirmei))
            };
        });
    }, []);

    const addScreeningRecord = useCallback((newStudent: StudentRecord) => {
        setTelemetry((prev) => ({
            ...prev,
            studentCohort: [newStudent, ...prev.studentCohort]
        }));
    }, []);

    const resetTelemetry = useCallback(() => {
        setTelemetry(DEFAULT_TELEMETRY);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return (
        <TelemetryContext.Provider
            value={{
                telemetry,
                recordWordRead,
                recordStall,
                addTrickyWord,
                removeTrickyWord,
                recordQuizResult,
                addScreeningRecord,
                resetTelemetry
            }}
        >
            {children}
        </TelemetryContext.Provider>
    );
};

export const useTelemetry = (): TelemetryContextType => {
    const context = useContext(TelemetryContext);
    if (!context) {
        throw new Error('useTelemetry must be used within a TelemetryProvider');
    }
    return context;
};
