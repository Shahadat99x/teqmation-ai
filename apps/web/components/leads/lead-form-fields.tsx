import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { LeadFormErrors, LeadFormValues } from "@/lib/intake/types";

type LeadFormFieldsProps = {
  errors: LeadFormErrors;
  showSource: boolean;
  sourceReadOnly?: boolean;
  values: LeadFormValues;
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-rose-600">{message}</p>;
}

export function LeadFormFields({
  errors,
  showSource,
  sourceReadOnly = false,
  values,
}: LeadFormFieldsProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="fullName">
            Full name
          </label>
          <Input
            defaultValue={values.fullName}
            id="fullName"
            name="fullName"
            placeholder="Ariana Malik"
            required
          />
          <FieldError message={errors.fullName} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            Email
          </label>
          <Input
            defaultValue={values.email}
            id="email"
            name="email"
            placeholder="student@example.com"
            type="email"
          />
          <FieldError message={errors.email} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="phone">
            Phone
          </label>
          <Input
            defaultValue={values.phone}
            id="phone"
            name="phone"
            placeholder="+44 7000 000000"
          />
          <FieldError message={errors.phone} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="country">
            Country
          </label>
          <Input
            defaultValue={values.country}
            id="country"
            name="country"
            placeholder="Pakistan"
          />
          <FieldError message={errors.country} />
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="desiredDestination"
          >
            Desired destination
          </label>
          <Input
            defaultValue={values.desiredDestination}
            id="desiredDestination"
            name="desiredDestination"
            placeholder="United Kingdom"
          />
          <FieldError message={errors.desiredDestination} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="intakeTerm">
            Intake term
          </label>
          <Input
            defaultValue={values.intakeTerm}
            id="intakeTerm"
            name="intakeTerm"
            placeholder="Fall 2026"
          />
          <FieldError message={errors.intakeTerm} />
        </div>
      </div>

      {showSource ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="source">
            Source
          </label>
          <Input
            defaultValue={values.source}
            id="source"
            name="source"
            placeholder="Website, Referral, Walk-in"
            readOnly={sourceReadOnly}
          />
          <FieldError message={errors.source} />
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="message">
          Message
        </label>
        <Textarea
          defaultValue={values.message}
          id="message"
          name="message"
          placeholder="Inquiry details, context, or notes..."
        />
        <FieldError message={errors.message} />
      </div>
    </div>
  );
}

