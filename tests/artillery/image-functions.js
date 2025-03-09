const fs = require('fs');
const path = require('path');

function getRandomImage(context, events, done) {
  const imageDir = path.join(__dirname, '../fixtures/images-artillery');
  
  try {
    // Get all image files
    const files = fs.readdirSync(imageDir)
      .filter(file => /\.(jpg|jpeg|png|gif|webp|svg|avif|tiff)$/i.test(file));
    
    if (files.length === 0) {
      return done(new Error('No image files found in ' + imageDir));
    }
    
    // Select a random file
    const randomFile = files[Math.floor(Math.random() * files.length)];
    const filePath = path.join(imageDir, randomFile);
    
    // Set context variables
    context.vars.imagePath = filePath;
    context.vars.imageName = randomFile;
    
    return done();
  } catch (error) {
    console.error('Error in getRandomImage:', error);
    return done(error);
  }
}

module.exports = {
  getRandomImage
};
