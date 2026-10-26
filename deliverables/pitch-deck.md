---
marp: true
theme: gaia
_class: lead
paginate: true
size: 16:9
backgroundColor: #0b1120
color: #f1f5f9
style: |
  section {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    padding: 36px 48px;
    font-size: 18px;
    line-height: 1.4;
  }
  h1 {
    color: #38bdf8;
    font-size: 38px;
    margin-bottom: 12px;
  }
  h2 {
    color: #38bdf8;
    font-size: 28px;
    margin-top: 0;
    margin-bottom: 12px;
    border-bottom: 2px solid #0284c7;
    padding-bottom: 6px;
  }
  h3 {
    color: #94a3b8;
    font-size: 20px;
    margin-top: 8px;
    margin-bottom: 6px;
  }
  p, li {
    font-size: 17px;
  }
  ul {
    margin-top: 6px;
    margin-bottom: 8px;
  }
  li {
    margin-bottom: 4px;
  }
  blockquote {
    background: rgba(15, 23, 42, 0.85);
    border-left: 4px solid #38bdf8;
    padding: 10px 16px;
    font-style: italic;
    color: #e2e8f0;
    font-size: 16px;
    margin: 8px 0;
  }
  code {
    background: #1e293b;
    color: #38bdf8;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 15px;
  }
  pre {
    background: #0f172a;
    border: 1px solid #334155;
    padding: 10px;
    font-size: 13px;
    border-radius: 6px;
  }
  table {
    font-size: 14px;
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
  }
  th {
    background: #0284c7;
    color: #ffffff;
    padding: 6px 10px;
    text-align: left;
  }
  td {
    border: 1px solid #334155;
    padding: 5px 10px;
  }
  .highlight {
    color: #38bdf8;
    font-weight: bold;
  }
  .badge {
    display: inline-block;
    background: #0284c7;
    color: white;
    padding: 3px 10px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: bold;
  }
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
---

<!-- _class: lead -->
# AlifBraille ⠠⠁⠇⠊⠋⠃⠗⠁⠊⠇⠇⠑
### Uzbek Latin to Braille, Ready for Swell Paper, for Visually Impaired Students

**SXSW EDU 2027 Student Impact Challenge**, Austin, Texas  
*Presented by The Allstate Foundation*

**Creator**: Elshod Kenjayev, Grade 11, Presidential School in Tashkent (solo student builder)  
**Location**: Tashkent, Uzbekistan  
**Live app**: [braille.elshod.xyz](https://braille.elshod.xyz) • **Code**: [github.com/Elshod09K/alifbraille](https://github.com/Elshod09K/alifbraille)

---

## 1. The 60-Second Pitch Opener

> "Good morning, Austin. My name is Elshod Kenjayev. I'm in Grade 11 at the Presidential School in Tashkent, Uzbekistan.
>
> Uzbekistan is moving its schools, textbooks and university entrance exams from Cyrillic to the Latin alphabet. In my classes, everything is already in Latin.
>
> Then I asked a simple question: what about students who read with their fingers? Most tactile books in school libraries were produced in Cyrillic Braille. There is no common, free tool that turns Uzbek Latin text into correct Braille, and most subject teachers can't read Braille to check a worksheet.
>
> So I built **AlifBraille**: a free, open-source web app that turns Uzbek Latin into correct 6-dot Braille as you type, prints it to scale on swell paper, and reads it aloud so a sighted teacher can check every cell. It already works. My next step is putting it in the hands of a real school."

---

## 2. The Problem

<div class="grid-2">
<div>

### The Alphabet Divide
- **Latin transition**: Uzbekistan is moving textbooks, curricula and state exams to the Latin script.
- **Braille lagging behind**: most tactile books in school libraries were produced in Cyrillic Braille.
- **Sighted-teacher bottleneck**: many subject teachers in specialized schools don't read Braille, so they can't easily make or check a tactile quiz themselves.

</div>
<div>

### Why Generic Tools Fail
- **Modified letters**: `o‘` and `g‘` are typed with many different apostrophes (`‘`, `'`, `’`, `` ` ``, `ʻ`), which generic tools mis-handle.
- **Digraphs**: `sh`, `ch`, `ng` must map to single 6-dot cells (e.g. `sh` = `⠱`, `ch` = `⠟`), not two letters.
- **Hardware cost**: commercial Braille embossers cost thousands of dollars. Swell paper plus a heat fuser is cheaper, but needs exact-scale print files.

</div>
</div>

---

## 3. What AlifBraille Delivers

1. **Deterministic Latin-to-Braille engine**:
   - Rule-based normalization and 6-dot Braille transcription, written in TypeScript.
   - Handles apostrophe variants, digraphs, numerals (`⠼`) and punctuation. 100% client-side, works offline.
2. **Marburg Medium tactile geometry**:
   - Millimeter-accurate SVG export: 2.5 mm dot pitch, 0.75 mm dot radius, 10.0 mm line pitch, 15 mm margins.
3. **Speech-synced verification for sighted teachers**:
   - The Web Speech API reads the text aloud while the matching Braille cells light up, so a teacher who doesn't read Braille can check the sheet.
4. **Swell simulation mode (`Alt+V`)**:
   - Previews margins and raised-dot relief on screen before using a sheet of swell paper.
5. **50 mm calibration ruler**:
   - A printed 50 mm mark lets the teacher check true 1:1 scale with a desk ruler before heating the sheet.

---

## 4. Where It Stands Today

*What is built and measured right now (all of it can be checked in the code):*

- **Working open-source app**: TypeScript, 100% client-side, works offline once loaded. No server, no account, no license fee.
- **Tested**: **393 automated tests passing across 14 test suites** (normalizer, transliteration, SVG geometry, print/export, audio, quiz, accessibility).
- **Fast**: typing re-render measured at **3.6 ms** on a 500-character passage; initial load **under 500 ms**.
- **Exact print geometry**: SVG dots, pitch, line spacing and margins checked by tests against Marburg Medium values.
- **Classroom tools**: 10-question exam template, sighted proctor answer key, reverse quiz and dot inspector.

**What I have not done yet:** a classroom pilot with blind students. I'm not claiming reading-speed or time-saved results. Those numbers come from the pilot (slide 7).

---

## 5. Digital-to-Physical Workflow & Saving Paper

```
[1. Latin Text Input] ──> [2. Marburg SVG + 50 mm Ruler] ──> [3. Monochrome Print]
     (instant, offline)          (2.5 mm pitch, 0.75 mm dots)        (black ink on swell paper)
                                                                              │
                                                                              ▼
[6. Student Reads by Touch] <── [5. Raised Dots] <── [4. Heat Fuser (e.g. PIAF)]
                                  (capsules swell under heat)   (hardware a school may already have)
```

### Why calibration matters
- **Swell paper is costly and imported**: every ruined sheet is wasted money for a school.
- **Printer auto-scaling**: many printers default to "Fit to page" (e.g. 94%), which shrinks a 2.5 mm pitch to about 2.35 mm. After heating, the sheet can't be fixed.
- **Check before heating**: the 50 mm ruler and on-screen swell simulation (`Alt+V`) let a teacher catch scale and margin errors first.

---

## 6. Inclusive Exam Proctoring & Two-Way Learning

<div class="grid-2">
<div>

### Sighted Proctor Answer Key (`Alt+K`)
- Proctors who don't read Braille still need to check answer sheets.
- Cross-references all 10 questions of the exam template: Latin prompt, correct option, Braille cells (`⠠⠃⠐`), line and cell position, and dot breakdown.
- One-click download of a printable offline HTML answer key.

</div>
<div>

### Reverse Quiz & Dot Inspector (`Alt+Q`)
- **Reverse flashcards**: teach sighted teachers to recognize 6-dot patterns for Uzbek letters, modified letters (`o‘`, `g‘`) and digraphs (`sh`, `ch`).
- **Dot inspector**: toggle any of the 6 dots (keys 1–6 or mouse) and see the Latin letter, Braille symbol and pronunciation in real time.

</div>
</div>

---

## 7. Roadmap (Goals, Not Results)

```
[Now: Working App]   ──>   [Next: Tashkent Pilot]   ──>   [Then: More Schools]   ──>   [Later: Exams & Sister Alphabets]
Open source, tested        One specialized school         Other regions                 Exam packets, Karakalpak/Kazakh
```

- **Now (done)**: working open-source app, 393 passing tests, exact Marburg geometry, exam template and proctor key.
- **Next step (planned)**: pilot with a specialized school for visually impaired students in Tashkent. Teachers make real worksheets; blind students read the printed sheets and tell me what's wrong. I'll measure how readable the sheets are and how long a teacher needs to prepare one.
- **Then (goal)**: fix what the pilot finds, publish free tactile practice packets, and offer the tool to specialized schools in other regions of Uzbekistan.
- **Later (goal)**: ask education authorities and Braille specialists to review the mapping; build tactile packets in the state exam format; add Karakalpak and Kazakh Latin.

---

## 8. Technical Specifications & Measured Benchmarks

| Metric / Specification | Marburg Medium / Target | AlifBraille | How it's checked |
| :--- | :--- | :--- | :--- |
| **Dot center pitch** | 2.50 mm | **2.50 mm** | SVG geometry tests |
| **Dot radius** | 0.75 mm (1.50 mm diam.) | **0.75 mm** | SVG geometry tests |
| **Line pitch** | 10.00 mm | **10.00 mm** | SVG geometry tests |
| **Page margins** | 15.00 mm | **15.00 mm** | Print CSS + SVG tests |
| **Printer scaling guard** | Physical calibration mark | **50 mm ruler** | Included on every sheet |
| **Typing re-render** | &lt; 50 ms (feels instant) | **3.6 ms (500 chars)** | Browser benchmark |
| **Initial load** | Fast on old school PCs | **&lt; 500 ms** | Browser benchmark |
| **Contrast** | WCAG AAA (&ge; 7:1) | **Up to 18:1** | Automated contrast check |
| **Automated tests** | All passing | **393 tests, 14 suites** | `npm test` |

---

## 9. Why SXSW EDU

### What I Want to Learn in Austin
1. **Alphabet changes can leave disabled students behind**: Uzbekistan is not the only country changing scripts. AlifBraille is an open blueprint for keeping Braille readers included.
2. **Free and open**: MIT-licensed, no subscription, runs in the browser on old school computers, even offline.
3. **Live demo**: the app works today. I can show live transliteration, the speech-synced check, the 50 mm ruler and the dot inspector on stage, and get feedback from accessibility experts before the pilot.

<div style="margin-top: 15px; padding: 12px 20px; background: rgba(30, 41, 59, 0.7); border-radius: 8px;">
<strong>Solo student creator:</strong> Elshod Kenjayev • Grade 11, Presidential School in Tashkent, Uzbekistan<br>
<strong>Languages:</strong> Uzbek, English, Russian • <strong>Live app:</strong> braille.elshod.xyz • <strong>Code:</strong> github.com/Elshod09K/alifbraille
</div>
