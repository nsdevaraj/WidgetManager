interface Screen {
  id: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  workArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  scaleFactor: number;
  isPrimary: boolean;
}

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

/**
 * Get the screen that contains the given position
 */
export const getScreenAtPosition = async (position: Position): Promise<Screen | null> => {
  const screens = await window.api.getScreens();
  return screens.find(screen => {
    const { x, y, width, height } = screen.bounds;
    return (
      position.x >= x &&
      position.x < x + width &&
      position.y >= y &&
      position.y < y + height
    );
  }) || null;
};

/**
 * Constrain a position to keep the widget within screen bounds
 */
export const constrainPosition = async (
  position: Position,
  size: Size,
  padding: number = 0
): Promise<Position> => {
  const screens = await window.api.getScreens();
  const screen = await getScreenAtPosition(position) || screens[0];
  
  if (!screen) {
    return position; // Fallback to original position if no screen found
  }

  const { x: screenX, y: screenY, width: screenWidth, height: screenHeight } = screen.workArea;

  // Calculate bounds with padding
  const minX = screenX + padding;
  const minY = screenY + padding;
  const maxX = screenX + screenWidth - size.width - padding;
  const maxY = screenY + screenHeight - size.height - padding;

  return {
    x: Math.min(Math.max(position.x, minX), maxX),
    y: Math.min(Math.max(position.y, minY), maxY)
  };
};

/**
 * Get the primary screen's work area
 */
export const getPrimaryScreen = async (): Promise<Screen | null> => {
  const screens = await window.api.getScreens();
  return screens.find(screen => screen.isPrimary) || screens[0] || null;
};

/**
 * Calculate a good initial position for a new widget
 */
export const calculateInitialPosition = async (size: Size): Promise<Position> => {
  const primaryScreen = await getPrimaryScreen();
  
  if (!primaryScreen) {
    return { x: 0, y: 0 }; // Fallback position
  }

  const { x, y, width, height } = primaryScreen.workArea;
  
  // Place in the center of the primary screen
  return {
    x: x + (width - size.width) / 2,
    y: y + (height - size.height) / 2
  };
}; 