import { createServiceLogger } from '../utils/logger.js';

const logger = createServiceLogger('event-audit');

/**
 * In-memory event audit trail.
 *
 * For production deployments, replace the in-memory store with a persistent
 * backend (e.g. MongoDB, PostgreSQL, or a dedicated audit topic in Kafka).
 */
const auditLog = [];

/**
 * Record a processed event in the audit trail.
 *
 * @param {object} entry
 * @param {string}  entry.eventType     - Kafka topic / event type.
 * @param {string}  entry.eventId       - Unique event identifier (UUID).
 * @param {string}  entry.correlationId - Correlation ID for distributed tracing.
 * @param {string}  entry.source        - Originating service.
 * @param {string}  entry.status        - 'processed' | 'failed' | 'dlq'.
 * @param {string}  [entry.error]       - Error message if status is 'failed' or 'dlq'.
 * @param {object}  [entry.metadata]    - Additional context (userId, tenantId, etc.).
 */
export function recordEvent({ eventType, eventId, correlationId, source, status, error, metadata = {} }) {
  const entry = {
    eventType,
    eventId,
    correlationId,
    source,
    status,
    error: error ?? null,
    metadata,
    auditedAt: new Date().toISOString(),
  };

  auditLog.push(entry);

  if (status === 'failed' || status === 'dlq') {
    logger.warn(`[audit] ${status.toUpperCase()} – ${eventType} (${eventId}) – ${error}`);
  } else {
    logger.info(`[audit] ${status.toUpperCase()} – ${eventType} (${eventId})`);
  }

  return entry;
}

/**
 * Retrieve audit entries, optionally filtered.
 *
 * @param {object}  [filter]
 * @param {string}  [filter.eventType]     - Filter by event type.
 * @param {string}  [filter.correlationId] - Filter by correlation ID.
 * @param {string}  [filter.status]        - Filter by status.
 * @param {number}  [filter.limit=100]     - Maximum number of entries to return.
 * @returns {object[]}
 */
export function getAuditLog({ eventType, correlationId, status, limit = 100 } = {}) {
  let results = [...auditLog];

  if (eventType) results = results.filter((e) => e.eventType === eventType);
  if (correlationId) results = results.filter((e) => e.correlationId === correlationId);
  if (status) results = results.filter((e) => e.status === status);

  return results.slice(-limit);
}

/**
 * Clear the in-memory audit log (useful in tests).
 */
export function clearAuditLog() {
  auditLog.length = 0;
}

export default { recordEvent, getAuditLog, clearAuditLog };
