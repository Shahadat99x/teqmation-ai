import {
  emptyFollowUpFormValues,
  isFollowUpChannel,
  type FollowUpFormErrors,
  type FollowUpFormState,
  type FollowUpFormValues,
} from "@/lib/follow-ups/types";

function cleanValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeUtcInput(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.endsWith("Z")
    ? trimmed
    : `${trimmed.length === 16 ? `${trimmed}:00` : trimmed}Z`;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function buildFollowUpFormValues(
  formData: FormData,
  overrides?: Partial<FollowUpFormValues>,
): FollowUpFormValues {
  return {
    dueAt: cleanValue(formData.get("dueAt")),
    channel: cleanValue(formData.get("channel")) || emptyFollowUpFormValues.channel,
    templateName: cleanValue(formData.get("templateName")),
    note: cleanValue(formData.get("note")),
    ...overrides,
  };
}

export function buildFollowUpFormState(
  values?: Partial<FollowUpFormValues>,
  errors: FollowUpFormErrors = {},
  message?: string,
): FollowUpFormState {
  return {
    values: {
      ...emptyFollowUpFormValues,
      ...values,
    },
    errors,
    message,
  };
}

export function validateFollowUp(values: FollowUpFormValues) {
  const errors: FollowUpFormErrors = {};
  const dueDate = normalizeUtcInput(values.dueAt);
  const minimumDueTime = Date.now() - 5 * 60 * 1000;

  if (!values.dueAt) {
    errors.dueAt = "Choose when this reminder should be due.";
  } else if (!dueDate) {
    errors.dueAt = "Enter a valid due date and time.";
  } else if (dueDate.getTime() < minimumDueTime) {
    errors.dueAt = "Choose a reminder time that is current or upcoming.";
  }

  if (!isFollowUpChannel(values.channel)) {
    errors.channel = "Choose a valid reminder channel.";
  }

  if (values.templateName.length > 120) {
    errors.templateName = "Keep the reminder label under 120 characters.";
  }

  if (values.note.length > 1000) {
    errors.note = "Keep notes under 1000 characters.";
  }

  return errors;
}

export function getFollowUpDueAtIso(values: FollowUpFormValues) {
  const dueDate = normalizeUtcInput(values.dueAt);

  return dueDate?.toISOString() ?? null;
}
