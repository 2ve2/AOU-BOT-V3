import type { Context } from "grammy";
import { Logger } from "@/utils/logger";
import { env } from "@/config/env";

/**
 * Handler for channel posts - automatically captures file IDs when files are sent to the channel
 */
export async function handleChannelPost(ctx: Context) {
  const channelPost = ctx.channelPost;
  
  Logger.info("Channel post handler triggered");
  
  if (!channelPost) {
    Logger.warn("Channel post handler called but no channel post found");
    return;
  }

  const allowedChannelId = env.CHANNEL_ID ? parseInt(env.CHANNEL_ID) : null;
  const chatId = channelPost.chat.id;

  Logger.info(`Channel post received from chat: ${chatId}`);

  // Check if the post is from the allowed channel
  if (allowedChannelId && chatId !== allowedChannelId) {
    Logger.info(`Ignoring channel post from unauthorized channel: ${chatId}`);
    return;
  }

  // Check if the post contains a document
  if ('document' in channelPost && channelPost.document) {
    const document = channelPost.document;
    
    Logger.info(`Document found: ${document.file_name || 'unnamed'}`);
    
    const fileInfo = [
      "📄 *New File Uploaded to Channel!*",
      "",
      `*File ID:* \`${document.file_id}\``,
      document.file_name ? `*File Name:* ${document.file_name}` : "",
      "",
      "💡 *Tap the File ID above to copy it!*"
    ];

    try {
      // Send the file ID to the channel with markdown formatting
      await ctx.reply(fileInfo.filter(Boolean).join("\n"), {
        reply_to_message_id: ctx.channelPost?.message_id,
        parse_mode: "Markdown"
      });
      Logger.info("File ID sent to channel successfully");
    } catch (error) {
      Logger.error("Failed to send file ID to channel", error);
    }
  } else {
    Logger.info("No document found in channel post");
  }
}
