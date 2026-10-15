import { PassagePreset, MayangoliMinimalPair, StudentRecord } from '../types/tamil';

export const SAMACHEER_PASSAGES: PassagePreset[] = [
    {
        id: 'p1',
        title: 'Split-Matras & Agglutinative Compounds',
        grade: 'Grade 3 • Term 1',
        focusTag: 'கொடி • தோசை • படத்திலிருந்து',
        text: 'படத்திலிருந்து கொடியும் தோசையும் கொடுக்கப்பட்டது. பள்ளிக்கூடத்திலிருந்து குழந்தைகள் மகிழ்ச்சியுடன் வந்தார்கள்.'
    },
    {
        id: 'p2',
        title: 'Mayangoli Homophone Traps (ல / ள / ழ)',
        grade: 'Grade 4 • Term 2',
        focusTag: 'வால் vs வாள் • மழை vs மலை',
        text: 'வால் உள்ள குரங்கு வாள் ஏந்திய வீரனைப் பார்த்தது. மழை பெய்ததால் வாழை பழம் விழுந்தது. கரை மேல் அலை அடித்தது.'
    },
    {
        id: 'p3',
        title: 'Science Multi-Morpheme Terminology',
        grade: 'Grade 5 • EVS',
        focusTag: 'ஒளிச்சேர்க்கை • சுற்றுச்சூழல்',
        text: 'தாவரங்கள் சூரிய ஒளியிலிருந்து ஒளிச்சேர்க்கை மூலம் உணவு தயாரிக்கின்றன. சுற்றுச்சூழல் பாதுகாப்பு நம் அனைவரின் கடமையாகும்.'
    },
    {
        id: 'p4',
        title: 'Nasal & Rhotic Distinctions (ந / ன / ண & ர / ற)',
        grade: 'Grade 3 • Remedial Drill',
        focusTag: 'மனம் vs மணம் • கரை vs கறை',
        text: 'நல்ல மனம் கொண்டவன் மலரின் மணம் அறிந்தான். ஆற்றின் கரை ஓரத்தில் துணியின் கறை நீங்கியது.'
    }
];

export const MAYANGOLI_PAIRS: MayangoliMinimalPair[] = [
    {
        id: 'pair-1',
        groupLabel: 'Lateral Approximants (ல vs ள)',
        groupType: 'lateral',
        wordA: {
            tamil: 'வால்',
            targetLetter: 'ல் (ல)',
            transliteration: 'Vāl (Alveolar la)',
            meaning: 'Animal Tail',
            emoji: '🐒',
            sampleSentence: 'குரங்கிற்கு நீளமான வால் உள்ளது.',
            tongueTip: 'Touch tongue tip gently behind the upper front teeth (நுனிநா லகரம்).'
        },
        wordB: {
            tamil: 'வாள்',
            targetLetter: 'ள் (ள)',
            transliteration: 'Vāḷ (Retroflex La)',
            meaning: 'Warrior Sword',
            emoji: '⚔️',
            sampleSentence: 'வீரன் கையில் கூர்மையான வாள் ஏந்தினான்.',
            tongueTip: 'Curl the tongue tip slightly back to touch the hard palate (மடக்கு ளகரம்).'
        }
    },
    {
        id: 'pair-2',
        groupLabel: 'Lateral vs Retroflex Approximant (ல vs ழ)',
        groupType: 'lateral',
        wordA: {
            tamil: 'மலை',
            targetLetter: 'லை (ல)',
            transliteration: 'Malai',
            meaning: 'Mountain Peak',
            emoji: '🏔️',
            sampleSentence: 'உயரமான மலை மீது மேகம் சூழ்ந்தது.',
            tongueTip: 'Flat tongue tip touching upper teeth ridge.'
        },
        wordB: {
            tamil: 'மழை',
            targetLetter: 'ழை (ழ)',
            transliteration: 'Maḻai',
            meaning: 'Rain Shower',
            emoji: '🌧️',
            sampleSentence: 'வானத்திலிருந்து பலத்த மழை பெய்தது.',
            tongueTip: 'Deep retroflex curl without touching the roof of the mouth (சிறப்பு ழகரம்).'
        }
    },
    {
        id: 'pair-3',
        groupLabel: 'Rhotic Tap vs Trill (ர vs ற)',
        groupType: 'rhotic',
        wordA: {
            tamil: 'கரை',
            targetLetter: 'ரை (ர)',
            transliteration: 'Karai (Soft ra)',
            meaning: 'Riverbank / Shore',
            emoji: '🏞️',
            sampleSentence: 'படகு ஆற்றின் கரை வந்து சேர்ந்தது.',
            tongueTip: 'Light single tap of the tongue against the alveolar ridge (இடையின ரகரம்).'
        },
        wordB: {
            tamil: 'கறை',
            targetLetter: 'றை (ற)',
            transliteration: 'Kaṟai (Hard Rra)',
            meaning: 'Ink / Dirt Stain',
            emoji: '👕',
            sampleSentence: 'சட்டையில் படிந்த மसी கறை நீங்கியது.',
            tongueTip: 'Firm alveolar trill with stronger airflow (வல்லின றகரம்).'
        }
    },
    {
        id: 'pair-4',
        groupLabel: 'Alveolar vs Retroflex Nasal (ன vs ண)',
        groupType: 'nasal',
        wordA: {
            tamil: 'மனம்',
            targetLetter: 'ன (2-Loop)',
            transliteration: 'Maṉam',
            meaning: 'Mind / Heart',
            emoji: '🧠',
            sampleSentence: 'அமைதியான மனம் மகிழ்ச்சி தரும்.',
            tongueTip: 'Two-loop ன: Tongue tip touches alveolar ridge (றன்னகரம்).'
        },
        wordB: {
            tamil: 'மணம்',
            targetLetter: 'ண (3-Loop)',
            transliteration: 'Maṇam',
            meaning: 'Fragrance / Aroma',
            emoji: '🌸',
            sampleSentence: 'மல்லிகைப் பூவின் மணம் வீசியது.',
            tongueTip: 'Three-loop ண: Curl tongue back to roof of mouth (டண்ணகரம்).'
        }
    }
];

export const INITIAL_STUDENT_COHORT: StudentRecord[] = [
    {
        id: 'STU-101',
        name: 'Kavin M.',
        grade: 'Class 3',
        schoolBlock: 'Chennai PUMS - Block A',
        uyirmeiAccuracy: 54,
        splitMatraScore: 42,
        mayangoliScore: 48,
        readingLagMonths: 14,
        status: 'Critical Intervention'
    },
    {
        id: 'STU-102',
        name: 'harini S.',
        grade: 'Class 4',
        schoolBlock: 'Coimbatore North - Block B',
        uyirmeiAccuracy: 68,
        splitMatraScore: 61,
        mayangoliScore: 55,
        readingLagMonths: 11,
        status: 'Moderate Scaffold'
    },
    {
        id: 'STU-103',
        name: 'Pranav R.',
        grade: 'Class 3',
        schoolBlock: 'Chennai PUMS - Block A',
        uyirmeiAccuracy: 49,
        splitMatraScore: 38,
        mayangoliScore: 44,
        readingLagMonths: 16,
        status: 'Critical Intervention'
    },
    {
        id: 'STU-104',
        name: 'Meenakshi V.',
        grade: 'Class 5',
        schoolBlock: 'Madurai South - Block C',
        uyirmeiAccuracy: 86,
        splitMatraScore: 82,
        mayangoliScore: 79,
        readingLagMonths: 3,
        status: 'On Track'
    }
];