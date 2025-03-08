import dotenv from 'dotenv';
import sharp from 'sharp';
import { minioClient, bucketUpload, bucketCompleted } from './config/minio.js';
import { consumerTasks, producerCompleted, topicTasks, topicCompleted } from './config/kafka.js';
import os from 'os';
import { KafkaCompleteImageDtoType, KafkaProcessImageDtoType } from 'shared-schemas';


dotenv.config();

async function sendMessage(message: KafkaCompleteImageDtoType, topic: string) {
  try {
    await producerCompleted.send({
      topic: topic,
      messages: [{ key: message.uuid, value: JSON.stringify(message) }],
    });
  }catch (error) {
    console.error('Error sending message to Kafka:', error);
  }
}


async function resizeImage(
  bucketUpload: string, bucketCompleted: string, 
  topicCompleted: string, imageData: KafkaProcessImageDtoType) 
{
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Starting image processing for ${imageData.uuid}`);
  
  try {
    console.log(`[${new Date().toISOString()}] Fetching image from MinIO bucket ${bucketUpload}`);
    const imageStream = await minioClient.getObject(bucketUpload, imageData.uuid);
    console.log(`[${new Date().toISOString()}] Image fetched from MinIO, time: ${Date.now() - startTime}ms`);
    
    // Convert stream to buffer
    const bufferStartTime = Date.now();
    const chunks: Buffer[] = [];
    for await (const chunk of imageStream) {
      chunks.push(Buffer.from(chunk));
    }
    const image = sharp(Buffer.concat(chunks));
    console.log(`[${new Date().toISOString()}] Image loaded into buffer, time: ${Date.now() - bufferStartTime}ms`);
    
    // Resize image with sharp
    const resizeStartTime = Date.now();
    const resizedImage = await image.resize(100, 100).toBuffer();
    console.log(`[${new Date().toISOString()}] Image resized, time: ${Date.now() - resizeStartTime}ms`);
    
    // Save resized image back to MinIO
    const uploadStartTime = Date.now();
    await minioClient.putObject(bucketCompleted, imageData.uuid, resizedImage);
    console.log(`[${new Date().toISOString()}] Resized image saved to MinIO, time: ${Date.now() - uploadStartTime}ms`);

    // Send completion message
    const messageStartTime = Date.now();
    const message  = {
      uuid: imageData.uuid,
      success: true,
      processingTime: Date.now() - imageData.startTime
    }
    await sendMessage(message, topicCompleted);
    console.log(`[${new Date().toISOString()}] Completion message sent to Kafka, time: ${Date.now() - messageStartTime}ms`);
    console.log(`[${new Date().toISOString()}] Total worker processing time: ${Date.now() - startTime}ms`);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error processing image:`, error);
    const message  = {
      uuid: imageData.uuid,
      success: false,
      processingTime: Date.now() - imageData.startTime, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    await sendMessage(message, topicCompleted);
    throw error;
  }
}

async function main() {
  try {



    // Connect to the Kafka broker
    await consumerTasks.connect();
    await producerCompleted.connect();
    
    console.log(`Consumer ${os.hostname()} connected to Kafka`);
    
    // Subscribe to the topic
    await consumerTasks.subscribe({ topic: topicTasks, fromBeginning: true });
    console.log(`Subscribed to topic: ${topicTasks}`);
    
    // Start consuming messages
    await consumerTasks.run({
      eachMessage: async ({ topic, partition, message }) => {
        const messageReceivedTime = Date.now();
        console.log(`[${new Date().toISOString()}] Received message from topic: ${topic} - partition: ${partition}`);
        
        const key = message.key?.toString();
        const value = message.value?.toString();
        
        console.log('------------------------------');
        console.log(`Key: ${key}`);
        
        if (value) {
          try {
            // Parse the JSON message
            const imageData = JSON.parse(value) as KafkaProcessImageDtoType;
            console.log(`[${new Date().toISOString()}] Processing image: ${JSON.stringify(imageData, null, 2)}`);
            console.log(`[${new Date().toISOString()}] Message delay: ${messageReceivedTime - imageData.startTime}ms`);
            
            // Add your image processing logic here
            await resizeImage(bucketUpload, bucketCompleted, topicCompleted, imageData);
          } catch (err) {
            console.error('Error parsing message:', err);
          }
        }
      }
    });
    
  } catch (error) {
    console.error('Error in Kafka consumer:', error);
    process.exit(1);
  }
}

// Start the consumer
main(); 