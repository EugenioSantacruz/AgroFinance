import { useWindowDimensions } from 'react-native';

export const DESKTOP_MIN_WIDTH = 900;
export const CONTENT_MAX_WIDTH = 1100;

export function useBreakpoint() {
  const { width } = useWindowDimensions();
  return { width, isDesktop: width >= DESKTOP_MIN_WIDTH };
}

