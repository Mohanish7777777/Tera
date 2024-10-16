require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const Aria2 = require('aria2-client');
const fs = require('fs');
const path = require('path');

// Initialize the bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Initialize Aria2 client
const aria2 = new Aria2(process.env.ARIA2_HOST);

// Validate user membership
async function isUserMember(ctx) {
    try {
        const member = await ctx.telegram.getChatMember(process.env.FSUB_ID, ctx.from.id);
        return member.status === 'member' || member.status === 'administrator' || member.status === 'owner';
    } catch (error) {
        console.error('Error checking membership status:', error);
        return false;
    }
}

// Command /start
bot.start(async (ctx) => {
    const userMention = ctx.from.first_name;
    const welcomeMessage = `ᴡᴇʟᴄᴏᴍᴇ, ${userMention}.\n\n🌟 ɪ ᴀᴍ ᴀ ᴛᴇʀᴀʙᴏx ᴅᴏᴡɴʟᴏᴀᴅᴇʀ ʙᴏᴛ. sᴇɴᴅ ᴍᴇ ᴀɴʏ ᴛᴇʀᴀʙᴏx ʟɪɴᴋ ɪ ᴡɪʟʟ ᴅᴏᴡɴʟᴏᴀᴅ ᴡɪᴛʜɪɴ ғᴇᴡ sᴇᴄᴏɴᴅs ᴀɴᴅ sᴇɴᴅ ɪᴛ ᴛᴏ ʏᴏᴜ ✨.`;
    
    await ctx.reply(welcomeMessage, Markup.inlineKeyboard([
        Markup.button.url('ᴊᴏɪɴ ❤️🚀', 'https://t.me/MohanishX'),
        Markup.button.url('ᴅᴇᴠᴇʟᴏᴘᴇʀ ⚡️', 'https://t.me/Mohanish7777777')
    ]));

    const videoFilePath = path.join(__dirname, 'Jet-Mirror.mp4');
    if (fs.existsSync(videoFilePath)) {
        await ctx.replyWithVideo({ source: videoFilePath }, { caption: welcomeMessage });
    }
});

// Handle text messages
bot.on('text', async (ctx) => {
    const isMember = await isUserMember(ctx);
    if (!isMember) {
        await ctx.reply('ʏᴏᴜ ᴍᴜsᴛ ᴊᴏɪɴ ᴍʏ ᴄʜᴀɴɴᴇʟ ᴛᴏ ᴜsᴇ ᴍᴇ.', Markup.inlineKeyboard([
            Markup.button.url('ᴊᴏɪɴ ❤️🚀', 'https://t.me/MohanishX')
        ]));
        return;
    }

    const teraboxLink = ctx.message.text.trim();
    const validDomains = [
        'terabox.com', 'nephobox.com', '4funbox.com', 'mirrobox.com', 
        'momerybox.com', 'teraboxapp.com', '1024tera.com', 
        'terabox.app', 'gibibox.com', 'goaibox.com', 
        'terasharelink.com', 'teraboxlink.com'
    ];

    if (!validDomains.some(domain => teraboxLink.includes(domain))) {
        await ctx.reply('ᴘʟᴇᴀsᴇ sᴇɴᴅ ᴀ ᴠᴀʟɪᴅ ᴛᴇʀᴀʙᴏx ʟɪɴᴋ.');
        return;
    }

    const replyMsg = await ctx.reply('sᴇɴᴅɪɴɢ ʏᴏᴜ ᴛʜᴇ ᴍᴇᴅɪᴀ...🤤');

    try {
        const { filePath, thumbnailPath, videoTitle } = await downloadVideo(teraboxLink);
        await uploadVideo(ctx, filePath, thumbnailPath, videoTitle);
    } catch (error) {
        console.error('Error handling message:', error);
        await replyMsg.edit('Api has given a Broken Download Link. Don\'t contact the Owner for this Issue.');
    }
});

// Download video using Aria2
async function downloadVideo(url) {
    const match = /\/s\/([a-zA-Z0-9_-]+)/.exec(url);
    if (!match) {
        throw new Error('Invalid Terabox link');
    }

    const videoId = match[1];
    const response = await axios.get(`https://apis.forn.fun/tera/data.php?id=${videoId}`);
    
    if (!response.data.download) {
        throw new Error('Failed to get download link from API');
    }

    const downloadLink = response.data.download;
    const videoTitle = response.data.name || 'Downloaded Video';
    
    // Start downloading using Aria2
    const { gid } = await aria2.addUri([downloadLink]);

    // Poll for download status
    while (true) {
        const status = await aria2.tellStatus(gid);
        if (status && status.status === 'complete') {
            const filePath = status.files[0].path;
            const thumbnailPath = await downloadThumbnail(response.data.thumbnail);
            return { filePath, thumbnailPath, videoTitle };
        }
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before checking again
    }
}

// Download thumbnail
async function downloadThumbnail(thumbnailUrl) {
    if (!thumbnailUrl) return null;

    const response = await axios.get(thumbnailUrl, { responseType: 'arraybuffer' });
    const thumbnailPath = path.join(__dirname, 'thumbnail.jpg');
    fs.writeFileSync(thumbnailPath, response.data);
    return thumbnailPath;
}

// Upload video to the dump chat
async function uploadVideo(ctx, filePath, thumbnailPath, videoTitle) {
    await ctx.telegram.sendVideo(process.env.DUMP_CHAT_ID, { source: filePath }, {
        caption: `Video uploaded by @${ctx.from.username || ctx.from.first_name}\nTitle: ${videoTitle}`,
        thumb: thumbnailPath
    });
    await ctx.reply('Video uploaded successfully! 🎉');
}

// Start the bot
bot.launch().then(() => {
    console.log('Bot is running...');
}).catch(error => {
    console.error('Error launching the bot:', error);
});
