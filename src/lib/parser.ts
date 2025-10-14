import superjson from "superjson";
import { UIMessage } from "ai";

export function parseMessages(messages: string): UIMessage[] {
  try {
    return superjson.parse(messages);
  } catch (e) {
    console.error("error parsing messages", e);
    console.log("messages", messages);
    throw e;
  }
}
