import React from 'react';
import { BookOpen, Sparkles, Camera, Stethoscope, Printer, Activity } from 'lucide-react';

export type ActiveTab = 'reader' | 'mayangoli' | 'scanner' | 'brte' | 'benchmark';

interface NavbarProps {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
    return (
        <header className="navbar">
            <div className="brand-group">
                <div className="brand-logo">அ</div>
                <div className="brand-title">
                    <h1>
                        AKSHARA-READ{' '}
                        <span style={{ fontWeight: 400, fontSize: '0.85rem', color: '#93C5FD' }}>
                            | Team ArQAM Knights
                        </span>
                    </h1>
                    <p>Complete School Assistive Learning Journey for Tamil Dyslexic Learners</p>
                </div>
            </div>

            <nav className="nav-tabs">
                <button
                    className={`nav-tab ${activeTab === 'reader' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reader')}
                >
                    <BookOpen size={15} /> 1. Guided Reader
                </button>
                <button
                    className={`nav-tab ${activeTab === 'mayangoli' ? 'active' : ''}`}
                    onClick={() => setActiveTab('mayangoli')}
                >
                    <Sparkles size={15} /> 2. Mayangoli Lab (ல/ள/ழ)
                </button>
                <button
                    className={`nav-tab ${activeTab === 'scanner' ? 'active' : ''}`}
                    onClick={() => setActiveTab('scanner')}
                >
                    <Camera size={15} /> 3. Textbook OCR & Voice
                </button>
                <button
                    className={`nav-tab ${activeTab === 'benchmark' ? 'active' : ''}`}
                    onClick={() => setActiveTab('benchmark')}
                >
                    <Activity size={15} /> 4. Live A/B Validation
                </button>
                <button
                    className={`nav-tab ${activeTab === 'brte' ? 'active' : ''}`}
                    onClick={() => setActiveTab('brte')}
                >
                    <Stethoscope size={15} /> 5. BRTE School Portal
                </button>
            </nav>

            <button
                className="btn-print-nav"
                onClick={() => {
                    setActiveTab('reader');
                    setTimeout(() => window.print(), 150);
                }}
                title="Generate Printable A4 Classroom Worksheet"
            >
                <Printer size={16} /> Print BRTE Worksheet
            </button>
        </header>
    );
};