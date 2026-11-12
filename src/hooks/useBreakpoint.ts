import { useWindowDimensions } from 'react-native';

export const TABLET_MIN_WIDTH = 640;
export const DESKTOP_MIN_WIDTH = 960;
export const WIDE_MIN_WIDTH = 1260;
export const CONTENT_MAX_WIDTH = 1320;

export function useBreakpoint() {
  const { width, height } = useWindowDimensions();
  const isMobile = width < TABLET_MIN_WIDTH;
  const isTablet = width >= TABLET_MIN_WIDTH && width < DESKTOP_MIN_WIDTH;
  const isDesktop = width >= DESKTOP_MIN_WIDTH;
  const isWide = width >= WIDE_MIN_WIDTH;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    contentMaxWidth: isDesktop ? CONTENT_MAX_WIDTH : '100%',
  };
}
