/**
 * Wait for a condition to be true with polling
 */
export interface WaitForOptions {
  /** Polling interval in milliseconds (default: 100) */
  interval?: number;
  /** Timeout in milliseconds (default: 5000) */
  timeout?: number;
}

/**
 * Waits for a condition function to return true
 * @param condition Function that returns true/false or a Promise that resolves to true/false
 * @param options Configuration options for polling interval and timeout
 * @returns Promise that resolves when condition is met or rejects on timeout
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: WaitForOptions = {},
): Promise<void> {
  const { interval = 100, timeout = 5000 } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const result = await condition();
      if (result) {
        return;
      }
    } catch (error) {
      // Continue polling even if condition throws
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`waitFor timeout after ${timeout}ms`);
}
