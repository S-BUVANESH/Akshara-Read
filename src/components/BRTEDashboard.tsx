import React, { useState } from 'react';
import { StudentRecord } from '../types/tamil';
import { useTelemetry } from '../context/TelemetryContext';
import {
    Users,
    AlertTriangle,
    CheckCircle,
    Award,
    Activity,
    BookmarkPlus,
    Printer,
    FileText,
    Volume2
} from 'lucide-react';
import { speakTamil } from '../engine/tamilOrthographyEngine';

export const BRTEDashboard: React.FC = () => {
    const { telemetry, addScreeningRecord, removeTrickyWord } = useTelemetry();
    const [drillCompleted, setDrillCompleted] = useState<boolean>(false);
    const [filterBlock, setFilterBlock] = useState<string>('all');

    const handleRecordScreening = () => {
        const newStudent: StudentRecord = {
            id: `STU-10${telemetry.studentCohort.length + 1}`,
            name: `Screened Learner #${telemetry.studentCohort.length + 1}`,
            grade: 'Class 3',
            schoolBlock: 'Coimbatore North - Block B',
            uyirmeiAccuracy: telemetry.uyirmeiAccuracy,
            splitMatraScore: 72,
            mayangoliScore: Math.round(
                (telemetry.mayangoliScore.correct / Math.max(1, telemetry.mayangoliScore.total)) * 100
            ),
            readingLagMonths: 7,
            status:
                telemetry.uyirmeiAccuracy >= 75
                    ? 'On Track'
                    : telemetry.uyirmeiAccuracy >= 60
                        ? 'Moderate Scaffold'
                        : 'Critical Intervention'
        };

        addScreeningRecord(newStudent);
        setDrillCompleted(true);
        setTimeout(() => setDrillCompleted(false), 4500);
    };

    const filteredStudents =
        filterBlock === 'all'
            ? telemetry.studentCohort
            : telemetry.studentCohort.filter((s) => s.schoolBlock.includes(filterBlock));

    return (
        <div>
            {/* Top Systemic Context Banner */}
            <div className="card-surface" style={{ marginBottom: '1.5rem' }}>
                <div className="section-header-tag">
                    <span>Block Resource Teacher Educator (BRTE) Multi-School Command Center</span>
                    <span>CIIL Mysore (2015) & SRM IST (2025) Clinical Protocol</span>
                </div>
                <h2 style={{ fontSize: '1.35rem', color: 'var(--blue-deep)', marginBottom: '0.35rem' }}>
                    Multi-School Diagnostic Registry & Real-Time Assistive Telemetry
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    With over 50% of Tamil Nadu&apos;s 6,000 sanctioned BRTE posts vacant, lone educators must
                    oversee dozens of schools. This command center aggregates live speech telemetry,
                    sub-syllabic decoding hesitations, and Mayangoli audits across Chennai PUMS and district cohorts.
                </p>
            </div>

            {/* Live Telemetry KPI Cards Connected Across Modules */}
            <div className="metrics-grid">
                <div className="metric-tile">
                    <div className="metric-tile-label">Live Words Read</div>
                    <div className="metric-tile-val" style={{ color: '#16A34A' }}>
                        {telemetry.wordsReadCount}
                    </div>
                    <div className="metric-tile-sub">Real-Time Mic Follow-Along</div>
                </div>
                <div className="metric-tile">
                    <div className="metric-tile-label">Hesitation Stalls Logged</div>
                    <div className="metric-tile-val" style={{ color: '#DC2626' }}>
                        {telemetry.stallsDetectedCount}
                    </div>
                    <div className="metric-tile-sub">&gt;2.8s Auto-Remediation Events</div>
                </div>
                <div className="metric-tile">
                    <div className="metric-tile-label">Uyirmei Decoding Accuracy</div>
                    <div className="metric-tile-val" style={{ color: 'var(--blue-accent)' }}>
                        {telemetry.uyirmeiAccuracy}%
                    </div>
                    <div className="metric-tile-sub">CIIL Mysore Metric (p &lt; 0.01)</div>
                </div>
                <div className="metric-tile">
                    <div className="metric-tile-label">Tricky Words in Bank</div>
                    <div className="metric-tile-val" style={{ color: 'var(--blue-deep)' }}>
                        {telemetry.trickyWords.length}
                    </div>
                    <div className="metric-tile-sub">Active Intervention Target List</div>
                </div>
            </div>

            {/* Live Tricky Word Bank Panel */}
            <div className="card-surface" style={{ marginBottom: '1.5rem' }}>
                <div className="section-header-tag">
                    <span>Live Student Tricky Word Bank ({telemetry.trickyWords.length} Words)</span>
                    <BookmarkPlus size={15} />
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Aggregated in real time from the Guided Reader whenever a student hesitates (&gt;2.8s) or
                    clicks a word for remedial support:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {telemetry.trickyWords.map((word) => (
                        <span
                            key={word}
                            style={{
                                background: '#FEF08A',
                                border: '1.5px solid #F59E0B',
                                color: '#854D0E',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '999px',
                                fontFamily: 'Noto Sans Tamil',
                                fontWeight: 800,
                                fontSize: '0.88rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                cursor: 'pointer'
                            }}
                            onClick={() => speakTamil(word, 0.55)}
                        >
                            <Volume2 size={13} /> {word}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeTrickyWord(word);
                                }}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#166534',
                                    cursor: 'pointer',
                                    fontWeight: 900,
                                    fontSize: '0.9rem'
                                }}
                                title="Mark Mastered"
                            >
                                ✓
                            </button>
                        </span>
                    ))}
                    {telemetry.trickyWords.length === 0 && (
                        <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                            No tricky words currently flagged! Practice reading in Tab 1 to populate.
                        </span>
                    )}
                </div>
            </div>

            {/* Cohort Diagnostic Table */}
            <div className="card-surface" style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
                <div className="section-header-tag">
                    <span>Active BRTE Block Cohort Diagnostic Registry ({filteredStudents.length} Students)</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select
                            className="select-box"
                            style={{ width: 'auto', marginBottom: 0, padding: '0.35rem 0.7rem' }}
                            value={filterBlock}
                            onChange={(e) => setFilterBlock(e.target.value)}
                        >
                            <option value="all">All School Blocks</option>
                            <option value="Chennai">Chennai PUMS</option>
                            <option value="Coimbatore">Coimbatore North</option>
                            <option value="Madurai">Madurai South</option>
                        </select>
                        <button className="btn-primary" onClick={handleRecordScreening}>
                            + Log 60-Second Rapid Screening
                        </button>
                    </div>
                </div>

                {drillCompleted && (
                    <div
                        style={{
                            padding: '0.65rem 1rem',
                            background: '#DCFCE7',
                            color: '#166534',
                            borderRadius: '8px',
                            marginBottom: '1rem',
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <CheckCircle size={16} /> New rapid screening logged into offline localStorage
                        telemetry!
                    </div>
                )}

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                    <thead>
                        <tr
                            style={{
                                borderBottom: '2px solid var(--blue-border)',
                                textAlign: 'left',
                                color: 'var(--blue-primary)'
                            }}
                        >
                            <th style={{ padding: '0.75rem' }}>Student ID & Name</th>
                            <th style={{ padding: '0.75rem' }}>Grade & Block</th>
                            <th style={{ padding: '0.75rem' }}>Uyirmei Separation</th>
                            <th style={{ padding: '0.75rem' }}>Split-Matra (கொ/தோ)</th>
                            <th style={{ padding: '0.75rem' }}>Mayangoli (ல/ள/ழ)</th>
                            <th style={{ padding: '0.75rem' }}>Reading Lag</th>
                            <th style={{ padding: '0.75rem' }}>Intervention Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.map((st) => (
                            <tr
                                key={st.id}
                                style={{ borderBottom: '1px solid var(--bg-cream-alt)' }}
                            >
                                <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                                    {st.id} • {st.name}
                                </td>
                                <td style={{ padding: '0.75rem' }}>
                                    {st.grade} ({st.schoolBlock})
                                </td>
                                <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                                    {st.uyirmeiAccuracy}%
                                </td>
                                <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                                    {st.splitMatraScore}%
                                </td>
                                <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                                    {st.mayangoliScore}%
                                </td>
                                <td style={{ padding: '0.75rem' }}>{st.readingLagMonths} months</td>
                                <td style={{ padding: '0.75rem' }}>
                                    <span
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.3rem',
                                            padding: '0.25rem 0.65rem',
                                            borderRadius: '999px',
                                            fontSize: '0.75rem',
                                            fontWeight: 800,
                                            background:
                                                st.status === 'Critical Intervention'
                                                    ? '#FEE2E2'
                                                    : st.status === 'Moderate Scaffold'
                                                        ? '#FEF3C7'
                                                        : '#DCFCE7',
                                            color:
                                                st.status === 'Critical Intervention'
                                                    ? '#991B1B'
                                                    : st.status === 'Moderate Scaffold'
                                                        ? '#92400E'
                                                        : '#166534'
                                        }}
                                    >
                                        {st.status === 'Critical Intervention' ? (
                                            <AlertTriangle size={13} />
                                        ) : st.status === 'Moderate Scaffold' ? (
                                            <Users size={13} />
                                        ) : (
                                            <CheckCircle size={13} />
                                        )}
                                        {st.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* IEP Summary Report Card */}
            <div
                className="card-surface"
                style={{
                    background: 'linear-gradient(90deg, #FFFDF9 0%, #EFF6FF 100%)',
                    border: '1.5px solid var(--blue-border)'
                }}
            >
                <div className="section-header-tag">
                    <span>Clinical Individualized Education Plan (IEP) Action Plan</span>
                    <FileText size={15} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                        <h4 style={{ color: 'var(--blue-deep)', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                            1. Split-Matra (கொ/தோ) Flanking Remediation
                        </h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Prescribe daily 10-minute sessions in Guided Reader with Split-Matra badges enabled (⇄).
                            Targets HarfBuzz visual confusion where the left kombu (ெ) is read before the base consonant.
                        </p>
                    </div>

                    <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                        <h4 style={{ color: 'var(--blue-deep)', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                            2. Mayangoli (ல/ள/ழ) Proprioceptive Biofeedback
                        </h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Utilize Stage 4 Sagittal Biomechanics Visualizer for 5 minutes before oral reading.
                            Reinforces alveolar vs. retroflex tongue contact points to eliminate dictionary-silent homophone errors.
                        </p>
                    </div>

                    <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                        <h4 style={{ color: 'var(--blue-deep)', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                            3. DGE Tamil Nadu Board Concessions
                        </h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Eligible learners with reading lag &gt; 12 months qualify for 30 minutes compensatory
                            exam time and scribe/reader concessions under Tamil Nadu DGE Circular (2024).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};