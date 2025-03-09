import fetch from 'node-fetch';

const apiUrl = 'http://node-api:5000/api/health';
const maxRetries = 120;
const retryInterval = 1000; // 1 second

async function waitForApi() {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      console.log(`Checking API health (attempt ${retries + 1}/${maxRetries})...`);
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        console.log('API is healthy! Continuing with tests...');
        return true;
      }
    } catch (error: unknown) {
      console.log(`API not ready yet: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    retries++;
    if (retries < maxRetries) {
      console.log(`Waiting ${retryInterval/1000} seconds before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
  }
  
  console.error('API health check failed after maximum retries');
  process.exit(1);
}

// This is the format Vitest expects for globalSetup
export default async function() {
  await waitForApi();
  
  // Return a teardown function (required by Vitest)
  return () => {
    console.log('Global setup teardown - no cleanup needed');
  };
}