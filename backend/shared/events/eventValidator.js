import Joi from 'joi';

/**
 * Base event envelope schema used by all EMS Kafka events.
 * Every event must carry a correlationId for distributed tracing and a
 * monotonically-increasing version number for schema evolution.
 */
const baseEventSchema = Joi.object({
  eventId: Joi.string().uuid().required(),
  eventType: Joi.string().min(1).required(),
  version: Joi.number().integer().min(1).default(1),
  timestamp: Joi.string().isoDate().required(),
  correlationId: Joi.string().uuid().required(),
  source: Joi.string().min(1).required(),
  retryCount: Joi.number().integer().min(0).default(0),
  metadata: Joi.object({
    userId: Joi.string().optional(),
    tenantId: Joi.string().optional(),
  })
    .unknown(true)
    .default({}),
  payload: Joi.object().unknown(true).required(),
});

/** Pre-built schemas for each domain event type. */
const EVENT_SCHEMAS = {
  'ticket-booked': baseEventSchema.keys({
    payload: Joi.object({
      bookingId: Joi.string().required(),
      eventId: Joi.string().required(),
      userId: Joi.string().required(),
      ticketCount: Joi.number().integer().min(1).required(),
      totalAmount: Joi.number().min(0).required(),
    }).required(),
  }),

  'ticket-cancelled': baseEventSchema.keys({
    payload: Joi.object({
      bookingId: Joi.string().required(),
      eventId: Joi.string().required(),
      userId: Joi.string().required(),
      reason: Joi.string().optional(),
    }).required(),
  }),

  'event-created': baseEventSchema.keys({
    payload: Joi.object({
      eventId: Joi.string().required(),
      title: Joi.string().required(),
      organizerId: Joi.string().required(),
      startDate: Joi.string().isoDate().required(),
    }).required(),
  }),

  'event-approved': baseEventSchema.keys({
    payload: Joi.object({
      eventId: Joi.string().required(),
      approvedBy: Joi.string().required(),
    }).required(),
  }),

  'checkin-success': baseEventSchema.keys({
    payload: Joi.object({
      bookingId: Joi.string().required(),
      eventId: Joi.string().required(),
      userId: Joi.string().required(),
      checkedInAt: Joi.string().isoDate().required(),
    }).required(),
  }),

  'review-posted': baseEventSchema.keys({
    payload: Joi.object({
      reviewId: Joi.string().required(),
      eventId: Joi.string().required(),
      userId: Joi.string().required(),
      rating: Joi.number().integer().min(1).max(5).required(),
    }).required(),
  }),
};

/**
 * Validate an event against its registered schema.
 *
 * @param {string} eventType - The Kafka topic / event type identifier.
 * @param {object} event     - The raw event object to validate.
 * @returns {{ value: object, error: Joi.ValidationError|undefined }}
 */
export function validateEvent(eventType, event) {
  const schema = EVENT_SCHEMAS[eventType] ?? baseEventSchema;
  return schema.validate(event, { abortEarly: false, allowUnknown: false });
}

/**
 * Validate and throw if the event is invalid.
 *
 * @param {string} eventType
 * @param {object} event
 * @returns {object} The validated (and potentially default-coerced) event value.
 * @throws {Joi.ValidationError}
 */
export function assertValidEvent(eventType, event) {
  const { value, error } = validateEvent(eventType, event);
  if (error) throw error;
  return value;
}

export { baseEventSchema, EVENT_SCHEMAS };
