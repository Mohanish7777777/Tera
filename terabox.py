import os
import requests
from telegram import Update
from telegram.ext import Updater, CommandHandler, CallbackContext

# Replace this with your bot token
TELEGRAM_BOT_TOKEN = '7108727290:AAEWmIXU1Z0lYiZPQBMCgKBrlNAbkY7FP2U'

def start(update: Update, context: CallbackContext) -> None:
    update.message.reply_text('Send me a URL, and I will download the video for you!')

def download_video(update: Update, context: CallbackContext) -> None:
    user_input = update.message.text.strip()
    
    # Construct the download URL
    download_url = f'https://teraboxvideodownloader.nepcoderdevs.workers.dev/?url={user_input}'
    
    try:
        # Request the video content
        response = requests.get(download_url, stream=True)
        
        if response.status_code == 200:
            # Extract the file name from the URL or response
            file_name = user_input.split('/')[-1] + '.mp4'
            
            # Save the video to a local file
            with open(file_name, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            
            # Send the video file to the user
            with open(file_name, 'rb') as f:
                update.message.reply_video(video=f)
            
            # Clean up: remove the file after sending
            os.remove(file_name)
        else:
            update.message.reply_text('Failed to download the video. Please check the URL.')

    except Exception as e:
        update.message.reply_text(f'An error occurred: {str(e)}')

def main() -> None:
    updater = Updater(TELEGRAM_BOT_TOKEN)
    
    dispatcher = updater.dispatcher
    
    # Add handlers
    dispatcher.add_handler(CommandHandler('start', start))
    dispatcher.add_handler(CommandHandler('download', download_video))

    # Start the Bot
    updater.start_polling()
    updater.idle()

if __name__ == '__main__':
    main()
