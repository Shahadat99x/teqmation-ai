import type {
  InvoiceFormErrors,
  InvoiceFormState,
  InvoiceFormValues,
} from "@/lib/invoices/types";
import { emptyInvoiceFormValues } from "@/lib/invoices/types";

export function buildInvoiceFormValues(formData?: FormData): InvoiceFormValues {
  if (!formData) {
    return emptyInvoiceFormValues;
  }

  return {
    amount: String(formData.get("amount") ?? "").trim(),
    dueDate: String(formData.get("dueDate") ?? "").trim(),
    externalPaymentLink: String(formData.get("externalPaymentLink") ?? "").trim(),
    note: String(formData.get("note") ?? "").trim(),
    sendNow: formData.get("sendNow") === "on",
  };
}

export function buildInvoiceFormState(
  values: InvoiceFormValues = emptyInvoiceFormValues,
  errors: InvoiceFormErrors = {},
  message?: string,
): InvoiceFormState {
  return {
    values,
    errors,
    message,
  };
}

export function validateInvoice(values: InvoiceFormValues): InvoiceFormErrors {
  const errors: InvoiceFormErrors = {};

  if (!values.amount) {
    errors.amount = "Amount is required.";
  } else if (!/^\d+(\.\d{1,2})?$/.test(values.amount)) {
    errors.amount = "Enter a valid amount with up to 2 decimal places.";
  } else if ((parseFloat(values.amount) || 0) <= 0) {
    errors.amount = "Amount must be greater than zero.";
  }

  if (!values.dueDate) {
    errors.dueDate = "Due date is required.";
  } else if (!getInvoiceDueAtIso(values)) {
    errors.dueDate = "Enter a valid due date.";
  }

  if (values.externalPaymentLink) {
    try {
      const url = new URL(values.externalPaymentLink);

      if (!["http:", "https:"].includes(url.protocol)) {
        errors.externalPaymentLink = "Payment link must start with http or https.";
      }
    } catch {
      errors.externalPaymentLink = "Enter a valid payment link.";
    }
  }

  if (values.note.length > 600) {
    errors.note = "Note must be 600 characters or fewer.";
  }

  return errors;
}

export function getInvoiceAmountCents(values: Pick<InvoiceFormValues, "amount">) {
  if (!values.amount || !/^\d+(\.\d{1,2})?$/.test(values.amount)) {
    return null;
  }

  return Math.round(parseFloat(values.amount) * 100);
}

export function getInvoiceDueAtIso(values: Pick<InvoiceFormValues, "dueDate">) {
  if (!values.dueDate) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(values.dueDate);
  if (!match) {
    return null;
  }

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const date = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}
