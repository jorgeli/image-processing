import { KafkaCompleteImageDtoType, KafkaProcessImageDtoType } from 'shared-schemas';
import { 
  produceTask, 
  consumerCompleted, 
  topicTasks, 
  topicCompleted
} from '../config/kafka.js';
import { ImageDtoType } from "../dtos/image.dto.js";
import { minio } from '../config/minio.js';
import { prisma } from '../config/prisma.js';

export async function sendJobToKafka(imageData: ImageDtoType) {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Sending job to Kafka for image: ${imageData.uuid}`);
  
  // Try to send with retry
  let sent = false;
  let attempts = 0;
  const maxAttempts = 5;
  let lastError;
  
  while (!sent && attempts < maxAttempts) {
    attempts++;
    try {
      // Always try to connect - KafkaJS handles already connected producers gracefully
      console.log(`[${new Date().toISOString()}] Ensuring producer is connected (attempt ${attempts})...`);
      await produceTask.connect();
      console.log(`[${new Date().toISOString()}] Producer connection confirmed`);
      
      const message: KafkaProcessImageDtoType = {
        uuid: imageData.uuid,
        startTime: Date.now()
      };
      
      console.log(`[${new Date().toISOString()}] Sending message to Kafka topic ${topicTasks} (attempt ${attempts})`);
      
      await produceTask.send({
        topic: topicTasks,
        messages: [{ key: imageData.uuid, value: JSON.stringify(message) }],
      });
      
      sent = true;
      console.log(`[${new Date().toISOString()}] Message sent to Kafka successfully (attempt ${attempts}), time: ${Date.now() - startTime}ms`);
    } catch (error) {
      lastError = error;
      console.error(`[${new Date().toISOString()}] Failed to send message (attempt ${attempts}/${maxAttempts}):`, error);
      
      if (attempts < maxAttempts) {
        // Exponential backoff
        const delay = Math.min(100 * Math.pow(2, attempts), 3000); // Max 3 seconds
        console.log(`[${new Date().toISOString()}] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  if (!sent) {
    const errorMsg = `Failed to send job to Kafka after ${maxAttempts} attempts`;
    console.error(`[${new Date().toISOString()}] ${errorMsg}`);
    throw lastError || new Error(errorMsg);
  }
  
  console.log(`[${new Date().toISOString()}] Job sent to Kafka: ${imageData.uuid}, total time: ${Date.now() - startTime}ms`);
  return true;
}

export async function handleCompletion(completion: KafkaCompleteImageDtoType)
{
    const startTime = Date.now();
    console.log(`[${new Date().toISOString()}] handleCompletion ${completion.uuid}`);
    console.log(`[${new Date().toISOString()}] Total processing time reported by worker: ${completion.processingTime}ms`);
    
    //save result to db
    let updateforDB;
    if (completion.success) {
        updateforDB = {
            completedAt: new Date(),
            status : "succeeded"
        }
    }
    else {
        updateforDB = {
            status : "failed"
        }
    }

    const dbStartTime = Date.now();
    await prisma.thumbnailImage.update({
        where: { uuid: completion.uuid },
        data: updateforDB,
    });
    console.log(`[${new Date().toISOString()}] Database updated, time: ${Date.now() - dbStartTime}ms`);

    const cleanupStartTime = Date.now();
    await minio.client.removeObject(minio.uploadBucketName, completion.uuid);
    console.log(`[${new Date().toISOString()}] Removed object ${completion.uuid} from ${minio.uploadBucketName}, time: ${Date.now() - cleanupStartTime}ms`);
    
    console.log(`[${new Date().toISOString()}] Completion handling finished, total time: ${Date.now() - startTime}ms`);
    console.log(completion);
}

// Single initialization function for the entire Kafka system
export async function initializeKafkaSystem(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Initializing Kafka system...`);
  
  try {
    // 1. Connect producer
    console.log(`[${new Date().toISOString()}] Connecting Kafka producer...`);
    await produceTask.connect();
    console.log(`[${new Date().toISOString()}] Kafka producer connected`);
    
    // Add reconnection handlers
    produceTask.on('producer.disconnect', async () => {
      console.error(`[${new Date().toISOString()}] Kafka producer disconnected, attempting to reconnect...`);
      try {
        await produceTask.connect();
        console.log(`[${new Date().toISOString()}] Kafka producer reconnected successfully`);
      } catch (err) {
        console.error(`[${new Date().toISOString()}] Failed to reconnect Kafka producer:`, err);
      }
    });
    
    // 2. Connect consumer
    console.log(`[${new Date().toISOString()}] Connecting Kafka consumer...`);
    await consumerCompleted.connect();
    console.log(`[${new Date().toISOString()}] Kafka consumer connected`);
    
    // 3. Subscribe to completion topic
    await consumerCompleted.subscribe({
      topic: topicCompleted,
      fromBeginning: true
    });
    console.log(`[${new Date().toISOString()}] Subscribed to topic: ${topicCompleted}`);
    
    // 4. Set up the consumer handler
    console.log(`[${new Date().toISOString()}] Setting up Kafka completion listener...`);
    await consumerCompleted.run({
      eachMessage: async ({ message }) => {
        try {
          const value = message.value?.toString();
          if (value) {
            const completion = JSON.parse(value) as KafkaCompleteImageDtoType;
            await handleCompletion(completion);
          }
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Error processing completion message:`, error);
        }
      }
    });
    
    console.log(`[${new Date().toISOString()}] Kafka system initialized successfully`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Failed to initialize Kafka system:`, error);
    throw error;
  }
}