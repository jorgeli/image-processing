import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';
dotenv.config();

// Create a more resilient Kafka client
const kafka = new Kafka({
  clientId: 'image-processor-producer',
  brokers: [process.env.KAFKA_BROKER ?? 'kafka:9092'],
  retry: {
    initialRetryTime: 1000,
    retries: 15,
    maxRetryTime: 30000
  },
  connectionTimeout: 10000
});

// Create a single producer instance
const produceTask = kafka.producer({
  allowAutoTopicCreation: false,
  retry: { retries: 10 }
});

// Create a single consumer instance
const consumerCompleted = kafka.consumer({
  groupId: 'image-completed-group',
  retry: { retries: 10 },
  sessionTimeout: 45000,
  heartbeatInterval: 15000
});

const topicTasks = process.env.KAFKA_IMAGE_TASK_TOPIC ?? '';
const topicCompleted = process.env.KAFKA_IMAGE_COMPLETED_TOPIC ?? '';

// Export only the clients and topic names
export { 
  kafka, 
  produceTask, 
  consumerCompleted, 
  topicTasks, 
  topicCompleted
};