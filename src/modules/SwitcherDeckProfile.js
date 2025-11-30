/**
 * SwitcherDeckProfile - Stream Deck profile for Video Switcher
 *
 * Pre-configured button layouts for video switching operations
 */

import { Colors, ButtonType, streamDeckManager } from './StreamDeckController.js';
import { switcherManager } from './VideoSwitcher.js';
import { eventBus, Events } from './EventBus.js';

// Switcher-specific button types
const SwitcherButtonType = {
  INPUT_SELECT: 'input_select',
  CUT: 'cut',
  AUTO: 'auto',
  FTB: 'ftb',
  TRANSITION_TYPE: 'transition_type',
  PREVIEW: 'preview',
  PROGRAM: 'program'
};

// Default colors for switcher buttons
const SwitcherColors = {
  INPUT_IDLE: { r: 40, g: 40, b: 40 },
  INPUT_PREVIEW: { r: 0, g: 255, b: 0 },
  INPUT_PROGRAM: { r: 255, g: 0, b: 0 },
  CUT: { r: 255, g: 0, b: 0 },
  AUTO: { r: 255, g: 200, b: 0 },
  FTB_OFF: { r: 60, g: 60, b: 60 },
  FTB_ON: { r: 255, g: 0, b: 0 },
  TRANS_ACTIVE: { r: 0, g: 128, b: 255 },
  TRANS_INACTIVE: { r: 40, g: 40, b: 40 }
};

/**
 * Create a standard switcher profile for Stream Deck
 *
 * Layout (15-button Stream Deck):
 * Row 1: [Input 1] [Input 2] [Input 3] [Input 4] [BLACK]
 * Row 2: [Input 5] [Input 6] [Input 7] [Input 8] [BARS]
 * Row 3: [CUT]     [AUTO]    [FTB]     [DISS]    [WIPE]
 *
 * @param {string} deckId - Stream Deck ID
 */
function createSwitcherProfile(deckId) {
  const deck = streamDeckManager.get(deckId);
  if (!deck) {
    console.error(`Stream Deck ${deckId} not found`);
    return null;
  }

  // Row 1: Inputs 1-4 + Black
  for (let i = 0; i < 4; i++) {
    configureInputButton(deck, 0, i, i + 1);
  }
  configureSpecialInputButton(deck, 0, 4, 'black', 'BLACK');

  // Row 2: Inputs 5-8 + Bars
  for (let i = 0; i < 4; i++) {
    configureInputButton(deck, 1, i, i + 5);
  }
  configureSpecialInputButton(deck, 1, 4, 'bars', 'BARS');

  // Row 3: Control buttons
  configureCutButton(deck, 2, 0);
  configureAutoButton(deck, 2, 1);
  configureFTBButton(deck, 2, 2);
  configureTransitionButton(deck, 2, 3, 'dissolve', 'DISS');
  configureTransitionButton(deck, 2, 4, 'wipe', 'WIPE');

  // Subscribe to switcher events for LED updates
  subscribeToSwitcherEvents(deck);

  return deck;
}

/**
 * Configure an input select button
 */
function configureInputButton(deck, row, col, inputId) {
  deck.configureButton(row, col, {
    type: SwitcherButtonType.INPUT_SELECT,
    label: String(inputId),
    color: SwitcherColors.INPUT_IDLE,
    activeColor: SwitcherColors.INPUT_PREVIEW,
    command: `preview ${inputId}`,
    inputId: inputId,
    onPress: (button) => {
      const switcher = switcherManager.get();
      if (switcher) {
        switcher.preview(inputId);
      }
    }
  });
}

/**
 * Configure special input button (black, bars)
 */
function configureSpecialInputButton(deck, row, col, inputId, label) {
  deck.configureButton(row, col, {
    type: SwitcherButtonType.INPUT_SELECT,
    label: label,
    color: inputId === 'black' ? { r: 0, g: 0, b: 0 } : { r: 128, g: 128, b: 128 },
    activeColor: SwitcherColors.INPUT_PREVIEW,
    command: `preview ${inputId}`,
    inputId: inputId,
    onPress: (button) => {
      const switcher = switcherManager.get();
      if (switcher) {
        switcher.preview(inputId);
      }
    }
  });
}

/**
 * Configure CUT button
 */
function configureCutButton(deck, row, col) {
  deck.configureButton(row, col, {
    type: SwitcherButtonType.CUT,
    label: 'CUT',
    color: SwitcherColors.CUT,
    pressedColor: Colors.WHITE,
    command: 'cut',
    onPress: (button) => {
      const switcher = switcherManager.get();
      if (switcher) {
        switcher.cut();
      }
    }
  });
}

/**
 * Configure AUTO/TAKE button
 */
function configureAutoButton(deck, row, col) {
  deck.configureButton(row, col, {
    type: SwitcherButtonType.AUTO,
    label: 'AUTO',
    color: SwitcherColors.AUTO,
    pressedColor: Colors.WHITE,
    command: 'auto',
    onPress: (button) => {
      const switcher = switcherManager.get();
      if (switcher) {
        switcher.auto();
      }
    }
  });
}

/**
 * Configure FTB button
 */
function configureFTBButton(deck, row, col) {
  deck.configureButton(row, col, {
    type: SwitcherButtonType.FTB,
    label: 'FTB',
    color: SwitcherColors.FTB_OFF,
    activeColor: SwitcherColors.FTB_ON,
    command: 'ftb',
    onPress: (button) => {
      const switcher = switcherManager.get();
      if (switcher) {
        switcher.fadeToBlack();
      }
    }
  });
}

/**
 * Configure transition type button
 */
function configureTransitionButton(deck, row, col, transType, label) {
  deck.configureButton(row, col, {
    type: SwitcherButtonType.TRANSITION_TYPE,
    label: label,
    color: SwitcherColors.TRANS_INACTIVE,
    activeColor: SwitcherColors.TRANS_ACTIVE,
    command: `transition ${transType}`,
    transitionType: transType,
    onPress: (button) => {
      const switcher = switcherManager.get();
      if (switcher) {
        switcher.setTransitionType(transType);
      }
    }
  });
}

/**
 * Subscribe to switcher events for LED updates
 */
function subscribeToSwitcherEvents(deck) {
  // Preview changed
  eventBus.on('switcher:preview_changed', ({ inputId }) => {
    updateInputButtons(deck, null, inputId);
  });

  // Program changed
  eventBus.on('switcher:program_changed', ({ program, preview }) => {
    updateInputButtons(deck, program, preview);
  });

  // Cut
  eventBus.on('switcher:cut', ({ program, preview }) => {
    updateInputButtons(deck, program, preview);
  });

  // Transition complete
  eventBus.on('switcher:transition_complete', ({ program, preview }) => {
    updateInputButtons(deck, program, preview);
  });

  // FTB
  eventBus.on('switcher:ftb', ({ active }) => {
    updateFTBButton(deck, active);
  });

  // Transition type changed
  eventBus.on('switcher:transition_type_changed', ({ type }) => {
    updateTransitionButtons(deck, type);
  });

  // Transition progress (for AUTO button feedback)
  eventBus.on('switcher:transition_progress', ({ progress }) => {
    updateAutoButtonProgress(deck, progress);
  });
}

/**
 * Update input button colors based on preview/program state
 */
function updateInputButtons(deck, programId, previewId) {
  deck.buttons.forEach((button, key) => {
    if (button.type === SwitcherButtonType.INPUT_SELECT) {
      const inputId = button.inputId;

      if (inputId === programId) {
        button.color = SwitcherColors.INPUT_PROGRAM;
        button.active = false;
      } else if (inputId === previewId) {
        button.color = SwitcherColors.INPUT_PREVIEW;
        button.active = true;
      } else {
        button.color = SwitcherColors.INPUT_IDLE;
        button.active = false;
      }

      deck.updateButton(button.row, button.col);
    }
  });
}

/**
 * Update FTB button state
 */
function updateFTBButton(deck, active) {
  deck.buttons.forEach((button) => {
    if (button.type === SwitcherButtonType.FTB) {
      button.active = active;
      button.color = active ? SwitcherColors.FTB_ON : SwitcherColors.FTB_OFF;
      deck.updateButton(button.row, button.col);
    }
  });
}

/**
 * Update transition type buttons
 */
function updateTransitionButtons(deck, activeType) {
  deck.buttons.forEach((button) => {
    if (button.type === SwitcherButtonType.TRANSITION_TYPE) {
      button.active = button.transitionType === activeType;
      button.color = button.active ? SwitcherColors.TRANS_ACTIVE : SwitcherColors.TRANS_INACTIVE;
      deck.updateButton(button.row, button.col);
    }
  });
}

/**
 * Update AUTO button during transition
 */
function updateAutoButtonProgress(deck, progress) {
  deck.buttons.forEach((button) => {
    if (button.type === SwitcherButtonType.AUTO) {
      // Pulse the button during transition
      const intensity = Math.floor(255 * (0.5 + 0.5 * Math.sin(progress * Math.PI * 2)));
      button.color = { r: intensity, g: Math.floor(intensity * 0.8), b: 0 };
      deck.updateButton(button.row, button.col);
    }
  });
}

/**
 * Create a compact switcher profile for 6-button Stream Deck Mini
 *
 * Layout:
 * Row 1: [Input 1] [Input 2] [Input 3]
 * Row 2: [CUT]     [AUTO]    [FTB]
 */
function createMiniSwitcherProfile(deckId) {
  const deck = streamDeckManager.get(deckId);
  if (!deck) {
    console.error(`Stream Deck ${deckId} not found`);
    return null;
  }

  // Row 1: Inputs 1-3
  for (let i = 0; i < 3; i++) {
    configureInputButton(deck, 0, i, i + 1);
  }

  // Row 2: Controls
  configureCutButton(deck, 1, 0);
  configureAutoButton(deck, 1, 1);
  configureFTBButton(deck, 1, 2);

  subscribeToSwitcherEvents(deck);

  return deck;
}

/**
 * Create an extended profile for Stream Deck XL (32 buttons)
 *
 * Layout (8x4):
 * Row 1: [1] [2] [3] [4] [5] [6] [7] [8]
 * Row 2: [BLACK] [BARS] [MP1] [MP2] [] [] [] []
 * Row 3: [CUT] [DISS] [FADE] [WIPE] [DIP] [TIME-] [TIME+] []
 * Row 4: [AUTO] [FTB] [PREV] [NEXT] [] [] [] []
 */
function createXLSwitcherProfile(deckId) {
  const deck = streamDeckManager.get(deckId);
  if (!deck) {
    console.error(`Stream Deck ${deckId} not found`);
    return null;
  }

  // Row 1: All 8 inputs
  for (let i = 0; i < 8; i++) {
    configureInputButton(deck, 0, i, i + 1);
  }

  // Row 2: Special inputs
  configureSpecialInputButton(deck, 1, 0, 'black', 'BLACK');
  configureSpecialInputButton(deck, 1, 1, 'bars', 'BARS');

  // Row 3: Transition controls
  configureCutButton(deck, 2, 0);
  configureTransitionButton(deck, 2, 1, 'dissolve', 'DISS');
  configureTransitionButton(deck, 2, 2, 'fade', 'FADE');
  configureTransitionButton(deck, 2, 3, 'wipe', 'WIPE');
  configureTransitionButton(deck, 2, 4, 'dip', 'DIP');

  // Time adjust buttons
  deck.configureButton(2, 5, {
    label: 'T-',
    color: { r: 60, g: 60, b: 60 },
    command: 'transition time 500',
    onPress: () => {
      const switcher = switcherManager.get();
      if (switcher) {
        const newTime = Math.max(0, switcher.transitionDuration - 250);
        switcher.setTransitionDuration(newTime);
      }
    }
  });

  deck.configureButton(2, 6, {
    label: 'T+',
    color: { r: 60, g: 60, b: 60 },
    command: 'transition time 1500',
    onPress: () => {
      const switcher = switcherManager.get();
      if (switcher) {
        const newTime = Math.min(10000, switcher.transitionDuration + 250);
        switcher.setTransitionDuration(newTime);
      }
    }
  });

  // Row 4: Main controls
  configureAutoButton(deck, 3, 0);
  configureFTBButton(deck, 3, 1);

  subscribeToSwitcherEvents(deck);

  return deck;
}

export {
  SwitcherButtonType,
  SwitcherColors,
  createSwitcherProfile,
  createMiniSwitcherProfile,
  createXLSwitcherProfile,
  configureInputButton,
  configureCutButton,
  configureAutoButton,
  configureFTBButton,
  configureTransitionButton
};
