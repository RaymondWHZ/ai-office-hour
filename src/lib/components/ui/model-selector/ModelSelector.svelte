<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import {
    Root,
    Content,
    Item,
    Trigger,
  } from "$lib/components/ui/select";
  import { AVAILABLE_MODELS, setSelectedModel, getSelectedModel } from "$lib/stores/modelStore.svelte";
  import type { ModelType } from "$lib/stores/modelStore.svelte";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";

  let selectedModel = $state(getSelectedModel());

  const handleValueChange = (value: string) => {
    setSelectedModel(value as ModelType);
    selectedModel = value as ModelType;
  };

  const getModelLabel = (modelId: string) => {
    return AVAILABLE_MODELS.find((m) => m.id === modelId)?.label || modelId;
  };
</script>

<Root type="single" onValueChange={handleValueChange} value={selectedModel}>
  <Trigger class="w-full">
    {getModelLabel(selectedModel)}
  </Trigger>
  <Content>
    {#each AVAILABLE_MODELS as model}
      <Item value={model.id}>
        {model.label}
      </Item>
    {/each}
  </Content>
</Root>
