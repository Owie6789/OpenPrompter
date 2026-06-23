import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from '@phosphor-icons/react';

type CardNavLink = {
  label: string;
  href: string;
  ariaLabel: string;
  onClick?: () => void;
};

export type CardNavItem = {
  label: string;
  bgColor: string;
  textColor: string;
  links: CardNavLink[];
};

export interface CardNavProps {
  logo: string;
  logoAlt?: string;
  items: CardNavItem[];
  className?: string;
  baseColor?: string;
  menuColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
}

const CLOSED_HEIGHT = 60;
const EXPANDED_HEIGHT = 260;

const CardNav: React.FC<CardNavProps> = ({
  logo,
  logoAlt = 'Logo',
  items,
  className = '',
  baseColor = '#fff',
  menuColor,
  buttonBgColor,
  buttonTextColor,
  buttonLabel = 'Get Started',
  onButtonClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [navHeight, setNavHeight] = useState(CLOSED_HEIGHT);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const calculateHeight = useCallback(() => {
    const contentEl = contentRef.current;
    if (!contentEl) return EXPANDED_HEIGHT;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (!isMobile) return EXPANDED_HEIGHT;

    const wasVisibility = contentEl.style.visibility;
    const wasPointerEvents = contentEl.style.pointerEvents;
    const wasPosition = contentEl.style.position;
    const wasHeight = contentEl.style.height;

    contentEl.style.visibility = 'visible';
    contentEl.style.pointerEvents = 'auto';
    contentEl.style.position = 'static';
    contentEl.style.height = 'auto';
    void contentEl.offsetHeight;

    const contentHeight = contentEl.scrollHeight;

    contentEl.style.visibility = wasVisibility;
    contentEl.style.pointerEvents = wasPointerEvents;
    contentEl.style.position = wasPosition;
    contentEl.style.height = wasHeight;

    return CLOSED_HEIGHT + contentHeight + 16;
  }, []);

  useEffect(() => {
    if (isExpanded) {
      setNavHeight(calculateHeight());
    } else {
      setNavHeight(CLOSED_HEIGHT);
    }
  }, [isExpanded, calculateHeight]);

  useEffect(() => {
    const handleResize = () => {
      if (isExpanded) {
        setNavHeight(calculateHeight());
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isExpanded, calculateHeight]);

  const toggleMenu = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div
      className={`card-nav-container w-full max-w-[800px] ${className}`}
    >
      <nav
        className={`card-nav block p-0 rounded-xl relative overflow-hidden`}
        style={{
          backgroundColor: baseColor,
          height: navHeight,
          transition: 'height 400ms cubic-bezier(0.33, 1, 0.68, 1)',
          willChange: 'height',
        }}
        aria-label="Main navigation"
      >
        <div className="card-nav-top absolute inset-x-0 top-0 h-[60px] flex items-center justify-between p-2 pl-[1.1rem] z-[2]">
          <div
            className={`hamburger-menu group h-full flex flex-col items-center justify-center cursor-pointer gap-[6px] order-2 md:order-none`}
            onClick={toggleMenu}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleMenu();
              }
            }}
            role="button"
            aria-label={isExpanded ? 'Close menu' : 'Open menu'}
            aria-expanded={isExpanded}
            aria-controls="card-nav-content"
            tabIndex={0}
            style={{ color: menuColor || '#000' }}
          >
            <div
              className={`hamburger-line w-[30px] h-[2px] bg-current transition-[transform,opacity,margin] duration-300 ease-linear [transform-origin:50%_50%] ${
                isExpanded ? 'translate-y-[4px] rotate-45' : ''
              } group-hover:opacity-75`}
            />
            <div
              className={`hamburger-line w-[30px] h-[2px] bg-current transition-[transform,opacity,margin] duration-300 ease-linear [transform-origin:50%_50%] ${
                isExpanded ? '-translate-y-[4px] -rotate-45' : ''
              } group-hover:opacity-75`}
            />
          </div>

          <div className="logo-container flex items-center md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 order-1 md:order-none">
            <img src={logo} alt={logoAlt} className="logo h-[28px]" />
          </div>

          <button
            type="button"
            className="card-nav-cta-button inline-flex border-0 rounded-[calc(0.75rem-0.2rem)] px-4 items-center h-full font-medium cursor-pointer transition-colors duration-300"
            style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
            onClick={onButtonClick}
          >
            {buttonLabel}
          </button>
        </div>

        <div
          ref={contentRef}
          id="card-nav-content"
          className={`card-nav-content absolute left-0 right-0 top-[60px] bottom-0 p-2 flex flex-col items-stretch gap-2 justify-start z-[1] ${
            isExpanded
              ? 'visible pointer-events-auto'
              : 'invisible pointer-events-none'
          } md:flex-row md:items-end md:gap-[12px]`}
          role="tabpanel"
          aria-hidden={!isExpanded}
        >
          {(items || []).slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card select-none relative flex flex-col gap-2 p-[12px_16px] rounded-[calc(0.75rem-0.2rem)] min-w-0 flex-[1_1_auto] h-auto min-h-[60px] md:h-full md:min-h-0 md:flex-[1_1_0%]"
              style={{
                backgroundColor: item.bgColor,
                color: item.textColor,
                opacity: isExpanded ? 1 : 0,
                transform: isExpanded ? 'translateY(0)' : 'translateY(50px)',
                transition: `opacity 400ms cubic-bezier(0.33, 1, 0.68, 1) ${idx * 80}ms, transform 400ms cubic-bezier(0.33, 1, 0.68, 1) ${idx * 80}ms`,
              }}
            >
              <div className="nav-card-label font-normal tracking-[-0.5px] text-[18px] md:text-[22px]">
                {item.label}
              </div>
              <div className="nav-card-links mt-auto flex flex-col gap-[2px]">
                {item.links?.map((lnk, i) => (
                  <a
                    key={`${lnk.label}-${i}`}
                    className="nav-card-link inline-flex items-center gap-[6px] no-underline cursor-pointer transition-opacity duration-300 hover:opacity-75 text-[15px] md:text-[16px]"
                    href={lnk.href}
                    aria-label={lnk.ariaLabel}
                    onClick={(e) => {
                      if (lnk.onClick) {
                        e.preventDefault();
                        lnk.onClick();
                      }
                    }}
                  >
                    <ArrowUpRight
                      weight="bold"
                      size={16}
                      className="nav-card-link-icon shrink-0"
                      aria-hidden="true"
                    />
                    {lnk.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
