import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';
dotenv.config();

// Get timeout values from environment or use defaults
const connectionTimeout = parseInt(process.env.KAFKA_CONNECTION_TIMEOUT ?? '10000', 10);
const requestTimeout = parseInt(process.env.KAFKA_REQUEST_TIMEOUT ?? '30000', 10);

// Create a more resilient Kafka client
const kafka = new Kafka({
  clientId: 'image-processor-producer',
  brokers: [process.env.KAFKA_BROKER ?? 'kafka:9092'],
  retry: {
    initialRetryTime: 1000,
    retries: 15,
    maxRetryTime: 30000
  },
  connectionTimeout,
  requestTimeout
});

// Create a single producer instance
const produceTask = kafka.producer({
  allowAutoTopicCreation: false,
  retry: {
    initialRetryTime: 100,
    retries: 3
  }
});

// Create a single consumer instance with default session timeout
const consumerCompleted = kafka.consumer({
  groupId: 'image-completed-group',
  retry: {
    initialRetryTime: 100,
    retries: 3
  },
  // Updated values to match Kafka broker defaults
  sessionTimeout: 30000,  // Default Kafka value (30 seconds)
  heartbeatInterval: 3000, // 1/10 of session timeout
  rebalanceTimeout: 30000,
  maxWaitTimeInMs: 1000
});

const topicTasks = process.env.KAFKA_IMAGE_TASK_TOPIC ?? 'image-tasks';
const topicCompleted = process.env.KAFKA_IMAGE_COMPLETED_TOPIC ?? 'image-completed';

// Export only the clients and topic names
export { 
  kafka, 
  produceTask, 
  consumerCompleted, 
  topicTasks, 
  topicCompleted
};