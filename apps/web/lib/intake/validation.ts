import {
  emptyLeadFormValues,
  type LeadFormErrors,
  type LeadFormState,
  type LeadFormValues,
} from "@/lib/intake/types";

function cleanValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export function buildLeadFormValues(
  formData: FormData,
  overrides?: Partial<LeadFormValues>,
): LeadFormValues {
  return {
    fullName: cleanValue(formData.get("fullName")),
    email: cleanValue(formData.get("email")),
    phone: cleanValue(formData.get("phone")),
    country: cleanValue(formData.get("country")),
    desiredDestination: cleanValue(formData.get("desiredDestination")),
    intakeTerm: cleanValue(formData.get("intakeTerm")),
    message: cleanValue(formData.get("message")),
    source: cleanValue(formData.get("source")),
    ...overrides,
  };
}

export function buildLeadFormState(
  values?: Partial<LeadFormValues>,
  errors: LeadFormErrors = {},
  message?: string,
): LeadFormState {
  return {
    values: {
      ...emptyLeadFormValues,
      ...values,
    },
    errors,
    message,
  };
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateManualLead(values: LeadFormValues) {
  const errors: LeadFormErrors = {};

  if (values.fullName.length < 2) {
    errors.fullName = "Enter the lead's full name.";
  }

  if (!values.email && !values.phone) {
    errors.email = "Add an email address or phone number.";
    errors.phone = "Add a phone number or email address.";
  }

  if (values.email && !isValidEmail(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (values.source.length < 2) {
    errors.source = "Add the intake source.";
  }

  if (values.message.length > 1000) {
    errors.message = "Keep notes under 1000 characters.";
  }

  return errors;
}

export function validatePublicInquiry(values: LeadFormValues) {
  const errors: LeadFormErrors = {};

  if (values.fullName.length < 2) {
    errors.fullName = "Enter your full name.";
  }

  if (!values.email) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (values.message.length > 1000) {
    errors.message = "Keep your message under 1000 characters.";
  }

  return errors;
}
