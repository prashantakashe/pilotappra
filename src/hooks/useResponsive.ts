// src/hooks/useResponsive.ts
import { useWindowDimensions } from 'react-native';

export interface ResponsiveInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  windowWidth: number;
  windowHeight: number;
}

/**
 * Custom hook for responsive breakpoints
 * Mobile: width <= 480
 * Tablet: 481 - 900
 * Desktop: > 900
 */
export const useResponsive = (): ResponsiveInfo => {
  const { width, height } = useWindowDimensions();

  return {
    isMobile: width <= 480,
    isTablet: width > 480 && width <= 900,
    isDesktop: width > 900,
    windowWidth: width,
    windowHeight: height,
  };
};
