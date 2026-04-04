/**
 * @typedef {Object} UserPayload
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {string} role - 'customer' | 'organizer' | 'admin'
 */

/**
 * @typedef {Object} KafkaMessage
 * @property {string} eventId
 * @property {string} userId
 * @property {string} timestamp
 * @property {Object} data
 */

/**
 * @typedef {Object} PaginationMeta
 * @property {number} total
 * @property {number} page
 * @property {number} limit
 * @property {number} totalPages
 */

export {};
