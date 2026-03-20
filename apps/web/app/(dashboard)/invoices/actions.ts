"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  isInvoiceStatus,
  type InvoiceFormState,
} from "@/lib/invoices/types";
import {
  buildInvoiceFormState,
  buildInvoiceFormValues,
  getInvoiceAmountCents,
  getInvoiceDueAtIso,
  validateInvoice,
} from "@/lib/invoices/validation";

export async function createInvoiceAction(
  leadId: string,
  _previousState: InvoiceFormState,
  formData: FormData,
) {
  const values = buildInvoiceFormValues(formData);
  const errors = validateInvoice(values);

  if (Object.keys(errors).length > 0) {
    return buildInvoiceFormState(values, errors);
  }

  const amountCents = getInvoiceAmountCents(values);
  if (!amountCents) {
    return buildInvoiceFormState(values, { amount: "Enter a valid amount." });
  }

  const dueAt = getInvoiceDueAtIso(values);
  if (!dueAt) {
    return buildInvoiceFormState(values, { dueDate: "Enter a valid due date." });
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("create_invoice", {
    p_amount_cents: amountCents,
    p_due_at: dueAt,
    p_external_payment_link: values.externalPaymentLink || null,
    p_lead_id: leadId,
    p_note: values.note || null,
    p_send_now: values.sendNow,
  });

  if (error) {
    return buildInvoiceFormState(
      values,
      { form: error.message ?? "Unable to create the invoice right now." },
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/invoices");
  revalidatePath(`/leads/${leadId}`);

  return buildInvoiceFormState(
    undefined,
    {},
    values.sendNow
      ? "Invoice created and queued for sending."
      : "Invoice created as a draft.",
  );
}

export async function updateInvoiceStatusAction(formData: FormData) {
  const invoiceId = String(formData.get("invoiceId") ?? "").trim();
  const nextStatus = String(formData.get("status") ?? "").trim();
  const leadId = String(formData.get("leadId") ?? "").trim();

  if (!invoiceId || !isInvoiceStatus(nextStatus)) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("update_invoice_status", {
    p_invoice_id: invoiceId,
    p_status: nextStatus,
  });

  if (error) {
    throw new Error(`Unable to update the invoice status: ${error.message}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/invoices");

  if (leadId) {
    revalidatePath(`/leads/${leadId}`);
  }
}
