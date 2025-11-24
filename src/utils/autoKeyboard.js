/**
 * Auto Keyboard Trigger
 *
 * Automatically shows on-screen keyboard when input fields are focused
 * Critical for Steam Deck touch input
 */

/**
 * Auto Keyboard Manager Class
 */
export class AutoKeyboardManager {
  constructor() {
    this.isEnabled = true;
    this.currentInput = null;
    this.keyboardCallback = null;
    this.focusListenerBound = this.handleFocus.bind(this);
    this.blurListenerBound = this.handleBlur.bind(this);
  }

  /**
   * Initialize auto-keyboard system
   * @param {Function} showKeyboardCallback - Function to show keyboard
   */
  initialize(showKeyboardCallback) {
    this.keyboardCallback = showKeyboardCallback;

    // Add focus listeners to all inputs
    this.attachListeners();

    // Watch for new inputs being added to DOM
    this.observeDOM();

    console.log('Auto Keyboard Manager initialized');
  }

  /**
   * Attach focus listeners to inputs
   */
  attachListeners() {
    const inputs = document.querySelectorAll('input[type="text"], input[type="number"], input[type="tel"], textarea');

    inputs.forEach(input => {
      input.addEventListener('focus', this.focusListenerBound);
      input.addEventListener('blur', this.blurListenerBound);
    });
  }

  /**
   * Handle input focus
   * @param {Event} event - Focus event
   */
  handleFocus(event) {
    if (!this.isEnabled) return;

    const input = event.target;

    // Check if this is a keyboard-worthy input
    if (!this.shouldShowKeyboard(input)) return;

    this.currentInput = input;

    // Determine keyboard mode
    const mode = this.getKeyboardMode(input);

    // Show keyboard
    if (this.keyboardCallback) {
      this.keyboardCallback(true, mode, input);
    }
  }

  /**
   * Handle input blur
   * @param {Event} event - Blur event
   */
  handleBlur(event) {
    // Small delay to allow keyboard interaction
    setTimeout(() => {
      if (this.currentInput === event.target) {
        this.currentInput = null;
      }
    }, 100);
  }

  /**
   * Determine if keyboard should show for this input
   * @param {HTMLElement} input - Input element
   * @returns {boolean}
   */
  shouldShowKeyboard(input) {
    // Don't show for hidden or disabled inputs
    if (input.disabled || input.readOnly) return false;
    if (input.style.display === 'none') return false;

    // Don't show if desktop keyboard is available
    if (!this.isTouchDevice()) return false;

    // Don't show for specific classes (opt-out)
    if (input.classList.contains('no-auto-keyboard')) return false;

    return true;
  }

  /**
   * Get keyboard mode for input
   * @param {HTMLElement} input - Input element
   * @returns {string} 'numpad' or 'keyboard'
   */
  getKeyboardMode(input) {
    const type = input.type.toLowerCase();

    // Numeric inputs get numpad
    if (type === 'number' || type === 'tel') return 'numpad';

    // Check input pattern or inputmode
    if (input.inputMode === 'numeric' || input.inputMode === 'decimal') return 'numpad';

    // Check for numeric class
    if (input.classList.contains('numeric-input')) return 'numpad';

    // Default to full keyboard
    return 'keyboard';
  }

  /**
   * Check if device has touch input
   * @returns {boolean}
   */
  isTouchDevice() {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  }

  /**
   * Observe DOM for new inputs
   */
  observeDOM() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            // Check if node is an input
            if (this.isInputElement(node)) {
              node.addEventListener('focus', this.focusListenerBound);
              node.addEventListener('blur', this.blurListenerBound);
            }

            // Check children
            const inputs = node.querySelectorAll?.('input, textarea');
            inputs?.forEach(input => {
              input.addEventListener('focus', this.focusListenerBound);
              input.addEventListener('blur', this.blurListenerBound);
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.domObserver = observer;
  }

  /**
   * Check if element is an input
   * @param {HTMLElement} element
   * @returns {boolean}
   */
  isInputElement(element) {
    const tagName = element.tagName?.toLowerCase();
    return (
      tagName === 'input' &&
      ['text', 'number', 'tel'].includes(element.type?.toLowerCase())
    ) || tagName === 'textarea';
  }

  /**
   * Enable auto-keyboard
   */
  enable() {
    this.isEnabled = true;
  }

  /**
   * Disable auto-keyboard
   */
  disable() {
    this.isEnabled = false;
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.domObserver) {
      this.domObserver.disconnect();
    }

    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.removeEventListener('focus', this.focusListenerBound);
      input.removeEventListener('blur', this.blurListenerBound);
    });
  }
}

// Global singleton
let autoKeyboardManagerInstance = null;

/**
 * Get global auto keyboard manager instance
 */
export function getAutoKeyboardManager() {
  if (!autoKeyboardManagerInstance) {
    autoKeyboardManagerInstance = new AutoKeyboardManager();
  }
  return autoKeyboardManagerInstance;
}

/**
 * Initialize auto-keyboard system
 * @param {Function} showKeyboardCallback - Callback to show keyboard
 */
export function initializeAutoKeyboard(showKeyboardCallback) {
  const manager = getAutoKeyboardManager();
  manager.initialize(showKeyboardCallback);
  return manager;
}
