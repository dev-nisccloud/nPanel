'use client';

import { gsap } from 'gsap';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface TabV2ContextType {
  activeTab: string | null;
  switchToTab: (tabId: string) => void;
  registerTabButton: (tabId: string, element: HTMLButtonElement | null) => void;
  registerTabContent: (tabId: string, element: HTMLDivElement | null) => void;
  registerTabContainer: (element: HTMLDivElement | null) => void;
  registerActiveIndicator: (element: HTMLDivElement | null) => void;
}

const TabV2Context = createContext<TabV2ContextType | undefined>(undefined);

interface TabV2ProviderProps {
  children: React.ReactNode;
  defaultValue?: string;
}

export const TabV2Provider: React.FC<TabV2ProviderProps> = ({ children, defaultValue }) => {
  const [activeTab, setActiveTab] = useState<string | null>(defaultValue || null);
  const tabButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const tabContentRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const tabContainerRef = useRef<HTMLDivElement | null>(null);
  const activeIndicatorRef = useRef<HTMLDivElement | null>(null);

  const registerTabButton = useCallback((tabId: string, element: HTMLButtonElement | null) => {
    if (element) {
      tabButtonRefs.current.set(tabId, element);
    } else {
      tabButtonRefs.current.delete(tabId);
    }
  }, []);

  const registerTabContent = useCallback((tabId: string, element: HTMLDivElement | null) => {
    if (element) {
      tabContentRefs.current.set(tabId, element);
    } else {
      tabContentRefs.current.delete(tabId);
    }
  }, []);

  const registerTabContainer = useCallback((element: HTMLDivElement | null) => {
    tabContainerRef.current = element;
  }, []);

  const registerActiveIndicator = useCallback((element: HTMLDivElement | null) => {
    activeIndicatorRef.current = element;
  }, []);

  // Trigger reveal animation for an element
  const triggerRevealAnimation = useCallback((element: HTMLDivElement) => {
    if (!element || typeof window === 'undefined') return;

    gsap.killTweensOf(element);
    gsap.fromTo(
      element,
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: 'linear',
      },
    );
  }, []);

  // Set initial position, width, and height of indicator
  const updateIndicator = useCallback(
    (button: HTMLButtonElement) => {
      if (!activeIndicatorRef.current || !tabContainerRef.current || !button) {
        return;
      }

      const containerRect = tabContainerRef.current.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const left = buttonRect.left - containerRect.left;
      const top = buttonRect.top - containerRect.top;
      const width = buttonRect.width;
      const height = buttonRect.height;

      activeIndicatorRef.current.style.left = `${left}px`;
      activeIndicatorRef.current.style.top = `${top}px`;
      activeIndicatorRef.current.style.width = `${width}px`;
      activeIndicatorRef.current.style.height = `${height}px`;
    },
    [],
  );

  // Show the correct content
  const showContent = useCallback(
    (contentName: string) => {
      tabContentRefs.current.forEach((content, tabId) => {
        if (tabId === contentName) {
          // Remove hidden class and add flex
          content.classList.remove('hidden');
          content.classList.add('flex');
          // Update accessibility attributes
          content.setAttribute('aria-hidden', 'false');

          // Trigger reveal animation
          triggerRevealAnimation(content);
        } else {
          content.classList.add('hidden');
          content.classList.remove('flex');
          // Update accessibility attributes
          content.setAttribute('aria-hidden', 'true');
        }
      });
    },
    [triggerRevealAnimation],
  );

  // Update button states (only aria attributes, classes are handled by React)
  const updateButtonStates = useCallback((activeButton: HTMLButtonElement) => {
    tabButtonRefs.current.forEach((button) => {
      if (button === activeButton) {
        button.setAttribute('aria-selected', 'true');
        button.setAttribute('tabindex', '0');
      } else {
        button.setAttribute('aria-selected', 'false');
        button.setAttribute('tabindex', '-1');
      }
    });
  }, []);

  const switchToTab = useCallback(
    (tabId: string) => {
      if (tabId === activeTab) {
        return;
      }

      setActiveTab(tabId);

      const activeButton = tabButtonRefs.current.get(tabId);
      if (activeButton) {
        // Update indicator position
        updateIndicator(activeButton);

        // Show/hide content
        showContent(tabId);

        // Update button states
        updateButtonStates(activeButton);
      }
    },
    [activeTab, updateIndicator, showContent, updateButtonStates],
  );

  // Initialize on mount - wait for next tick to ensure tabs are registered
  useEffect(() => {
    const initialize = () => {
      if (activeTab) {
        const activeButton = tabButtonRefs.current.get(activeTab);
        if (activeButton) {
          updateIndicator(activeButton);
          showContent(activeTab);
          updateButtonStates(activeButton);
        }
      } else {
        // If no default, select first tab
        const firstTabId = Array.from(tabButtonRefs.current.keys())[0];
        if (firstTabId) {
          setActiveTab(firstTabId);
        const firstButton = tabButtonRefs.current.get(firstTabId);
        if (firstButton) {
          updateIndicator(firstButton);
          showContent(firstTabId);
          updateButtonStates(firstButton);
        }
        }
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      setTimeout(initialize, 0);
    });
  }, []); // Only run on mount

  // Handle window resize to recalculate indicator position
  useEffect(() => {
    const handleResize = () => {
      if (activeTab) {
        const currentSelected = tabButtonRefs.current.get(activeTab);
        if (currentSelected) {
          updateIndicator(currentSelected);
        }
      }
    };

    let resizeTimeout: NodeJS.Timeout;
    const resizeHandler = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', resizeHandler);

    return () => {
      window.removeEventListener('resize', resizeHandler);
      clearTimeout(resizeTimeout);
    };
  }, [activeTab, updateIndicator]);

  const value: TabV2ContextType = {
    activeTab,
    switchToTab,
    registerTabButton,
    registerTabContent,
    registerTabContainer,
    registerActiveIndicator,
  };

  return <TabV2Context.Provider value={value}>{children}</TabV2Context.Provider>;
};

export const useTabV2 = (): TabV2ContextType => {
  const context = useContext(TabV2Context);
  if (context === undefined) {
    throw new Error('useTabV2 must be used within a TabV2Provider');
  }
  return context;
};

