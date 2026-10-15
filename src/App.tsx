import React, { useState } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { ReaderWorkspace } from './components/ReaderWorkspace';
import { MayangoliLab } from './components/MayangoliLab';
import { TextbookScanner } from './components/TextbookScanner';
import { BRTEDashboard } from './components/BRTEDashboard';
import { LiveABBenchmark } from './components/LiveABBenchmark';
import { SAMACHEER_PASSAGES } from './data/diagnosticCorpus';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { TelemetryProvider } from './context/TelemetryContext';


const JOURNEY_STEPS: Array<{
    tab: ActiveTab;
    stepNum: string;
    title: string;
    subtitle: string;
}> = [
        {
            tab: 'reader',
            stepNum: 'Stage 1',
            title: 'Smart Word-Flow & Hard-Word Assist',
            subtitle: 'Karaoke Highlighting + Click Tricky Words + Letter Tracing'
        },
        {
            tab: 'mayangoli',
            stepNum: 'Stage 2',
            title: 'Mayangoli Semantic Gym',
            subtitle: 'Homophone Pairs (வால் vs வாள்) & Auditory Binding'
        },
        {
            tab: 'scanner',
            stepNum: 'Stage 3',
            title: 'Samacheer Textbook OCR & Voice',
            subtitle: 'Snap Homework Page or Dictate in Tamil (ta-IN)'
        },
        {
            tab: 'benchmark',
            stepNum: 'Stage 4',
            title: 'Live A/B Fluency & Tongue Coach',
            subtitle: 'WCPM Stopwatch + Sagittal Mouth Biomechanics'
        },
        {
            tab: 'brte',
            stepNum: 'Stage 5',
            title: 'BRTE School IEP & Print Handout',
            subtitle: 'Multi-Block Screening Registry + A4 Worksheet'
        }
    ];

export const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('reader');
    const [passageText, setPassageText] = useState<string>(SAMACHEER_PASSAGES[0].text);

    const handleSendToReader = (newText: string) => {
        setPassageText(newText);
        setActiveTab('reader');
    };

    return (
        <TelemetryProvider>
            <div>
                <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

                <main className="app-container">
                    {/* Interactive 5-Stage School Learning Journey Ribbon */}
                    <div
                        className="card-surface no-print"
                        style={{
                            marginBottom: '1.35rem',
                            padding: '0.9rem 1.25rem',
                            background: 'linear-gradient(90deg, #FFFDF9 0%, #F0F7FF 100%)',
                            border: '1.5px solid var(--blue-border)'
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '0.65rem'
                            }}
                        >
                            {JOURNEY_STEPS.map((item, idx) => {
                                const isActive = activeTab === item.tab;
                                return (
                                    <React.Fragment key={item.tab}>
                                        <div
                                            onClick={() => setActiveTab(item.tab)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.6rem',
                                                padding: '0.45rem 0.8rem',
                                                borderRadius: '10px',
                                                cursor: 'pointer',
                                                background: isActive ? 'var(--blue-deep)' : 'transparent',
                                                color: isActive ? '#FFFFFF' : 'var(--blue-deep)',
                                                transition: 'all 0.2s ease',
                                                flex: '1 1 180px'
                                            }}
                                        >
                                            <CheckCircle2
                                                size={18}
                                                color={isActive ? '#93C5FD' : 'var(--blue-accent)'}
                                            />
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: '0.68rem',
                                                        textTransform: 'uppercase',
                                                        fontWeight: 800,
                                                        color: isActive ? '#93C5FD' : 'var(--blue-accent)'
                                                    }}
                                                >
                                                    {item.stepNum}
                                                </div>
                                                <div style={{ fontSize: '0.82rem', fontWeight: 800 }}>
                                                    {item.title}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: '0.68rem',
                                                        color: isActive ? '#DBEAFE' : 'var(--text-muted)'
                                                    }}
                                                >
                                                    {item.subtitle}
                                                </div>
                                            </div>
                                        </div>
                                        {idx < JOURNEY_STEPS.length - 1 && (
                                            <ArrowRight size={15} color="var(--text-muted)" />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    {/* Active Module View */}
                    {activeTab === 'reader' && (
                        <ReaderWorkspace
                            passageText={passageText}
                            setPassageText={setPassageText}
                        />
                    )}
                    {activeTab === 'mayangoli' && (
                        <MayangoliLab onSendToReader={handleSendToReader} />
                    )}
                    {activeTab === 'scanner' && (
                        <TextbookScanner onSendToReader={handleSendToReader} />
                    )}
                    {activeTab === 'benchmark' && <LiveABBenchmark />}
                    {activeTab === 'brte' && <BRTEDashboard />}
                </main>
            </div>
        </TelemetryProvider>
    );
};

export default App;