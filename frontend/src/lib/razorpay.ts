// ─── Razorpay Browser Checkout Helper ────────────────────────────────────────
// Loads the official Razorpay Checkout script once and resolves when
// window.Razorpay is available. Rejects cleanly if the script fails to load.
// No private credentials are handled here — only the public key from the
// backend response may reach this layer.

// TypeScript declaration for the Razorpay Checkout constructor placed on window.
// Only the fields used by this application are declared.

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  handler: (response: RazorpayHandlerResponse) => void;
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    animation?: boolean;
  };
  theme?: {
    color?: string;
  };
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

export interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutInstance {
  open(): void;
  on(event: string, handler: () => void): void;
}

// Augment the global Window interface so TypeScript accepts window.Razorpay.
declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance;
  }
}

const RAZORPAY_CHECKOUT_URL = 'https://checkout.razorpay.com/v1/checkout.js';
const SCRIPT_ID = 'razorpay-checkout-script';

let _loadPromise: Promise<void> | null = null;

/**
 * Loads the Razorpay Checkout browser script exactly once.
 * Subsequent calls return the same Promise.
 *
 * @returns A Promise that resolves when `window.Razorpay` is available,
 *          or rejects if the script fails to load.
 */
export function loadRazorpayScript(): Promise<void> {
  // If window.Razorpay is already present (e.g. HMR / duplicate mount), resolve immediately.
  if (typeof window !== 'undefined' && typeof window.Razorpay === 'function') {
    return Promise.resolve();
  }

  // Return the in-flight promise if a load is already underway.
  if (_loadPromise) {
    return _loadPromise;
  }

  _loadPromise = new Promise<void>((resolve, reject) => {
    // Avoid injecting a duplicate <script> tag if it already exists in the DOM.
    if (document.getElementById(SCRIPT_ID)) {
      // Script tag exists — wait for window.Razorpay to appear (max 5 s).
      const deadline = Date.now() + 5000;
      const poll = setInterval(() => {
        if (typeof window.Razorpay === 'function') {
          clearInterval(poll);
          resolve();
        } else if (Date.now() > deadline) {
          clearInterval(poll);
          reject(new Error('Razorpay Checkout script did not initialise in time.'));
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = RAZORPAY_CHECKOUT_URL;
    script.async = true;

    script.onload = () => {
      if (typeof window.Razorpay === 'function') {
        resolve();
      } else {
        reject(new Error('Razorpay script loaded but window.Razorpay is not available.'));
      }
    };

    script.onerror = () => {
      // Clean up so a retry can re-inject the script.
      script.remove();
      _loadPromise = null;
      reject(new Error('Failed to load Razorpay Checkout script. Check your network connection.'));
    };

    document.body.appendChild(script);
  });

  return _loadPromise;
}
