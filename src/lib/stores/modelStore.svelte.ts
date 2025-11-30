export type ModelType = 'claude-haiku-4-5' | 'gpt-4o-mini';

export interface ModelConfig {
  id: ModelType;
  label: string;
  provider: 'anthropic' | 'openai';
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: 'claude-haiku-4-5',
    label: 'Claude Haiku 4.5',
    provider: 'anthropic',
  },
  {
    id: 'gpt-4o-mini',
    label: 'GPT-4o Mini',
    provider: 'openai',
  },
];

const MODEL_STORAGE_KEY = 'selectedModel';

export const modelState = $state<{ selectedModel: ModelType }>({
  selectedModel: 'claude-haiku-4-5',
});

export const loadModelFromStorage = () => {
  if (typeof window === 'undefined') return;

  const storedModel = localStorage.getItem(MODEL_STORAGE_KEY) as ModelType | null;
  if (storedModel && AVAILABLE_MODELS.some((m) => m.id === storedModel)) {
    modelState.selectedModel = storedModel;
  }
};

export const setSelectedModel = (model: ModelType) => {
  if (AVAILABLE_MODELS.some((m) => m.id === model)) {
    modelState.selectedModel = model;
    if (typeof window !== 'undefined') {
      localStorage.setItem(MODEL_STORAGE_KEY, model);
    }
  }
};

export const getSelectedModel = () => modelState.selectedModel;
