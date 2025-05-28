import { Expo, ExpoPushMessage } from "expo-server-sdk";
import { db } from "../db";
import { notification, users } from "../db/schema";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

interface NotificationOptions {
  title: string;
  message: string;
  type?: string;
}

const expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN,
});

export const sendNotification = async (
  user_id: string,
  options: NotificationOptions
) => {
  // Get user's FCM token
  const user = await db.query.users.findFirst({ where: eq(users.id, user_id) });
  const fcm = user?.fcm_token;

  if (!fcm) {
    console.log("> Notification FCM token not found");
    return { success: false, error: "No FCM token for user" };
  }

  // Prepare Expo message
  const messages: ExpoPushMessage[] = [
    {
      to: fcm,
      sound: "default",
      body: options.message,
      title: options.title,
    },
  ];

  // Send notification
  let expoResult = null;
  try {
    expoResult = await expo.sendPushNotificationsAsync(messages);
    console.log(expoResult);
  } catch (err) {
    console.log("> Error sending notification:");
    return { success: false, error: "Expo notification failed" };
  }

  // Save notification to DB
  await db.insert(notification).values({
    id: nanoid(),
    user_id,
    title: options.title,
    message: options.message,
    type: options.type || null,
    read: false,
    created_at: new Date(),
    updated_at: new Date(),
  });

  return { success: true, expoResult };
};
