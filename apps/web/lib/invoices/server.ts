import { cache } from "react";

import { getWorkspaceContext } from "@/lib/intake/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getInvoiceDisplayStatus,
  isOpenInvoiceStatus,
  type InvoiceDashboardOverview,
  type InvoiceListOverview,
  type InvoiceRecord,
} from "@/lib/invoices/types";

type RawInvoiceRecord = Omit<InvoiceRecord, "lead"> & {
  lead:
    | {
        id: string;
        full_name: string;
        email: string | null;
        source: string;
      }[]
    | {
        id: string;
        full_name: string;
        email: string | null;
        source: string;
      }
    | null;
};

function normalizeInvoiceRecord(invoice: RawInvoiceRecord): InvoiceRecord {
  const lead = Array.isArray(invoice.lead) ? invoice.lead[0] ?? null : invoice.lead;

  return {
    ...invoice,
    lead,
  };
}

function getInvoiceCounts(invoices: InvoiceRecord[]) {
  let openCount = 0;
  let overdueCount = 0;
  let paidCount = 0;
  let draftCount = 0;
  let sentCount = 0;
  let viewedCount = 0;
  let cancelledCount = 0;

  for (const invoice of invoices) {
    const displayStatus = getInvoiceDisplayStatus(invoice);

    if (isOpenInvoiceStatus(displayStatus)) {
      openCount += 1;
    }

    if (displayStatus === "overdue") {
      overdueCount += 1;
    }

    if (displayStatus === "paid") {
      paidCount += 1;
    }

    if (invoice.status === "draft") {
      draftCount += 1;
    }

    if (invoice.status === "sent") {
      sentCount += 1;
    }

    if (invoice.status === "viewed") {
      viewedCount += 1;
    }

    if (invoice.status === "cancelled") {
      cancelledCount += 1;
    }
  }

  return {
    openCount,
    overdueCount,
    paidCount,
    draftCount,
    sentCount,
    viewedCount,
    cancelledCount,
  };
}

export async function listInvoices(): Promise<InvoiceListOverview> {
  const workspace = await getWorkspaceContext();
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, lead_id, invoice_number, amount_cents, due_at, status, external_payment_link, note, send_requested_at, email_sent_at, last_reminder_sent_at, viewed_at, paid_at, created_at, updated_at, lead:leads(id, full_name, email, source)",
    )
    .order("due_at", { ascending: true })
    .limit(100);

  if (error) {
    throw new Error(`Unable to load invoices: ${error.message}`);
  }

  const invoices = ((data ?? []) as RawInvoiceRecord[]).map(normalizeInvoiceRecord);
  const counts = getInvoiceCounts(invoices);

  return {
    workspace,
    invoices,
    ...counts,
  };
}

export async function getLeadInvoices(leadId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, lead_id, invoice_number, amount_cents, due_at, status, external_payment_link, note, send_requested_at, email_sent_at, last_reminder_sent_at, viewed_at, paid_at, created_at, updated_at, lead:leads(id, full_name, email, source)",
    )
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load lead invoices: ${error.message}`);
  }

  return ((data ?? []) as RawInvoiceRecord[]).map(normalizeInvoiceRecord);
}

export const getInvoiceDashboardOverview = cache(
  async (): Promise<InvoiceDashboardOverview> => {
    await getWorkspaceContext();
    const supabase = await createServerSupabaseClient();
    const now = new Date().toISOString();

    const [openResult, paidResult, overdueResult, overdueListResult] = await Promise.all([
      supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .in("status", ["draft", "sent", "viewed", "overdue"]),
      supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("status", "paid"),
      supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .in("status", ["draft", "sent", "viewed", "overdue"])
        .lte("due_at", now),
      supabase
        .from("invoices")
        .select(
          "id, lead_id, invoice_number, amount_cents, due_at, status, external_payment_link, note, send_requested_at, email_sent_at, last_reminder_sent_at, viewed_at, paid_at, created_at, updated_at, lead:leads(id, full_name, email, source)",
        )
        .in("status", ["draft", "sent", "viewed", "overdue"])
        .lte("due_at", now)
        .order("due_at", { ascending: true })
        .limit(6),
    ]);

    if (openResult.error) {
      throw new Error(`Unable to load open invoices: ${openResult.error.message}`);
    }

    if (paidResult.error) {
      throw new Error(`Unable to load paid invoices: ${paidResult.error.message}`);
    }

    if (overdueResult.error) {
      throw new Error(`Unable to load overdue invoices: ${overdueResult.error.message}`);
    }

    if (overdueListResult.error) {
      throw new Error(`Unable to load overdue invoice list: ${overdueListResult.error.message}`);
    }

    return {
      openCount: openResult.count ?? 0,
      paidCount: paidResult.count ?? 0,
      overdueCount: overdueResult.count ?? 0,
      overdueInvoices: ((overdueListResult.data ?? []) as RawInvoiceRecord[]).map(
        normalizeInvoiceRecord,
      ),
    };
  },
);
