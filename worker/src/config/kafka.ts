import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

// Create a more resilient Kafka client
const kafka = new Kafka({
  clientId: 'image-processor-consumer',
  brokers: [process.env.KAFKA_BROKER ?? 'kafka:9092'],
  retry: {
    initialRetryTime: 1000,
    retries: 5,
    maxRetryTime: 10000
  },
  connectionTimeout: 5000
});

const consumer = kafka.consumer({
  groupId: 'image-processor-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  rebalanceTimeout: 30000,
  retry: {
    initialRetryTime: 100,
    retries: 5,
    maxRetryTime: 3000
  }
});

const producerCompleted = kafka.producer({
  allowAutoTopicCreation: false,
  retry: { initialRetryTime: 100, retries: 3 }
});

export const consumerTasks = kafka.consumer({
  groupId: 'image-processor-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  rebalanceTimeout: 30000,
  retry: {
    initialRetryTime: 100,
    retries: 5
  }
});

export const topicTasks = process.env.KAFKA_IMAGE_TASK_TOPIC ?? 'undefined';
export const topicCompleted = process.env.KAFKA_IMAGE_COMPLETED_TOPIC ?? 'undefined';

export { kafka, consumer, producerCompleted }; 