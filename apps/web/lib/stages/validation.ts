import type { StageChangeFormState } from "@/lib/stages/types";

function cleanValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export function buildStageChangeFormState(
  selectedStageId = "",
  error?: string,
  message?: string,
): StageChangeFormState {
  return {
    selectedStageId,
    error,
    message,
  };
}

export function getSelectedStageId(formData: FormData) {
  return cleanValue(formData.get("stageId"));
}
