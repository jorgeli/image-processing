const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

function uploadWithCurl(context, events, done) {
  const imageDir = path.join(__dirname, '../fixtures/images-artillery');
  
  // Get a random image
  const files = fs.readdirSync(imageDir)
    .filter(file => /\.(jpg|jpeg|png|gif|webp|svg|avif|tiff)$/i.test(file));
  
  if (files.length === 0) {
    return done(new Error('No image files found'));
  }
  
  const randomFile = files[Math.floor(Math.random() * files.length)];
  const filePath = path.join(imageDir, randomFile);
  
  console.log(`Selected image for curl upload: ${filePath}`);
  
  // Build curl command
  const curlCmd = `curl -s -X POST -F "file=@${filePath}" -F "description=Artillery curl test" http://node-api:5000/api/v1/images/actions/upload`;
  
  // Execute curl
  exec(curlCmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`Curl error: ${error.message}`);
      return done(error);
    }
    
    if (stderr) {
      console.error(`Curl stderr: ${stderr}`);
    }
    
    try {
      // Parse response
      const response = JSON.parse(stdout);
      context.vars.uploadResponse = response;
      console.log(`Uploaded ${randomFile} successfully:`, response);
      return done();
    } catch (e) {
      console.error(`Failed to parse response: ${stdout}`);
      return done(e);
    }
  });
}

module.exports = {
  uploadWithCurl
};