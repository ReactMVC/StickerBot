const { Telegraf } = require('telegraf');
const fs = require('fs');
const https = require('https');

// Replace with your own bot token
const botToken = 'BOT_TOKEN';
const bot = new Telegraf(botToken);

// Replace with your own Telegram API ID and API Hash
const apiId = 'API_ID';
const apiHash = 'API_HASH';

// Send welcome message to user
bot.start((ctx) => {
  ctx.reply('Welcome to the Sticker to Image Converter Bot!');
});

// Convert sticker to image and send as document
bot.on('sticker', async (ctx) => {
  try {
    // Send in-progress message
    const inProgressMessage = await ctx.reply('Converting sticker to image...');
    
    // Download sticker file from Telegram server
    const stickerFileId = ctx.message.sticker.file_id;
    const stickerFilePath = await bot.telegram.getFileLink(stickerFileId);
    const stickerFileBuffer = await downloadFile(stickerFilePath);
    
    // Convert sticker buffer to image buffer
    const imageBuffer = await convertStickerToImage(stickerFileBuffer);
    
    // Save image buffer to temporary file
    const tempFileName = 'temp.png';
    fs.writeFileSync(tempFileName, imageBuffer);
    
    // Send document to user
    const uploadedMessage = await ctx.replyWithDocument({ source: tempFileName, filename: 'document.png' });
    
    // Remove temporary file
    fs.unlinkSync(tempFileName);
    
    // Send success message
    await ctx.telegram.editMessageText(ctx.chat.id, inProgressMessage.message_id, null, 'Sticker converted to image successfully!');
  } catch (error) {
    console.error(error);
    
    // Send error message
    await ctx.reply('An error occurred while converting the sticker to image!');
  }
});

// Download file from URL and return as buffer
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = [];
      response.on('data', (chunk) => {
        data.push(chunk);
      });
      response.on('end', () => {
        resolve(Buffer.concat(data));
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Convert sticker buffer to image buffer
function convertStickerToImage(stickerBuffer) {
  return new Promise((resolve, reject) => {
    const gm = require('gm').subClass({ imageMagick: true });
    gm(stickerBuffer)
      .setFormat('png')
      .toBuffer((error, buffer) => {
        if (error) {
          reject(error);
        } else {
          resolve(buffer);
        }
      });
  });
}

// Start the bot
bot.launch();