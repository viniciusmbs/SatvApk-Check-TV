import { useEffect, useRef } from 'react';
import { soundService } from './soundService';

interface UseTvNavigationOptions {
  enabled?: boolean;
}

/**
 * Tabulation and Direct Contextual Navigation Hook engineered for Android TV,
 * Fire TV Stick, Smart TV WebViews, and physical remote controllers (D-Pad & Tab).
 *
 * Provides:
 * 1. O(1) instant cursor response without layout reflows (elimina 'agarrando' / lentidão).
 * 2. Persistent focus memory (volta exatamente no último canal acessado após clicar ou trocar de aba).
 * 3. 100% predictable D-Pad movement (não vira os cursores para direções aleatórias).
 */
export function useTvNavigation({ enabled = true }: UseTvNavigationOptions = {}) {
  const lastFocusedCardRef = useRef<HTMLElement | null>(null);

  // Helper to find the last accessed/focused channel card in the DOM
  const getSavedCard = (): HTMLElement | null => {
    try {
      const savedId =
        localStorage.getItem('satv_last_focused_channel_id') ||
        sessionStorage.getItem('satv_last_focused_channel_id');
      if (savedId) {
        const el =
          document.getElementById(`channel-card-${savedId}`) ||
          document.getElementById(`epg-card-${savedId}`);
        if (el && document.contains(el)) return el;
      }

      const savedName =
        localStorage.getItem('satv_last_focused_channel_name') ||
        sessionStorage.getItem('satv_last_focused_channel_name');
      if (savedName) {
        // Safe selector handling
        try {
          const el = document.querySelector<HTMLElement>(`[data-channel-name="${CSS.escape(savedName)}"]`);
          if (el && document.contains(el)) return el;
        } catch {
          const el = document.querySelector<HTMLElement>(`[data-channel-name="${savedName}"]`);
          if (el && document.contains(el)) return el;
        }
      }
    } catch {
      // ignore
    }

    if (lastFocusedCardRef.current && document.contains(lastFocusedCardRef.current)) {
      return lastFocusedCardRef.current;
    }

    return null;
  };

  const saveFocusedCard = (el: HTMLElement) => {
    lastFocusedCardRef.current = el;
    try {
      const name = el.getAttribute('data-channel-name');
      if (name) {
        localStorage.setItem('satv_last_focused_channel_name', name);
        sessionStorage.setItem('satv_last_focused_channel_name', name);
      }
      if (el.id) {
        const cleanId = el.id.replace('channel-card-', '').replace('epg-card-', '');
        localStorage.setItem('satv_last_focused_channel_id', cleanId);
        sessionStorage.setItem('satv_last_focused_channel_id', cleanId);
      }
      localStorage.setItem('satv_last_scroll_y', String(window.scrollY));
      sessionStorage.setItem('satv_last_scroll_y', String(window.scrollY));
    } catch {
      // ignore
    }
  };

  // Center and focus the target channel card, scrolling both page and horizontal carousel
  const focusAndScrollCard = (card: HTMLElement) => {
    try {
      card.focus({ preventScroll: true });
      card.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });

      // If the card is inside a horizontal carousel (ChannelRows), align horizontally
      const carousel = card.closest('.overflow-x-auto') as HTMLElement | null;
      if (carousel) {
        const cardRect = card.getBoundingClientRect();
        const carouselRect = carousel.getBoundingClientRect();
        const scrollOffset =
          cardRect.left - carouselRect.left - carouselRect.width / 2 + cardRect.width / 2;
        carousel.scrollBy({ left: scrollOffset, behavior: 'auto' });
      }

      lastFocusedCardRef.current = card;
      localStorage.removeItem('satv_should_restore_channel');
      sessionStorage.removeItem('satv_should_restore_channel');
    } catch {
      // ignore
    }
  };

  // Automatically restore focus and scroll to the last channel when returning to the app
  useEffect(() => {
    if (!enabled) return;

    const restoreFocus = (force = false) => {
      const runRestore = () => {
        const active = document.activeElement as HTMLElement | null;

        // If user is actively typing in an input field, do not steal focus
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
          return;
        }

        const shouldRestore =
          force ||
          localStorage.getItem('satv_should_restore_channel') === 'true' ||
          sessionStorage.getItem('satv_should_restore_channel') === 'true';

        // If the browser default-focused "Todos" or document.body upon returning from a channel
        const isDefaultTopOrBody =
          !active ||
          active === document.body ||
          active.getAttribute('data-tv-nav') === 'category' ||
          active.getAttribute('data-tv-nav') === 'tab';

        if (shouldRestore || isDefaultTopOrBody) {
          const card = getSavedCard();
          if (card) {
            focusAndScrollCard(card);
          }
        }
      };

      // Execute across animation frames to account for TV browser layout and carousel initialization
      runRestore();
      setTimeout(runRestore, 60);
      setTimeout(runRestore, 200);
      setTimeout(runRestore, 450);
    };

    // Restore on mount
    restoreFocus(true);

    const onWindowFocus = () => restoreFocus(true);
    const onPageShow = () => restoreFocus(true);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        restoreFocus(true);
      }
    };

    window.addEventListener('focus', onWindowFocus);
    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('focus', onWindowFocus);
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const handleTvKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const code = e.keyCode || e.which;

      const isUp = key === 'ArrowUp' || code === 38 || code === 19;
      const isDown = key === 'ArrowDown' || code === 40 || code === 20;
      const isLeft = key === 'ArrowLeft' || code === 37 || code === 21;
      const isRight = key === 'ArrowRight' || code === 39 || code === 22;
      const isTab = key === 'Tab' || code === 9;
      const isEnter =
        key === 'Enter' ||
        key === ' ' ||
        code === 13 ||
        code === 23 || // KEYCODE_DPAD_CENTER
        code === 66; // KEYCODE_ENTER

      if (!isUp && !isDown && !isLeft && !isRight && !isTab && !isEnter) {
        return;
      }

      // If a modal or dialog is open, let the modal handle its own navigation
      const isModalOpen = document.querySelector('[role="dialog"]') !== null;
      if (isModalOpen) {
        return;
      }

      const activeEl = document.activeElement as HTMLElement | null;

      // 1. Enter Key Handler
      if (isEnter && activeEl && activeEl !== document.body) {
        if (
          activeEl.getAttribute('data-tv-card') === 'true' ||
          activeEl.getAttribute('data-tv-nav') === 'category' ||
          activeEl.getAttribute('data-tv-nav') === 'tab' ||
          activeEl.tagName === 'BUTTON' ||
          activeEl.tagName === 'A'
        ) {
          e.preventDefault();
          soundService.playSelect();
          activeEl.click();
          if (activeEl.getAttribute('data-tv-card') === 'true') {
            saveFocusedCard(activeEl);
          }
          return;
        }
      }

      // 2. Tab Key Sequential Navigation (Fire TV remote tab sequence)
      if (isTab) {
        const navElements = Array.from(
          document.querySelectorAll<HTMLElement>(
            '[data-tv-nav="tab"], #channel-search-input, [data-tv-nav="category"], [data-tv-card="true"]'
          )
        ).filter((el) => el.offsetParent !== null && !el.hasAttribute('disabled'));

        if (navElements.length === 0) return;

        e.preventDefault();
        soundService.playNav();
        const currIdx = activeEl ? navElements.indexOf(activeEl) : -1;
        let nextIdx = 0;

        if (e.shiftKey) {
          nextIdx = currIdx > 0 ? currIdx - 1 : navElements.length - 1;
        } else {
          nextIdx = currIdx >= 0 && currIdx < navElements.length - 1 ? currIdx + 1 : 0;
        }

        const target = navElements[nextIdx];
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          if (target.getAttribute('data-tv-card') === 'true') {
            saveFocusedCard(target);
          }
        }
        return;
      }

      // 3. If nothing is focused (or document.body is focused), restore last channel or first item
      const pendingRestore =
        localStorage.getItem('satv_should_restore_channel') === 'true' ||
        sessionStorage.getItem('satv_should_restore_channel') === 'true';

      if (pendingRestore && activeEl && activeEl.getAttribute('data-tv-card') !== 'true') {
        const savedCard = getSavedCard();
        if (savedCard) {
          e.preventDefault();
          soundService.playNav();
          focusAndScrollCard(savedCard);
          return;
        }
      }

      const isCurrentNavigable =
        activeEl &&
        activeEl !== document.body &&
        (activeEl.getAttribute('data-tv-card') === 'true' ||
          activeEl.getAttribute('data-tv-nav') === 'category' ||
          activeEl.getAttribute('data-tv-nav') === 'tab' ||
          activeEl.id === 'channel-search-input');

      if (!isCurrentNavigable) {
        e.preventDefault();
        soundService.playNav();
        // Priority 1: The last channel user was browsing (e.g. MTV)
        const target =
          getSavedCard() ||
          document.querySelector<HTMLElement>('[data-tv-card="true"]') ||
          document.querySelector<HTMLElement>('[data-tv-nav="category"]') ||
          document.getElementById('channel-search-input') ||
          document.querySelector<HTMLElement>('[data-tv-nav="tab"]');

        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });
          if (target.getAttribute('data-tv-card') === 'true') {
            saveFocusedCard(target);
          }
        }
        return;
      }

      // 4. DIRECT CONTEXTUAL NAVIGATION (O(1) instant, ultra-smooth, zero layout reflows)

      // A. HEADER TABS (Fileiras, Mosaico, Guia EPG, Favoritos, 3 Pontinhos)
      if (activeEl.getAttribute('data-tv-nav') === 'tab') {
        const tabs = Array.from(
          document.querySelectorAll<HTMLElement>('[data-tv-nav="tab"]')
        ).filter((el) => el.offsetParent !== null && !el.hasAttribute('disabled'));

        const currIdx = tabs.indexOf(activeEl);

        if (isRight && currIdx >= 0 && currIdx < tabs.length - 1) {
          e.preventDefault();
          soundService.playNav();
          tabs[currIdx + 1].focus();
          return;
        }

        if (isLeft && currIdx > 0) {
          e.preventDefault();
          soundService.playNav();
          tabs[currIdx - 1].focus();
          return;
        }

        if (isDown) {
          e.preventDefault();
          soundService.playNav();
          const searchInput = document.getElementById('channel-search-input');
          const firstCat = document.querySelector<HTMLElement>('[data-tv-nav="category"]');
          const target = searchInput || firstCat || getSavedCard() || document.querySelector<HTMLElement>('[data-tv-card="true"]');
          if (target) {
            target.focus();
            target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            if (target.getAttribute('data-tv-card') === 'true') saveFocusedCard(target);
          }
          return;
        }

        return;
      }

      // B. SEARCH INPUT BAR
      if (activeEl.id === 'channel-search-input') {
        if (isUp) {
          e.preventDefault();
          soundService.playNav();
          const btnThreeDots = document.getElementById('btn-three-dots-menu');
          const firstTab = document.querySelector<HTMLElement>('[data-tv-nav="tab"]');
          const target = btnThreeDots || firstTab;
          if (target) {
            target.focus();
            target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          }
          return;
        }

        if (isDown) {
          e.preventDefault();
          soundService.playNav();
          const activeCategory =
            document.querySelector<HTMLElement>('[data-tv-nav="category"].bg-red-600') ||
            document.querySelector<HTMLElement>('[data-tv-nav="category"]');
          const target = activeCategory || getSavedCard() || document.querySelector<HTMLElement>('[data-tv-card="true"]');
          if (target) {
            target.focus();
            target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            if (target.getAttribute('data-tv-card') === 'true') saveFocusedCard(target);
          }
          return;
        }

        return;
      }

      // C. CATEGORY PILLS (Todos, Filmes, Esportes, Documentários, etc.)
      if (activeEl.getAttribute('data-tv-nav') === 'category') {
        const categories = Array.from(
          document.querySelectorAll<HTMLElement>('[data-tv-nav="category"]')
        ).filter((el) => el.offsetParent !== null);

        const currIdx = categories.indexOf(activeEl);

        if (isRight && currIdx >= 0 && currIdx < categories.length - 1) {
          e.preventDefault();
          soundService.playNav();
          const nextCat = categories[currIdx + 1];
          nextCat.focus();
          nextCat.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
          return;
        }

        if (isLeft && currIdx > 0) {
          e.preventDefault();
          soundService.playNav();
          const prevCat = categories[currIdx - 1];
          prevCat.focus();
          prevCat.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
          return;
        }

        if (isUp) {
          e.preventDefault();
          soundService.playNav();
          const searchInput = document.getElementById('channel-search-input');
          const btnThreeDots = document.getElementById('btn-three-dots-menu');
          const target = searchInput || btnThreeDots || document.querySelector<HTMLElement>('[data-tv-nav="tab"]');
          if (target) {
            target.focus();
            target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          }
          return;
        }

        if (isDown) {
          e.preventDefault();
          soundService.playNav();
          // Jump into the channels (either saved channel or first channel card)
          const target = getSavedCard() || document.querySelector<HTMLElement>('[data-tv-card="true"]');
          if (target) {
            target.focus();
            target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            saveFocusedCard(target);
          }
          return;
        }

        return;
      }

      // D. CHANNEL CARDS (Fileiras / Mosaico / Guia EPG)
      if (activeEl.getAttribute('data-tv-card') === 'true') {
        // Mode 1: ChannelRows (Horizontal Carousels inside sections)
        const rowSection = activeEl.closest('section');
        const isHorizontalCarousel =
          rowSection && activeEl.parentElement && activeEl.parentElement.parentElement?.classList.contains('overflow-x-auto');

        if (isHorizontalCarousel) {
          const carousel = activeEl.parentElement.parentElement as HTMLElement;

          // D1. Moving RIGHT along the carousel
          if (isRight) {
            const nextWrapper = activeEl.parentElement.nextElementSibling;
            const nextCard = nextWrapper?.querySelector<HTMLElement>('[data-tv-card="true"]');
            if (nextCard) {
              e.preventDefault();
              soundService.playNav();
              nextCard.focus();
              nextCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
              saveFocusedCard(nextCard);
              return;
            }
          }

          // D2. Moving LEFT along the carousel
          if (isLeft) {
            const prevWrapper = activeEl.parentElement.previousElementSibling;
            const prevCard = prevWrapper?.querySelector<HTMLElement>('[data-tv-card="true"]');
            if (prevCard) {
              e.preventDefault();
              soundService.playNav();
              prevCard.focus();
              prevCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
              saveFocusedCard(prevCard);
              return;
            }
          }

          // D3. Moving DOWN to next category row section
          if (isDown) {
            // Find next sibling section
            let nextSection = rowSection.nextElementSibling as HTMLElement | null;
            while (nextSection && nextSection.tagName !== 'SECTION') {
              nextSection = nextSection.nextElementSibling as HTMLElement | null;
            }

            if (nextSection) {
              const cardsInNext = Array.from(
                nextSection.querySelectorAll<HTMLElement>('[data-tv-card="true"]')
              );
              if (cardsInNext.length > 0) {
                e.preventDefault();
                soundService.playNav();
                // Find card with closest horizontal screen alignment or first visible
                const activeRect = activeEl.getBoundingClientRect();
                let closestCard = cardsInNext[0];
                let minDx = Infinity;

                for (const c of cardsInNext) {
                  const r = c.getBoundingClientRect();
                  const dx = Math.abs(r.left - activeRect.left);
                  if (dx < minDx) {
                    minDx = dx;
                    closestCard = c;
                  }
                }

                closestCard.focus();
                closestCard.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                saveFocusedCard(closestCard);
                return;
              }
            }
            // If no next section, stay on current card (don't jump erratically)
            return;
          }

          // D4. Moving UP to previous category row section or back to category pills
          if (isUp) {
            let prevSection = rowSection.previousElementSibling as HTMLElement | null;
            while (prevSection && prevSection.tagName !== 'SECTION') {
              prevSection = prevSection.previousElementSibling as HTMLElement | null;
            }

            if (prevSection) {
              const cardsInPrev = Array.from(
                prevSection.querySelectorAll<HTMLElement>('[data-tv-card="true"]')
              );
              if (cardsInPrev.length > 0) {
                e.preventDefault();
                soundService.playNav();
                const activeRect = activeEl.getBoundingClientRect();
                let closestCard = cardsInPrev[0];
                let minDx = Infinity;

                for (const c of cardsInPrev) {
                  const r = c.getBoundingClientRect();
                  const dx = Math.abs(r.left - activeRect.left);
                  if (dx < minDx) {
                    minDx = dx;
                    closestCard = c;
                  }
                }

                closestCard.focus();
                closestCard.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                saveFocusedCard(closestCard);
                return;
              }
            }

            // If no previous section (we are at the topmost channel row): Jump up to category pills or search!
            e.preventDefault();
            soundService.playNav();
            const activeCategory =
              document.querySelector<HTMLElement>('[data-tv-nav="category"].bg-red-600') ||
              document.querySelector<HTMLElement>('[data-tv-nav="category"]') ||
              document.getElementById('channel-search-input') ||
              document.getElementById('btn-three-dots-menu');

            if (activeCategory) {
              activeCategory.focus();
              activeCategory.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            }
            return;
          }
        }

        // Mode 2: Sequential Grid or EPG List
        const allCards = Array.from(
          document.querySelectorAll<HTMLElement>('[data-tv-card="true"]')
        ).filter((el) => el.offsetParent !== null);

        const cardIdx = allCards.indexOf(activeEl);

        if (isRight && cardIdx >= 0 && cardIdx < allCards.length - 1) {
          e.preventDefault();
          soundService.playNav();
          const target = allCards[cardIdx + 1];
          target.focus();
          target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          saveFocusedCard(target);
          return;
        }

        if (isLeft && cardIdx > 0) {
          e.preventDefault();
          soundService.playNav();
          const target = allCards[cardIdx - 1];
          target.focus();
          target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          saveFocusedCard(target);
          return;
        }

        // For Down/Up in Grid or EPG list
        if (isDown) {
          // Estimate columns by horizontal offset
          let cols = 1;
          const currentTop = activeEl.offsetTop;
          for (let i = cardIdx + 1; i < allCards.length; i++) {
            if (allCards[i].offsetTop > currentTop + 10) {
              cols = i - cardIdx;
              break;
            }
          }

          const nextIdx = cardIdx + cols;
          if (nextIdx < allCards.length) {
            e.preventDefault();
            soundService.playNav();
            const target = allCards[nextIdx];
            target.focus();
            target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            saveFocusedCard(target);
            return;
          }
          return;
        }

        if (isUp) {
          let cols = 1;
          const currentTop = activeEl.offsetTop;
          for (let i = cardIdx - 1; i >= 0; i--) {
            if (allCards[i].offsetTop < currentTop - 10) {
              cols = cardIdx - i;
              break;
            }
          }

          const prevIdx = cardIdx - cols;
          if (prevIdx >= 0) {
            e.preventDefault();
            soundService.playNav();
            const target = allCards[prevIdx];
            target.focus();
            target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            saveFocusedCard(target);
            return;
          }

          // If at top row: Jump up to Category Pills or Search
          e.preventDefault();
          soundService.playNav();
          const target =
            document.querySelector<HTMLElement>('[data-tv-nav="category"]') ||
            document.getElementById('channel-search-input') ||
            document.getElementById('btn-three-dots-menu');
          if (target) {
            target.focus();
            target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          }
          return;
        }
      }
    };

    window.addEventListener('keydown', handleTvKeyDown);
    return () => window.removeEventListener('keydown', handleTvKeyDown);
  }, [enabled]);

  return { lastFocusedCardRef, getSavedCard };
}
