import { createServiceLogger } from '../utils/logger.js';

const logger = createServiceLogger('circuit-breaker');

/** Possible circuit-breaker states. */
export const CircuitState = Object.freeze({
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN',
});

/**
 * Circuit Breaker implementation for service-to-service calls.
 *
 * Transitions:
 *  CLOSED  → OPEN      when failureThreshold consecutive failures occur.
 *  OPEN    → HALF_OPEN after resetTimeout has elapsed.
 *  HALF_OPEN → CLOSED  if the probe request succeeds.
 *  HALF_OPEN → OPEN    if the probe request fails.
 *
 * Usage:
 *   const cb = new CircuitBreaker({ name: 'event-service', failureThreshold: 5 });
 *   const result = await cb.call(() => fetch('http://event-service/health'));
 */
export class CircuitBreaker {
  /**
   * @param {object} options
   * @param {string}  options.name              - Human-readable name for logging.
   * @param {number}  [options.failureThreshold] - Consecutive failures before opening. Default: 5.
   * @param {number}  [options.resetTimeout]    - Ms before attempting HALF_OPEN. Default: 30000.
   * @param {number}  [options.successThreshold] - Successes in HALF_OPEN to return to CLOSED. Default: 1.
   */
  constructor({
    name,
    failureThreshold = 5,
    resetTimeout = 30_000,
    successThreshold = 1,
  }) {
    this.name = name;
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
    this.successThreshold = successThreshold;

    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }

  /**
   * Execute a function protected by the circuit breaker.
   *
   * @param {Function} fn - Async function to execute.
   * @returns {Promise<*>} Result of `fn`.
   * @throws {Error} If circuit is OPEN or `fn` throws.
   */
  async call(fn) {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this._transitionTo(CircuitState.HALF_OPEN);
      } else {
        throw new Error(`Circuit breaker [${this.name}] is OPEN – requests are blocked`);
      }
    }

    try {
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (err) {
      this._onFailure(err);
      throw err;
    }
  }

  /** Return a plain-object snapshot of the current state. */
  getStats() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  _onSuccess() {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount += 1;
      if (this.successCount >= this.successThreshold) {
        this._transitionTo(CircuitState.CLOSED);
      }
    } else {
      this.failureCount = 0;
    }
  }

  _onFailure(err) {
    this.lastFailureTime = Date.now();
    if (this.state === CircuitState.HALF_OPEN) {
      this._transitionTo(CircuitState.OPEN);
      return;
    }
    this.failureCount += 1;
    if (this.failureCount >= this.failureThreshold) {
      this._transitionTo(CircuitState.OPEN);
    }
    logger.warn(`[${this.name}] Failure ${this.failureCount}/${this.failureThreshold}: ${err.message}`);
  }

  _transitionTo(newState) {
    logger.info(`[${this.name}] State transition: ${this.state} → ${newState}`);
    this.state = newState;
    if (newState === CircuitState.CLOSED) {
      this.failureCount = 0;
      this.successCount = 0;
    } else if (newState === CircuitState.HALF_OPEN) {
      this.successCount = 0;
    }
  }
}

/**
 * Retry a function with exponential backoff.
 *
 * @param {Function} fn          - Async function to retry.
 * @param {object}   [options]
 * @param {number}   [options.maxRetries=3]    - Maximum number of retry attempts.
 * @param {number}   [options.baseDelay=200]   - Base delay in ms (doubles each retry).
 * @param {number}   [options.maxDelay=10000]  - Maximum delay cap in ms.
 * @param {Function} [options.shouldRetry]     - (error) => boolean.  Default: always retry.
 * @returns {Promise<*>}
 */
export async function retryWithBackoff(fn, { maxRetries = 3, baseDelay = 200, maxDelay = 10_000, shouldRetry = () => true } = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      if (attempt > maxRetries || !shouldRetry(err)) {
        throw err;
      }
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      logger.warn(`Retry attempt ${attempt}/${maxRetries} in ${delay}ms – ${err.message}`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

export default CircuitBreaker;
