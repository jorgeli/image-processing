import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

// Create a more resilient Kafka client
const kafka = new Kafka({
  clientId: 'image-processor-consumer',
  brokers: [process.env.KAFKA_BROKER ?? 'kafka:9092'],
  retry: {
    initialRetryTime: 1000,
    retries: 15,
    maxRetryTime: 30000
  },
  connectionTimeout: 10000
});

const consumerTasks = kafka.consumer({
  groupId: 'image-processor-group',
  retry: { retries: 10 }
});


const producerCompleted = kafka.producer({
    allowAutoTopicCreation: false,
    retry: { retries: 10 }
  });

export { kafka, consumerTasks, producerCompleted }; 