import { Kafka, logLevel } from 'kafkajs';
import { createServiceLogger } from '../utils/logger.js';

const logger = createServiceLogger('kafka-client');

const DEFAULT_RETRY_OPTIONS = {
  maxRetries: 3,
  initialRetryTime: 300,
  retryFactor: 2,
};

/**
 * Enhanced KafkaClient with Dead Letter Queue (DLQ) support.
 *
 * Usage:
 *   const client = new KafkaClient({ clientId: 'my-service', brokers: ['kafka:29092'] });
 *   await client.connect();
 *   await client.publish('my-topic', { ... });
 */
export class KafkaClient {
  /**
   * @param {object} options
   * @param {string}   options.clientId    - Unique client identifier.
   * @param {string[]} options.brokers     - Kafka broker addresses.
   * @param {string}   [options.dlqSuffix] - Suffix appended to topic name for DLQ. Default: '.dlq'.
   * @param {object}   [options.retry]     - KafkaJS retry configuration.
   */
  constructor({ clientId, brokers, dlqSuffix = '.dlq', retry = DEFAULT_RETRY_OPTIONS }) {
    this.clientId = clientId;
    this.dlqSuffix = dlqSuffix;
    this.kafka = new Kafka({
      clientId,
      brokers,
      logLevel: logLevel.WARN,
      retry,
    });
    this._producer = null;
    this._consumers = new Map();
  }

  /** Connect the producer. */
  async connect() {
    this._producer = this.kafka.producer();
    await this._producer.connect();
    logger.info(`[${this.clientId}] Producer connected`);
  }

  /** Disconnect producer and all consumers. */
  async disconnect() {
    if (this._producer) {
      await this._producer.disconnect();
      this._producer = null;
    }
    for (const [groupId, consumer] of this._consumers) {
      await consumer.disconnect();
      logger.info(`[${this.clientId}] Consumer (${groupId}) disconnected`);
    }
    this._consumers.clear();
  }

  /**
   * Publish a message to a Kafka topic.
   *
   * @param {string} topic   - Target topic.
   * @param {object} message - Message payload (will be JSON-serialised).
   * @param {string} [key]   - Optional partition key.
   */
  async publish(topic, message, key) {
    if (!this._producer) {
      throw new Error('Producer not connected – call connect() first');
    }
    const value = JSON.stringify({ ...message, timestamp: new Date().toISOString() });
    await this._producer.send({
      topic,
      messages: [{ key: key ?? null, value }],
    });
    logger.info(`[${this.clientId}] Published to ${topic}`);
  }

  /**
   * Send a message directly to the DLQ for a given topic.
   *
   * @param {string} originalTopic - The topic the message originated from.
   * @param {object} message       - Original message payload.
   * @param {Error}  error         - The error that caused the DLQ routing.
   */
  async publishToDlq(originalTopic, message, error) {
    const dlqTopic = `${originalTopic}${this.dlqSuffix}`;
    await this.publish(dlqTopic, {
      originalTopic,
      originalMessage: message,
      error: { message: error.message, stack: error.stack },
      failedAt: new Date().toISOString(),
    });
    logger.warn(`[${this.clientId}] Message routed to DLQ: ${dlqTopic}`);
  }

  /**
   * Subscribe to topics and process each message.
   * Failed messages (after exhausting retries) are routed to the DLQ.
   *
   * @param {string}   groupId         - Consumer group identifier.
   * @param {string[]} topics          - Topics to subscribe to.
   * @param {Function} handler         - async (topic, payload) => void
   * @param {object}   [options]
   * @param {number}   [options.maxRetries=3] - Max in-process handler retries before DLQ.
   */
  async subscribe(groupId, topics, handler, { maxRetries = 3 } = {}) {
    const consumer = this.kafka.consumer({ groupId });
    await consumer.connect();
    this._consumers.set(groupId, consumer);

    for (const topic of topics) {
      await consumer.subscribe({ topic, fromBeginning: false });
    }

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        let payload;
        try {
          payload = JSON.parse(message.value.toString());
        } catch (parseErr) {
          logger.error(`[${this.clientId}] Failed to parse message from ${topic}: ${parseErr.message}`);
          await this.publishToDlq(topic, message.value.toString(), parseErr);
          return;
        }

        let attempt = 0;
        while (attempt <= maxRetries) {
          try {
            await handler(topic, payload);
            return;
          } catch (handlerErr) {
            attempt += 1;
            if (attempt > maxRetries) {
              logger.error(`[${this.clientId}] Handler failed after ${maxRetries} retries for ${topic}: ${handlerErr.message}`);
              await this.publishToDlq(topic, payload, handlerErr);
            } else {
              const delay = Math.pow(2, attempt) * 100;
              logger.warn(`[${this.clientId}] Retrying ${topic} (attempt ${attempt}/${maxRetries}) in ${delay}ms`);
              await new Promise((res) => setTimeout(res, delay));
            }
          }
        }
      },
    });

    logger.info(`[${this.clientId}] Consumer (${groupId}) subscribed to [${topics.join(', ')}]`);
  }
}

export default KafkaClient;
