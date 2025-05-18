import { Expo, ExpoPushMessage } from "expo-server-sdk";
import { db } from "../db";
import { notification } from "../db/schema";
import { nanoid } from "nanoid";
interface Options {
  fcm?: string;
  title: string;
  message: string;
  //   type:""
}

const expo = new Expo({});

export const sendNotification = async (user_id: string, options: Options) => {
  try {
    const messages: ExpoPushMessage[] = [];
    const isValidToken = !Expo.isExpoPushToken(options?.fcm);
    if (isValidToken && options.fcm) {
      messages.push({
        to: options.fcm,
        sound: "default",
        body: options.message,
        title: options.title,
        // data: { withSome: "data" },
        // richContent: {
        //   image: "https://example.com/statics/some-image-here-if-you-want.jpg",
        // },
      });
      await expo
        .sendPushNotificationsAsync(messages)
        .catch((err) => console.log("EXPO: notification failed"));
    }
    const notificationId = nanoid();
    await db.insert(notification).values({
      id: notificationId,
      user_id,
      title: options.title,
      message: options.message,
    });
  } catch (error) {
    console.log("NOTIFICATION: notification failed");
  }
};
