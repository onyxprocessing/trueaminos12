/**
 * Throttling utility to limit frequency of requests
 */

// Store last execution times by key
const lastExecutionTimes = new Map<string, number>();

/**
 * Throttle function
 * @param key Unique identifier for this operation
 * @param delayMs Minimum delay between operations in milliseconds
 * @returns Boolean indicating if the operation should proceed
 */
export function shouldThrottle(key: string, delayMs: number = 1000): boolean {
  const now = Date.now();
  const lastExecution = lastExecutionTimes.get(key) || 0;
  
  // If the time since last execution is less than the delay, throttle
  if (now - lastExecution < delayMs) {
    return true;
  }
  
  // Update the last execution time
  lastExecutionTimes.set(key, now);
  return false;
}

// Clean up old keys periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  // More compatible way to iterate through Map entries
  const keys = Array.from(lastExecutionTimes.keys());
  keys.forEach(key => {
    const time = lastExecutionTimes.get(key) || 0;
    if (now - time > 300000) { // 5 minutes
      lastExecutionTimes.delete(key);
    }
  });
}, 60000); // Check every minute