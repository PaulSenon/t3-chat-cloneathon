import { type Plugin } from "@opencode-ai/plugin";

// doc: https://opencode.ai/docs/plugins/
export const FileBlockList: Plugin = async () => {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool === "read" && output.args.filePath.includes(".env")) {
        throw new Error("Do not read .env files");
      }
    },
  };
};
