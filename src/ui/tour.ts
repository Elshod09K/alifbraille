/**
 * 3-Step 'First Swell Print' Onboarding Tour for Sighted Teachers.
 * Explains how to calibrate printer scaling (100%), inspect the 50mm physical ruler notch,
 * and pass microcapsule swell paper through a thermal fuser (PIAF / Zychem).
 */

export interface SwellTourInstance {
  open(): void;
  close(): void;
  setLang(lang: 'uz' | 'en'): void;
  destroy(): void;
}

export function initSwellTourModal(root: HTMLElement): SwellTourInstance {
  let currentLang: 'uz' | 'en' = 'uz';
  let currentStep = 1; // 1, 2, or 3
  const totalSteps = 3;

  const TEXTS = {
    uz: {
      modalTitle: '🧭 Birinchi Taktil Chop Etish Qo‘llanmasi (3 Bosqich)',
      badge: 'O‘qituvchilar uchun qo‘llanma',
      closeBtn: 'Yopish',
      prevBtn: 'Ortga',
      nextBtn: 'Keyingisi',
      finishBtn: 'Tushunarli, Yakunlash',
      stepIndicator: (step: number, total: number) => `${total} tadan ${step}-bosqich`,
      steps: [
        {
          num: 1,
          tag: '1-QADAM: Matn va Marburg Standarti',
          title: 'Lotin Matnini Kiritish va Brayl Katakchalari',
          description:
            'Tahrirlash maydoniga darslik yoki imtihon matnini kiriting, yoki yuqoridagi namuna testlardan birini tanlang. AlifBraille 5 millisekunddan kam vaqtda universal Marburg standarti (2.5mm nuqta masofasi, 0.75mm radius) bo‘yicha 6 nuqtali katakchalarga o‘giradi.',
          tipTitle: 'Muhim qoida:',
          tip: 'O‘zbek tilining o‘, g‘, sh, ch harflari va raqamlar (#) avtomatik tarzda to‘g‘ri Brayl belgilariga aylantiriladi.',
          visualSvg: `
            <svg viewBox="0 0 400 90" class="tour-step-svg" aria-hidden="true">
              <rect x="10" y="10" width="170" height="70" rx="6" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
              <text x="25" y="42" fill="#93c5fd" font-size="14" font-weight="bold">O‘zbek Lotin Matni</text>
              <text x="25" y="62" fill="#cbd5e1" font-size="11">o‘, g‘, sh, ch, raqamlar</text>
              <path d="M 190 45 L 215 45" stroke="#10b981" stroke-width="3" marker-end="url(#arrow)"/>
              <rect x="225" y="10" width="165" height="70" rx="6" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
              <text x="240" y="42" fill="#34d399" font-size="14" font-weight="bold">Marburg Brayl (2.5mm)</text>
              <text x="240" y="62" fill="#cbd5e1" font-size="11">Qavariq nuqtalar matritsasi</text>
            </svg>
          `,
        },
        {
          num: 2,
          tag: '2-QADAM: Printer Masshtabi & 50mm Shkala',
          title: '50mm Fizik Kalibrlash Shkalsini Tekshirish & Resurs Tejamkorligi',
          description:
            'Chop etish (Print) yoki SVG yuklab olish tugmasini bosing. Eng muhim qoida: Brauzer chop etish oynasida Masshtabni (Scale) qat’iy ravishda "100%" (Asl o‘lcham) qilib belgilang! Hech qachon "Sahifaga moslash" (Fit to page) tanlamang, chunki bu nuqtalar orasini 94% gacha kichraytirib yuboradi.',
          tipTitle: 'Tejamkorlik va ekologik barqarorlik:',
          tip: 'Mikrokapsulali taktil qog‘oz qimmatbaho (har bir varaq $1.50–$2.20) va Markaziy Osiyoga chetdan keltiriladi. 50mm belgisini oddiy chizg‘ich bilan tekshirish va Simulyatsiya rejimidan (Alt+V) foydalanish qog‘oz uvol bo‘lishining oldini oladi va maktab byudjetini tejaydi!',
          visualSvg: `
            <svg viewBox="0 0 400 90" class="tour-step-svg" aria-hidden="true">
              <rect x="10" y="15" width="220" height="60" rx="4" fill="#0f172a" stroke="#cbd5e1" stroke-width="1"/>
              <line x1="25" y1="55" x2="215" y2="55" stroke="#f59e0b" stroke-width="3"/>
              <line x1="25" y1="45" x2="25" y2="55" stroke="#f59e0b" stroke-width="3"/>
              <line x1="120" y1="48" x2="120" y2="55" stroke="#f59e0b" stroke-width="2"/>
              <line x1="215" y1="45" x2="215" y2="55" stroke="#f59e0b" stroke-width="3"/>
              <text x="75" y="40" fill="#f59e0b" font-size="12" font-weight="bold">50 mm Chizg‘ich Shkalasi</text>
              <text x="35" y="68" fill="#94a3b8" font-size="10">100% masshtab • 0% qog‘oz isrofi</text>
              <rect x="250" y="15" width="140" height="60" rx="6" fill="#064e3b" stroke="#10b981" stroke-width="2"/>
              <text x="265" y="40" fill="#6ee7b7" font-size="12" font-weight="bold">✓ 1:1 Kalibrlangan</text>
              <text x="265" y="58" fill="#a7f3d0" font-size="10">Tejamkor va aniq</text>
            </svg>
          `,
        },
        {
          num: 3,
          tag: '3-QADAM: Termik Fuzer (PIAF / Zychem)',
          title: 'Termo-Qog‘ozni Qizdirish va O‘quvchiga Berish',
          description:
            'Chop etilgan mikrokapsulali taktil qog‘ozni (Zychem yoki PIAF Swell paper) termik fuzer qurilmasiga kiriting. Harorat regulyatorini 3–4 darajaga qo‘ying. Qora uglerodli siyoh infraqizil nurni yutib, mikrokapsulalarni ~0.5mm balandlikda qabartiradi.',
          tipTitle: 'Yakuniy natija:',
          tip: 'Fuzerdan chiqqan iliq qog‘ozdagi bo‘rtma nuqtalarni barmoq bilan paypaslab tekshiring va ko‘zi ojiz o‘quvchingizga taqdim eting!',
          visualSvg: `
            <svg viewBox="0 0 400 90" class="tour-step-svg" aria-hidden="true">
              <rect x="15" y="20" width="130" height="50" rx="6" fill="#1e293b" stroke="#dc2626" stroke-width="2"/>
              <text x="30" y="45" fill="#f87171" font-size="12" font-weight="bold">PIAF Fuzer (125°C)</text>
              <text x="30" y="60" fill="#fca5a5" font-size="10">Infraqizil issiqlik</text>
              <path d="M 155 45 L 180 45" stroke="#f59e0b" stroke-width="3"/>
              <rect x="190" y="15" width="195" height="60" rx="6" fill="#1e1b4b" stroke="#818cf8" stroke-width="2"/>
              <circle cx="230" cy="45" r="9" fill="#000000" stroke="#818cf8" stroke-width="2"/>
              <circle cx="260" cy="45" r="9" fill="#000000" stroke="#818cf8" stroke-width="2"/>
              <text x="280" y="40" fill="#c7d2fe" font-size="12" font-weight="bold">~0.5mm Bo‘rtma</text>
              <text x="280" y="58" fill="#a5b4fc" font-size="10">Barmoq bilan o‘qish</text>
            </svg>
          `,
        },
      ],
    },
    en: {
      modalTitle: '🧭 First Swell Print Teacher Guide (3 Steps)',
      badge: 'Teacher Onboarding & Hardware Guide',
      closeBtn: 'Close',
      prevBtn: 'Back',
      nextBtn: 'Next',
      finishBtn: 'Got it, Finish Guide',
      stepIndicator: (step: number, total: number) => `Step ${step} of ${total}`,
      steps: [
        {
          num: 1,
          tag: 'STEP 1: Latin Input & Marburg Standard',
          title: 'Enter Latin Text & Inspect Tactile Cells',
          description:
            'Type or paste your curriculum test passage or select a standardized entrance exam preset. AlifBraille transliterates Uzbek Latin deterministically in under 5ms into calibrated 6-dot cells adhering strictly to the universal Marburg standard (2.5mm dot pitch, 0.75mm dot radius).',
          tipTitle: 'Key Rule:',
          tip: 'Uzbek modified letters (o‘, g‘), digraphs (sh, ch), and numerals (#) are automatically transcribed with correct Braille codes.',
          visualSvg: `
            <svg viewBox="0 0 400 90" class="tour-step-svg" aria-hidden="true">
              <rect x="10" y="10" width="170" height="70" rx="6" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
              <text x="25" y="42" fill="#93c5fd" font-size="14" font-weight="bold">Uzbek Latin Input</text>
              <text x="25" y="62" fill="#cbd5e1" font-size="11">o‘, g‘, sh, ch, numerals</text>
              <path d="M 190 45 L 215 45" stroke="#10b981" stroke-width="3"/>
              <rect x="225" y="10" width="165" height="70" rx="6" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
              <text x="240" y="42" fill="#34d399" font-size="14" font-weight="bold">Marburg Braille (2.5mm)</text>
              <text x="240" y="62" fill="#cbd5e1" font-size="11">Tactile cell matrix</text>
            </svg>
          `,
        },
        {
          num: 2,
          tag: 'STEP 2: Printer Scaling & 50mm Calibration Ruler',
          title: 'Verify 1:1 Scale Against 50mm Ruler Notch & Waste Reduction',
          description:
            'Click Print Swell Sheet or Download Tactile SVG. CRUCIAL RULE: In your browser print dialog, always set Page Scale to "100%" (Actual Size). Never choose "Fit to Printable Area", which reduces scale to 94% and causes dots to merge under heat.',
          tipTitle: 'Resource Efficiency & Sustainability:',
          tip: 'Microcapsule swell sheets are expensive ($1.50–$2.20/sheet) and energy-intensive to import into Central Asia. Pre-verifying the 50mm ruler notch with a desk ruler and checking in Swell Simulation mode (Alt+V) prevents ruined sheets, printer waste, and unnecessary thermal heating cycles.',
          visualSvg: `
            <svg viewBox="0 0 400 90" class="tour-step-svg" aria-hidden="true">
              <rect x="10" y="15" width="220" height="60" rx="4" fill="#0f172a" stroke="#cbd5e1" stroke-width="1"/>
              <line x1="25" y1="55" x2="215" y2="55" stroke="#f59e0b" stroke-width="3"/>
              <line x1="25" y1="45" x2="25" y2="55" stroke="#f59e0b" stroke-width="3"/>
              <line x1="120" y1="48" x2="120" y2="55" stroke="#f59e0b" stroke-width="2"/>
              <line x1="215" y1="45" x2="215" y2="55" stroke="#f59e0b" stroke-width="3"/>
              <text x="75" y="40" fill="#f59e0b" font-size="12" font-weight="bold">50mm Calibration Scale</text>
              <text x="35" y="68" fill="#94a3b8" font-size="10">100% scale • Zero ruined swell sheets</text>
              <rect x="250" y="15" width="140" height="60" rx="6" fill="#064e3b" stroke="#10b981" stroke-width="2"/>
              <text x="265" y="40" fill="#6ee7b7" font-size="12" font-weight="bold">✓ 1:1 Calibrated</text>
              <text x="265" y="58" fill="#a7f3d0" font-size="10">Eco-efficient & precise</text>
            </svg>
          `,
        },
        {
          num: 3,
          tag: 'STEP 3: Thermal Microcapsule Fuser (PIAF / Zychem)',
          title: 'Expand Microcapsules & Hand to Student',
          description:
            'Feed your printed swell sheet into a thermal fuser (PIAF or Zychem) set to heat level 3 to 4 (120–130°C). Pure black carbon ink absorbs infrared energy, causing microcapsules in the paper to expand into ~0.5mm raised tactile relief.',
          tipTitle: 'Ready for Touch Reading:',
          tip: 'Touch the warm sheet to feel the crisp raised dots, and immediately hand it to your visually impaired student for tactile reading!',
          visualSvg: `
            <svg viewBox="0 0 400 90" class="tour-step-svg" aria-hidden="true">
              <rect x="15" y="20" width="130" height="50" rx="6" fill="#1e293b" stroke="#dc2626" stroke-width="2"/>
              <text x="30" y="45" fill="#f87171" font-size="12" font-weight="bold">PIAF Fuser (125°C)</text>
              <text x="30" y="60" fill="#fca5a5" font-size="10">Infrared heat pass</text>
              <path d="M 155 45 L 180 45" stroke="#f59e0b" stroke-width="3"/>
              <rect x="190" y="15" width="195" height="60" rx="6" fill="#1e1b4b" stroke="#818cf8" stroke-width="2"/>
              <circle cx="230" cy="45" r="9" fill="#000000" stroke="#818cf8" stroke-width="2"/>
              <circle cx="260" cy="45" r="9" fill="#000000" stroke="#818cf8" stroke-width="2"/>
              <text x="280" y="40" fill="#c7d2fe" font-size="12" font-weight="bold">~0.5mm 3D Relief</text>
              <text x="280" y="58" fill="#a5b4fc" font-size="10">Tactile touch reading</text>
            </svg>
          `,
        },
      ],
    },
  };

  let modalEl = root.querySelector<HTMLDialogElement>('#swell-tour-modal');
  if (!modalEl) {
    modalEl = document.createElement('dialog');
    modalEl.id = 'swell-tour-modal';
    modalEl.className = 'impact-modal tour-modal';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('aria-labelledby', 'tour-modal-title');
    root.appendChild(modalEl);
  }

  function renderContent(): void {
    if (!modalEl) return;
    const s = TEXTS[currentLang];
    const step = s.steps[currentStep - 1];

    modalEl.innerHTML = `
      <div class="modal-dialog-content tour-dialog-content">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <h2 id="tour-modal-title" class="modal-title">${s.modalTitle}</h2>
            <span class="modal-badge">${s.badge}</span>
          </div>
          <button id="tour-modal-close-btn" class="modal-close-btn" type="button" aria-label="${s.closeBtn}">✕</button>
        </div>

        <div class="modal-body tour-modal-body">
          <!-- Step indicators -->
          <div class="tour-stepper" role="navigation" aria-label="Tour steps">
            <div class="tour-stepper-progress">
              <span class="tour-step-pill ${currentStep === 1 ? 'active' : currentStep > 1 ? 'done' : ''}">1. Marburg</span>
              <span class="tour-step-divider">→</span>
              <span class="tour-step-pill ${currentStep === 2 ? 'active' : currentStep > 2 ? 'done' : ''}">2. 50mm Shkala</span>
              <span class="tour-step-divider">→</span>
              <span class="tour-step-pill ${currentStep === 3 ? 'active' : ''}">3. Termik Fuzer</span>
            </div>
            <span class="tour-step-counter" aria-live="polite">${s.stepIndicator(currentStep, totalSteps)}</span>
          </div>

          <article class="tour-card">
            <div class="tour-card-header">
              <span class="tour-tag">${step.tag}</span>
              <h3 class="tour-step-title">${step.title}</h3>
            </div>

            <p class="tour-desc">${step.description}</p>

            <div class="tour-visual-box">
              ${step.visualSvg}
            </div>

            <div class="tour-tip-box">
              <strong>💡 ${step.tipTitle}</strong>
              <span>${step.tip}</span>
            </div>
          </article>
        </div>

        <div class="modal-footer tour-modal-footer">
          <button id="tour-prev-btn" class="toggle-button" type="button" ${currentStep === 1 ? 'disabled' : ''}>
            ${s.prevBtn}
          </button>
          <div class="tour-footer-right">
            <button id="tour-skip-btn" class="toggle-button" type="button">
              ${s.closeBtn}
            </button>
            <button id="tour-next-btn" class="toggle-button active" type="button">
              ${currentStep === totalSteps ? s.finishBtn : s.nextBtn}
            </button>
          </div>
        </div>
      </div>
    `;

    // Bind controls
    const closeBtn = modalEl.querySelector<HTMLButtonElement>('#tour-modal-close-btn');
    const skipBtn = modalEl.querySelector<HTMLButtonElement>('#tour-skip-btn');
    const prevBtn = modalEl.querySelector<HTMLButtonElement>('#tour-prev-btn');
    const nextBtn = modalEl.querySelector<HTMLButtonElement>('#tour-next-btn');

    closeBtn?.addEventListener('click', closeTour);
    skipBtn?.addEventListener('click', closeTour);

    prevBtn?.addEventListener('click', () => {
      if (currentStep > 1) {
        currentStep--;
        renderContent();
      }
    });

    nextBtn?.addEventListener('click', () => {
      if (currentStep < totalSteps) {
        currentStep++;
        renderContent();
      } else {
        closeTour();
      }
    });
  }

  function trapFocus(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeTour();
      return;
    }

    if (e.key === 'ArrowRight' && currentStep < totalSteps) {
      e.preventDefault();
      currentStep++;
      renderContent();
      return;
    }

    if (e.key === 'ArrowLeft' && currentStep > 1) {
      e.preventDefault();
      currentStep--;
      renderContent();
      return;
    }

    if (e.key === 'Tab') {
      const focusables = Array.from(
        modalEl!.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0);

      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !modalEl!.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !modalEl!.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }

  modalEl.addEventListener('keydown', trapFocus);

  function openTour(): void {
    if (!modalEl) return;
    currentStep = 1;
    renderContent();
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
      document.documentElement.classList.add('modal-open');
    }
    if (typeof modalEl.showModal === 'function') {
      try {
        modalEl.showModal();
      } catch {
        modalEl.setAttribute('open', 'true');
      }
    } else {
      modalEl.setAttribute('open', 'true');
    }
    modalEl.setAttribute('open', 'true');
    modalEl.classList.add('is-open');
    const nextBtn = modalEl.querySelector<HTMLButtonElement>('#tour-next-btn');
    nextBtn?.focus();
  }

  function closeTour(): void {
    if (!modalEl) return;
    if (typeof document !== 'undefined') {
      const aboutModal = document.querySelector<HTMLDialogElement>('#about-creator-modal');
      const quizModal = document.querySelector<HTMLDialogElement>('#braille-quiz-modal');
      const isOtherOpen =
        (aboutModal && (aboutModal.hasAttribute('open') || (aboutModal as any).open)) ||
        (quizModal && (quizModal.hasAttribute('open') || (quizModal as any).open));
      if (!isOtherOpen) {
        document.body.classList.remove('modal-open');
        document.documentElement.classList.remove('modal-open');
      }
    }
    if (typeof modalEl.close === 'function') {
      try {
        modalEl.close();
      } catch {
        modalEl.removeAttribute('open');
      }
    } else {
      modalEl.removeAttribute('open');
    }
    modalEl.removeAttribute('open');
    modalEl.classList.remove('is-open');
  }

  return {
    open: openTour,
    close: closeTour,
    setLang: (lang: 'uz' | 'en') => {
      currentLang = lang;
      if (modalEl?.hasAttribute('open') || modalEl?.classList.contains('is-open')) {
        renderContent();
      }
    },
    destroy: () => {
      modalEl?.remove();
    },
  };
}
