import { Screen } from '../../types/electron';
import { Position, Size } from '../../types/config';

const SCREEN_PADDING = 10;

/**
 * Get the screen that contains the given position
 */
export const getScreenAtPosition = async (position: Position): Promise<Screen | null> => {
  const screens = await window.api.getScreens();
  return screens.find((screen: Screen) => {
    const { x, y, width, height } = screen.bounds;
    return (
      position.x >= x &&
      position.x <= x + width &&
      position.y >= y &&
      position.y <= y + height
    );
  }) || null;
};

/**
 * Constrain a position to be within screen bounds
 */
export const constrainPosition = async (position: Position, size: Size): Promise<Position> => {
  const screen = await getScreenAtPosition(position) || await getPrimaryScreen();
  if (!screen) return position;

  const { x, y, width, height } = screen.workArea;
  return {
    x: Math.max(x + SCREEN_PADDING, Math.min(x + width - size.width - SCREEN_PADDING, position.x)),
    y: Math.max(y + SCREEN_PADDING, Math.min(y + height - size.height - SCREEN_PADDING, position.y))
  };
};

/**
 * Get the primary screen
 */
export const getPrimaryScreen = async (): Promise<Screen | null> => {
  const screens = await window.api.getScreens();
  return screens.find((screen: Screen) => screen.isPrimary) || screens[0] || null;
};

/**
 * Calculate initial position for a new widget
 */
export const calculateInitialPosition = async (size: Size): Promise<Position> => {
  const screen = await getPrimaryScreen();
  if (!screen) {
    return { x: 0, y: 0 };
  }

  const { x, y, width, height } = screen.workArea;
  return {
    x: x + (width - size.width) / 2,
    y: y + (height - size.height) / 2
  };
}; 