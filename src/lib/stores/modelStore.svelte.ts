export type ModelType = "claude-haiku-4-5" | "gpt-4o-mini" | "deepseek-chat";

export interface ModelConfig {
  id: ModelType;
  label: string;
  provider: "anthropic" | "openai" | "deepseek";
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: "claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    provider: "anthropic",
  },
  {
    id: "gpt-4o-mini",
    label: "GPT-4o Mini",
    provider: "openai",
  },
  {
    id: "deepseek-chat",
    label: "DeepSeek Chat",
    provider: "deepseek",
  },
];

const DEFAULT_MODEL: ModelType = "claude-haiku-4-5";

const MODEL_STORAGE_KEY = "model";

export const modelState = $state<{ model: ModelType }>({
  model: DEFAULT_MODEL,
});

export const loadModelFromStorage = () => {
  const storedModel = localStorage.getItem(
    MODEL_STORAGE_KEY,
  ) as ModelType | null;
  if (storedModel && AVAILABLE_MODELS.some((m) => m.id === storedModel)) {
    modelState.model = storedModel;
  }
};

export const setSelectedModel = (model: ModelType) => {
  if (AVAILABLE_MODELS.some((m) => m.id === model)) {
    modelState.model = model;
    localStorage.setItem(MODEL_STORAGE_KEY, model);
  }
};

export const getSelectedModel = () => modelState.model;
