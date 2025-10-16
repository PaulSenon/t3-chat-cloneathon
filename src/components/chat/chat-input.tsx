import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputFooter,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputProps,
  PromptInputSpeechButton,
  PromptInputSpeechButtonProps,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTextareaProps,
  PromptInputTools,
} from "../ai-elements/prompt-input";
import { Model } from "@/types/aiModels";
import { ChatStatus } from "ai";

export interface ChatInputProps<TModels extends Model[]> {
  handleSubmit: PromptInputProps["onSubmit"];
  textareaRef: PromptInputTextareaProps["ref"] &
    PromptInputSpeechButtonProps["textareaRef"];
  status?: ChatStatus;
  // TODO blow this line
  handleInputChange: (text: string) => void;
  text: string;
  setModel: (model: TModels[number]["id"]) => void;
  model?: TModels[number]["id"];
  models: TModels;
}

export default function ChatInput<TModels extends Model[]>({
  handleSubmit,
  model,
  models,
  setModel,
  handleInputChange,
  text,
  textareaRef,
  status,
}: ChatInputProps<TModels>) {
  return (
    <PromptInput onSubmit={handleSubmit} className="mt-4" globalDrop multiple>
      <PromptInputBody>
        <PromptInputAttachments>
          {(attachment) => <PromptInputAttachment data={attachment} />}
        </PromptInputAttachments>
        <PromptInputTextarea
          onChange={(e) => handleInputChange(e.target.value)}
          ref={textareaRef}
          value={text}
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools>
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger />
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
          <PromptInputSpeechButton
            onTranscriptionChange={handleInputChange}
            textareaRef={textareaRef}
          />
          {/* <PromptInputButton
            onClick={() => setUseWebSearch(!useWebSearch)}
            variant={useWebSearch ? "default" : "ghost"}
          >
            <GlobeIcon size={16} />
            <span>Search</span>
          </PromptInputButton> */}
          <PromptInputModelSelect
            onValueChange={(value) => {
              setModel(value);
            }}
            value={model}
          >
            <PromptInputModelSelectTrigger>
              <PromptInputModelSelectValue />
            </PromptInputModelSelectTrigger>
            <PromptInputModelSelectContent>
              {models.map((model) => (
                <PromptInputModelSelectItem key={model.id} value={model.id}>
                  {model.name}
                </PromptInputModelSelectItem>
              ))}
            </PromptInputModelSelectContent>
          </PromptInputModelSelect>
        </PromptInputTools>
        <PromptInputSubmit disabled={!text && !status} status={status} />
      </PromptInputFooter>
    </PromptInput>
  );
}
