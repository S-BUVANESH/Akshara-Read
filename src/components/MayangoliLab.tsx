import React, { useState } from 'react';
import { Volume2, CheckCircle2, HelpCircle, ArrowRight } from 'lucide-react';
import { MAYANGOLI_PAIRS } from '../data/diagnosticCorpus';
import { speakTamil, playSuccessChime } from '../engine/tamilOrthographyEngine';
import { useTelemetry } from '../context/TelemetryContext';

interface MayangoliLabProps {
    onSendToReader: (sentence: string) => void;
}

export const MayangoliLab: React.FC<MayangoliLabProps> = ({ onSendToReader }) => {
    const { recordQuizResult } = useTelemetry();
    const [quizIndex, setQuizIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | null>(null);

    const activePair = MAYANGOLI_PAIRS[quizIndex];


    return (
        <div>
            <div className="card-surface" style={{ marginBottom: '1.5rem' }}>
                <div className="section-header-tag">
                    <span>ACL DravidianLangTech (2026) — Context-Sensitive Homophone Disambiguator</span>
                    <span>ல / ள / ழ • ர / ற • ந / ன / ண</span>
                </div>
                <h2 style={{ fontSize: '1.35rem', color: 'var(--blue-deep)', marginBottom: '0.4rem' }}>
                    Why Standard Spellcheckers Fail Dyslexic Tamil Readers
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    When a student swaps <strong>ல, ள, or ழ</strong>, the resulting word (such as{' '}
                    <strong>வால்</strong> [Tail] vs. <strong>வாள்</strong> [Sword]) is still a valid
                    dictionary word. Conventional spellcheckers stay silent. Use these visual semantic
                    anchors and tongue-placement cards to build permanent auditory-visual binding.
                </p>
            </div>

            {/* Visual Minimal Pair Cards Grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(520px, 1fr))',
                    gap: '1.25rem',
                    marginBottom: '1.75rem'
                }}
            >
                {MAYANGOLI_PAIRS.map((pair) => (
                    <div key={pair.id} className="card-surface">
                        <div className="section-header-tag">
                            <span>{pair.groupLabel}</span>
                            <span style={{ color: 'var(--blue-accent)' }}>Minimal Pair Anchor</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {[pair.wordA, pair.wordB].map((w, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        background: 'var(--bg-cream)',
                                        border: '1.5px solid var(--blue-border)',
                                        borderRadius: '12px',
                                        padding: '1rem'
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <span style={{ fontSize: '2.2rem' }}>{w.emoji}</span>
                                        <button
                                            className="btn-secondary"
                                            onClick={() => speakTamil(w.tamil, 0.55)}
                                        >
                                            <Volume2 size={14} /> {w.targetLetter}
                                        </button>
                                    </div>
                                    <div
                                        style={{
                                            fontFamily: 'Noto Sans Tamil',
                                            fontSize: '1.8rem',
                                            fontWeight: 800,
                                            color: 'var(--blue-deep)',
                                            marginTop: '0.35rem'
                                        }}
                                    >
                                        {w.tamil}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '0.84rem',
                                            fontWeight: 700,
                                            color: 'var(--blue-accent)'
                                        }}
                                    >
                                        {w.meaning} ({w.transliteration})
                                    </div>
                                    <p
                                        style={{
                                            fontSize: '0.78rem',
                                            color: 'var(--text-muted)',
                                            marginTop: '0.45rem'
                                        }}
                                    >
                                        <strong>Articulation:</strong> {w.tongueTip}
                                    </p>
                                    <div
                                        style={{
                                            marginTop: '0.65rem',
                                            paddingTop: '0.55rem',
                                            borderTop: '1px dashed var(--blue-border)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontFamily: 'Noto Sans Tamil',
                                                fontSize: '0.82rem',
                                                fontWeight: 600
                                            }}
                                        >
                                            {w.sampleSentence}
                                        </span>
                                        <button
                                            className="btn-primary"
                                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.72rem' }}
                                            onClick={() => onSendToReader(w.sampleSentence)}
                                            title="Open in Decodable Reader"
                                        >
                                            <ArrowRight size={13} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Interactive Auditory-Visual Binding Check */}
            <div className="card-surface">
                <div className="section-header-tag">
                    <span>Interactive Auditory-Visual Binding Check (CIIL Mysore Protocol)</span>
                    <span>
                        Pair {quizIndex + 1} of {MAYANGOLI_PAIRS.length}
                    </span>
                </div>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1rem'
                    }}
                >
                    <div>
                        <h3 style={{ fontSize: '1.1rem', color: 'var(--blue-deep)' }}>
                            Which word means &ldquo;{activePair.wordB.meaning}&rdquo; ({activePair.wordB.emoji})?
                        </h3>
                        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                            Hint: {activePair.wordB.tongueTip}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            className="btn-secondary"
                            style={{ fontSize: '1.2rem', fontFamily: 'Noto Sans Tamil' }}
                            onClick={() => {
                                setSelectedAnswer('A');
                                recordQuizResult(false);
                                speakTamil(activePair.wordA.tamil, 0.6);
                            }}
                        >
                            A: {activePair.wordA.tamil}
                        </button>
                        <button
                            className="btn-secondary"
                            style={{ fontSize: '1.2rem', fontFamily: 'Noto Sans Tamil' }}
                            onClick={() => {
                                setSelectedAnswer('B');
                                recordQuizResult(true);
                                playSuccessChime();
                                speakTamil(activePair.wordB.tamil, 0.6);
                            }}
                        >
                            B: {activePair.wordB.tamil}
                        </button>
                        <button
                            className="btn-primary"
                            onClick={() => {
                                setSelectedAnswer(null);
                                setQuizIndex((prev) => (prev + 1) % MAYANGOLI_PAIRS.length);
                            }}
                        >
                            Next Pair
                        </button>
                    </div>
                </div>
                {selectedAnswer && (
                    <div
                        style={{
                            marginTop: '1rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            background: selectedAnswer === 'B' ? '#DCFCE7' : '#FEE2E2',
                            color: selectedAnswer === 'B' ? '#166534' : '#991B1B',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {selectedAnswer === 'B' ? <CheckCircle2 size={18} /> : <HelpCircle size={18} />}
                        {selectedAnswer === 'B'
                            ? `Correct! "${activePair.wordB.tamil}" uses ${activePair.wordB.targetLetter} and means ${activePair.wordB.meaning}.`
                            : `Not quite! "${activePair.wordA.tamil}" means ${activePair.wordA.meaning} (${activePair.wordA.emoji}). Try option B!`}
                    </div>
                )}
            </div>
        </div>
    );
};