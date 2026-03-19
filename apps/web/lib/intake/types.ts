export type WorkspaceContext = {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  memberRole: string;
};

export type PublicWorkspace = {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
};

export type LeadRecord = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  desired_destination: string | null;
  intake_term: string | null;
  message: string | null;
  source: string;
  created_at: string;
  current_stage: {
    id: string;
    name: string;
  } | null;
};

export type ActivityRecord = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  created_at: string;
  metadata_json: Record<string, unknown>;
};

export type LeadDashboardOverview = {
  workspace: WorkspaceContext;
  totalLeads: number;
  publicInquiryCount: number;
  manualLeadCount: number;
  newThisWeekCount: number;
  recentLeads: LeadRecord[];
};

export type LeadFormValues = {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  desiredDestination: string;
  intakeTerm: string;
  message: string;
  source: string;
};

export type LeadFormErrors = Partial<
  Record<keyof LeadFormValues | "form", string>
>;

export type LeadFormState = {
  values: LeadFormValues;
  errors: LeadFormErrors;
  message?: string;
};

export const emptyLeadFormValues: LeadFormValues = {
  fullName: "",
  email: "",
  phone: "",
  country: "",
  desiredDestination: "",
  intakeTerm: "",
  message: "",
  source: "",
};
