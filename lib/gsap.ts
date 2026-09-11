import gsap from "gsap";

/**
 * Checks if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Hero Section reveal animation
 * Crisp, instantaneous stagger without artificial lingering delays.
 */
export const animateHeroReveal = (containerSelector: string) => {
  if (typeof window === "undefined") return;
  if (prefersReducedMotion()) return;

  const ctx = gsap.context(() => {
    gsap.fromTo(
      ".hero-content > *",
      { y: 14, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.45,
        stagger: 0.05,
        ease: "power2.out",
        clearProps: "all",
      }
    );

    gsap.fromTo(
      ".hero-visual",
      { scale: 0.97, opacity: 0, y: 10 },
      {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.5,
        delay: 0.08,
        ease: "power2.out",
        clearProps: "all",
      }
    );
  }, containerSelector);

  return () => ctx.revert();
};

/**
 * Result Card entrance animation with Raycast/Linear physical handoff
 */
export const animateResultCard = (cardSelector: string) => {
  if (typeof window === "undefined") return;
  if (prefersReducedMotion()) return;

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  tl.fromTo(
    cardSelector,
    { scale: 0.97, opacity: 0, y: 12 },
    {
      scale: 1,
      opacity: 1,
      y: 0,
      duration: 0.38,
      clearProps: "transform,opacity",
    }
  ).fromTo(
    `${cardSelector} .status-badge-pop`,
    { scale: 0.92, opacity: 0 },
    {
      scale: 1,
      opacity: 1,
      duration: 0.3,
      ease: "power2.out",
      clearProps: "transform,opacity",
    },
    "-=0.15"
  );
};

/**
 * Animate active verification pipeline step card advance & checkmark reveal
 */
export const animatePipelineStep = (cardElement: HTMLElement | null, isCompleted: boolean) => {
  if (!cardElement || typeof window === "undefined") return;
  if (prefersReducedMotion()) return;

  if (isCompleted) {
    const icon = cardElement.querySelector(".step-check-icon");
    if (icon) {
      gsap.fromTo(
        icon,
        { scale: 0.6, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.25, ease: "power2.out", clearProps: "transform,opacity" }
      );
    }
  } else {
    gsap.fromTo(
      cardElement,
      { scale: 0.98 },
      { scale: 1.02, duration: 0.25, ease: "power2.out" }
    );
  }
};

/**
 * Animate FAQ Accordion expand / collapse smoothly
 */
export const animateFaqAccordion = (
  contentElement: HTMLElement | null,
  isOpening: boolean,
  onComplete?: () => void
) => {
  if (!contentElement || typeof window === "undefined") return;

  if (prefersReducedMotion()) {
    if (onComplete) onComplete();
    return;
  }

  if (isOpening) {
    gsap.fromTo(
      contentElement,
      { height: 0, opacity: 0 },
      {
        height: "auto",
        opacity: 1,
        duration: 0.28,
        ease: "power2.out",
        onComplete,
      }
    );
  } else {
    gsap.to(contentElement, {
      height: 0,
      opacity: 0,
      duration: 0.22,
      ease: "power2.out",
      onComplete,
    });
  }
};

/**
 * Animated numeric counter and bar gauge for confidence score
 */
export const animateConfidenceGauge = (
  meterSelector: string,
  targetScore: number,
  onUpdateScore?: (val: number) => void
) => {
  if (typeof window === "undefined") return;

  if (prefersReducedMotion()) {
    if (onUpdateScore) onUpdateScore(targetScore);
    const el = document.querySelector(meterSelector) as HTMLElement;
    if (el) el.style.width = `${targetScore}%`;
    return;
  }

  const scoreObj = { val: 0 };

  gsap.to(scoreObj, {
    val: targetScore,
    duration: 0.7,
    ease: "power2.out",
    onUpdate: () => {
      if (onUpdateScore) {
        onUpdateScore(Math.round(scoreObj.val));
      }
    },
  });

  gsap.fromTo(
    meterSelector,
    { width: "0%" },
    { width: `${targetScore}%`, duration: 0.7, ease: "power2.out" }
  );
};

/**
 * Animate loading progress bar width smoothly with power2.out
 */
export const animateLoadingProgress = (
  barSelector: string,
  targetPercent: number,
  onComplete?: () => void
) => {
  if (typeof window === "undefined") return;

  if (prefersReducedMotion()) {
    const el = document.querySelector(barSelector) as HTMLElement;
    if (el) el.style.width = `${targetPercent}%`;
    if (onComplete) onComplete();
    return;
  }

  gsap.to(barSelector, {
    width: `${targetPercent}%`,
    duration: 0.4,
    ease: "power2.out",
    onComplete,
  });
};

/**
 * Smooth transition for loader card exit handoff into Result Card
 */
export const animateLoadingExit = (
  containerSelector: string,
  onComplete?: () => void
) => {
  if (typeof window === "undefined") return;

  if (prefersReducedMotion()) {
    if (onComplete) onComplete();
    return;
  }

  gsap.to(containerSelector, {
    opacity: 0,
    y: -8,
    scale: 0.98,
    duration: 0.25,
    ease: "power2.out",
    onComplete,
  });
};

/**
 * Chip Press physical micro-feedback (scale 1 -> 0.96 -> 1, 150ms, power2.out)
 */
export const animateChipPress = (target: HTMLElement | string) => {
  if (typeof window === "undefined") return;
  if (prefersReducedMotion()) return;

  gsap.timeline()
    .to(target, { scale: 0.96, duration: 0.07, ease: "power2.out" })
    .to(target, { scale: 1, duration: 0.08, ease: "power2.out", clearProps: "transform" });
};

/**
 * Textarea content injection highlight (brief warm accent highlight fade)
 */
export const animateTextareaInjection = (textareaSelector: string) => {
  if (typeof window === "undefined") return;
  if (prefersReducedMotion()) return;

  gsap.timeline()
    .fromTo(
      textareaSelector,
      { borderColor: "#FFD12F", backgroundColor: "rgba(255, 209, 47, 0.07)" },
      {
        borderColor: "#27272A",
        backgroundColor: "#0D0D0D",
        duration: 0.45,
        ease: "power2.out",
        clearProps: "backgroundColor",
      }
    );
};

/**
 * Pulse Submit CTA once with subtle #FFD12F glow to indicate ready action
 */
export const animateSubmitCtaPulse = (buttonSelector: string) => {
  if (typeof window === "undefined") return;
  if (prefersReducedMotion()) return;

  gsap.timeline()
    .fromTo(
      buttonSelector,
      { scale: 1, boxShadow: "0 0 0 0 rgba(255, 209, 47, 0)" },
      {
        scale: 1.03,
        boxShadow: "0 0 16px 2px rgba(255, 209, 47, 0.45)",
        duration: 0.18,
        ease: "power2.out",
      }
    )
    .to(buttonSelector, {
      scale: 1,
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      duration: 0.22,
      ease: "power2.out",
      clearProps: "scale,boxShadow",
    });
};

/**
 * Subtle section arrival animation (opacity 0.88 -> 1, y 8 -> 0, 0.35s power2.out)
 * Linear / Perplexity style subtle visual cue
 */
export const animateSectionArrival = (sectionElement: HTMLElement) => {
  if (!sectionElement || typeof window === "undefined") return;
  if (prefersReducedMotion()) return;

  gsap.fromTo(
    sectionElement,
    { opacity: 0.88, y: 8 },
    {
      opacity: 1,
      y: 0,
      duration: 0.35,
      ease: "power2.out",
      clearProps: "all",
    }
  );
};

/**
 * Smoothly scroll to target section element or selector with GSAP
 * - Distance-responsive duration (0.5s - 0.8s)
 * - Power2.out curve
 * - Offset for sticky header
 * - Triggers destination subtle arrival animation
 */
export const smoothScrollToSection = (
  target: string | HTMLElement,
  options?: {
    offset?: number;
    onComplete?: () => void;
  }
) => {
  if (typeof window === "undefined") return;

  const targetEl =
    typeof target === "string" ? document.querySelector(target) : target;
  if (!targetEl) return;

  const headerOffset = options?.offset ?? 72; // height of sticky header (64px) + margin
  const elementPosition = targetEl.getBoundingClientRect().top;
  const targetY = Math.max(0, window.scrollY + elementPosition - headerOffset);
  const startY = window.scrollY;
  const distance = Math.abs(targetY - startY);

  if (prefersReducedMotion()) {
    window.scrollTo({ top: targetY, behavior: "auto" });
    if (options?.onComplete) options.onComplete();
    return;
  }

  // Calculate dynamic duration between 0.5s and 0.8s based on distance
  const duration = Math.min(0.8, Math.max(0.48, (distance / 2000) * 0.8));

  const scrollObj = { y: startY };
  gsap.to(scrollObj, {
    y: targetY,
    duration,
    ease: "power2.out",
    onUpdate: () => {
      window.scrollTo(0, scrollObj.y);
    },
    onComplete: () => {
      // Subtle section arrival highlight / fade-up
      animateSectionArrival(targetEl as HTMLElement);
      if (options?.onComplete) options.onComplete();
    },
  });
};


/**
 * Smoothly scroll and center target element in the viewport with GSAP power2.out
 * Perfect for mobile & desktop verification pipeline transition
 */
export const smoothCenterInViewport = (
  target: string | HTMLElement,
  options?: {
    duration?: number;
    offsetY?: number;
    onComplete?: () => void;
  }
) => {
  if (typeof window === "undefined") return;

  const targetEl = typeof target === "string" ? document.querySelector(target) : target;
  if (!targetEl) return;

  const rect = targetEl.getBoundingClientRect();
  const currentScrollY = window.scrollY;
  const viewportHeight = window.innerHeight;
  const elementHeight = rect.height;

  // Compute ideal scroll position to center element in viewport
  // For large cards taller than viewport, align near top with breathing space below sticky navbar
  const navbarHeight = 64;
  let targetScrollY: number;

  if (elementHeight + navbarHeight + 32 >= viewportHeight) {
    // Tall element: align to top just under the navbar with 20px breathing room
    targetScrollY = currentScrollY + rect.top - navbarHeight - 20;
  } else {
    // Shorter element: center vertically in the remaining space under the navbar
    const availableSpace = viewportHeight - navbarHeight;
    const centerOffset = (availableSpace - elementHeight) / 2;
    targetScrollY = currentScrollY + rect.top - navbarHeight - Math.max(16, centerOffset);
  }

  // Adjust with optional offset and clamp to 0
  if (options?.offsetY) {
    targetScrollY += options.offsetY;
  }
  targetScrollY = Math.max(0, targetScrollY);

  if (prefersReducedMotion()) {
    window.scrollTo({ top: targetScrollY, behavior: "auto" });
    if (options?.onComplete) options.onComplete();
    return;
  }

  const duration = options?.duration ?? 0.5; // 0.4s - 0.6s range
  const scrollObj = { y: currentScrollY };

  gsap.to(scrollObj, {
    y: targetScrollY,
    duration,
    ease: "power2.out",
    onUpdate: () => {
      window.scrollTo(0, scrollObj.y);
    },
    onComplete: () => {
      if (options?.onComplete) options.onComplete();
    },
  });
};

/**
 * Smooth auto scroll into view if element is below viewport
 */
export const smoothAutoScroll = (element: HTMLElement | null) => {
  if (!element || typeof window === "undefined") return;
  if (prefersReducedMotion()) {
    element.scrollIntoView({ behavior: "auto", block: "center" });
    return;
  }

  const rect = element.getBoundingClientRect();
  const isOutOfView = rect.top < 0 || rect.bottom > window.innerHeight;

  if (isOutOfView) {
    const targetY = window.scrollY + rect.top - (window.innerHeight / 2) + (rect.height / 2);
    const startY = window.scrollY;

    const scrollObj = { y: startY };
    gsap.to(scrollObj, {
      y: targetY,
      duration: 0.4,
      ease: "power2.out",
      onUpdate: () => {
        window.scrollTo(0, scrollObj.y);
      },
    });
  }
};



