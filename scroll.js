document.addEventListener("DOMContentLoaded", function () {
  function initSmoothScroll(options = {}) {
    const SmoothConfig = {
      DEBUG: true,
      MOBILE_BREAKPOINT: 768,
      ease: 0.12,
      scrollMult: 1,
      stopThreshold: 0.1,
      minPageHeightRatio: 1.05,
      ...options
    };

    let smoothEnabled = false;
    let current = 0;
    let target = 0;
    let rafId = null;
    let prevScrollBehavior = null;

    // flag pour gestion iframe
    let isHoveringIframe = false;
    let smoothWasEnabledBeforeHover = false;

    const clamp = (v, min, max) => Math.max(min, Math.min(v, max));
    const log = (...args) => { if (SmoothConfig.DEBUG) console.log('[smooth]', ...args); };

    function disableCssSmooth() {
      prevScrollBehavior = document.documentElement.style.scrollBehavior || '';
      document.documentElement.style.scrollBehavior = 'auto';
      log('CSS scroll-behavior forcé à auto');
    }

    function restoreCssSmooth() {
      document.documentElement.style.scrollBehavior = prevScrollBehavior;
      log('CSS scroll-behavior restauré');
    }

    function enableSmooth() {
      if (smoothEnabled) return;
      smoothEnabled = true;
      current = window.scrollY;
      target = window.scrollY;
      disableCssSmooth();
      window.addEventListener('wheel', onWheel, { passive: false });
      window.addEventListener('scroll', onNativeScroll, { passive: true });
      log('Smooth enabled');
    }

    function disableSmooth() {
      if (!smoothEnabled) {
        // même si smoothEnabled false on veut quand même s'assurer
        // que les écouteurs ont bien été retirés (sécurité)
        window.removeEventListener('wheel', onWheel);
        window.removeEventListener('scroll', onNativeScroll);
      } else {
        smoothEnabled = false;
        window.removeEventListener('wheel', onWheel);
        window.removeEventListener('scroll', onNativeScroll);
      }
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      restoreCssSmooth();
      log('Smooth disabled');
    }

    function onWheel(e) {
      if (e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 16;
      else if (e.deltaMode === 2) delta *= window.innerHeight;

      const maxScroll = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      ) - window.innerHeight;

      target = clamp(target + delta * SmoothConfig.scrollMult, 0, maxScroll);
      if (!rafId) render();
    }

    function onNativeScroll() {
      if (!rafId) target = current = window.scrollY;
    }

    function render() {
      if (!smoothEnabled) return;
      const diff = target - current;
      if (Math.abs(diff) < SmoothConfig.stopThreshold) {
        current = target;
        rafId = null;
        return;
      }
      current += diff * SmoothConfig.ease;
      try {
        window.scrollTo({ top: Math.round(current), left: 0, behavior: 'auto' });
      } catch {
        window.scrollTo(0, Math.round(current));
      }
      rafId = requestAnimationFrame(render);
    }

    function checkDevice() {
      const pageHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      if (pageHeight <= window.innerHeight * SmoothConfig.minPageHeightRatio) return disableSmooth();
      if (window.innerWidth < SmoothConfig.MOBILE_BREAKPOINT) return disableSmooth();
      // si on est en train de survoler un iframe, ne (re)activer que si
      // le smooth n'a pas été désactivé par le hover
      if (!isHoveringIframe) enableSmooth();
    }

    window.addEventListener('resize', () => {
      clearTimeout(window.__smooth_resize_timer);
      window.__smooth_resize_timer = setTimeout(checkDevice, 120);
    });

    // --- GESTION DES IFRAMES ---
    function onIframeEnter() {
      // mémorise si le smooth était actif
      smoothWasEnabledBeforeHover = !!smoothEnabled;
      isHoveringIframe = true;
      // désactive le smooth pour laisser le scroll natif fonctionner quand la souris est sur l'iframe
      disableSmooth();
      log('Hover iframe : smooth temporairement désactivé');
    }

    function onIframeLeave() {
      isHoveringIframe = false;
      log('Sortie iframe');
      // si avant le hover le smooth était activé, on le réactive (sauf si device/checkDevice interdit)
      if (smoothWasEnabledBeforeHover) {
        // vérifie à nouveau les conditions (taille écran / hauteur page)
        checkDevice();
      } else {
        // garantit que le smooth reste désactivé
        disableSmooth();
      }
    }

    function attachIframeHandlers(root = document) {
      const frames = root.querySelectorAll ? root.querySelectorAll('iframe') : [];
      frames.forEach(frame => {
        // évite d'attacher plusieurs fois sur le même iframe
        if (frame.__smoothMouseHandlersAttached) return;
        frame.addEventListener('pointerenter', onIframeEnter, { passive: true });
        frame.addEventListener('pointerleave', onIframeLeave, { passive: true });
        // Au cas où l'iframe reçoit le focus via tab / click clavier
        frame.addEventListener('focus', onIframeEnter, { passive: true });
        frame.addEventListener('blur', onIframeLeave, { passive: true });
        frame.__smoothMouseHandlersAttached = true;
      });
    }

    // Attach initial handlers
    attachIframeHandlers();

    // Observe DOM pour les iframes ajoutés dynamiquement
    const mo = new MutationObserver(mutations => {
      mutations.forEach(m => {
        if (m.addedNodes && m.addedNodes.length) {
          m.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // ELEMENT_NODE
              if (node.tagName && node.tagName.toLowerCase() === 'iframe') {
                attachIframeHandlers(document); // attache les handlers nouvellement ajoutés
              } else if (node.querySelectorAll && node.querySelectorAll('iframe').length) {
                attachIframeHandlers(node);
              }
            }
          });
        }
      });
    });
    mo.observe(document.documentElement || document.body, { childList: true, subtree: true });

    // --- Fin gestion iframe ---

    // Boot
    checkDevice();

    if (SmoothConfig.DEBUG) {
      window.__Smooth = {
        enable: enableSmooth,
        disable: disableSmooth,
        config: SmoothConfig,
        status: () => ({ smoothEnabled, current, target, isHoveringIframe, smoothWasEnabledBeforeHover })
      };
      log('API debug disponible via window.__Smooth');
    }
  }

  initSmoothScroll();
});
