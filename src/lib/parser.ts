import superjson from "superjson";
import { Message } from "ai";

export function parseMessages(messages: string): Message[] {
  try {
    return superjson.parse(messages);
  } catch (e) {
    console.error("error parsing messages", e);
    console.log("messages", messages);
    throw e;
  }
}
