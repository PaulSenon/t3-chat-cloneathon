import { type Plugin } from "@opencode-ai/plugin";

// doc: https://opencode.ai/docs/plugins/
export const FileBlockList: Plugin = async () => {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool === "read" && output.args.filePath.includes(".env")) {
        throw new Error("Do not read .env files");
      } else if (
        input.tool === "edit" &&
        output.args.filePath.includes("package.json")
      ) {
        throw new Error(
          "Do edit package.json manually. You must use pnpm commands to edit it. (e.g. to install a new dependency etc...)"
        );
      }
    },
  };
};
