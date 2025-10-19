import {
  UIMessage,
  tool,
  validateUIMessages,
  InferUITools,
  InferUIDataParts,
} from "ai";
import z from "zod";

// helper ts function for type first zod schema definition
// it simply check that the schema is matching out type
// function validatorFor<TIn, TOut = TIn>(schema: StandardSchemaV1<TIn, TOut>) {
//   return schema;
// }

const metadataSchema = z.object({
  modelId: z.string().optional(),
  updatedAt: z.number(),
  createdAt: z.number(),
  liveStatus: z.enum([
    "pending",
    "streaming",
    "completed",
    "error",
    "cancelled",
  ]),
  lifecycleState: z.enum(["active", "archived", "deleted"]),
});
type MetadataSchema = z.infer<typeof metadataSchema>;

const dataSchemas = {
  chart: z.object({
    data: z.array(z.number()),
    labels: z.array(z.string()),
  }),
  image: z.object({
    url: z.url(),
    caption: z.string(),
  }),
};
type DataSchemas = InferUIDataParts<typeof dataSchemas>;

const tools = {
  weather: tool({
    description: "Get weather info",
    inputSchema: z.object({
      location: z.string(),
    }),
    execute: async ({ location }) => `Weather in ${location}: sunny`,
  }),
};
type Tools = InferUITools<typeof tools>;

export type MyUIMessage = UIMessage<MetadataSchema, DataSchemas, Tools>;
export function validateMyUIMessages(messages: unknown) {
  return validateUIMessages<MyUIMessage>({
    messages,
    metadataSchema,
    dataSchemas,
    tools,
  });
}
