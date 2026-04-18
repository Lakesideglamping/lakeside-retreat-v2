const PII_FIELDS = new Set(["email", "phone", "guest_email"]);

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  return `${local.slice(0, 2)}***@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `***${digits.slice(-4)}`;
}

export function redactPII(data: Record<string, unknown>): Record<string, unknown> {
  const clone: Record<string, unknown> = { ...data };
  for (const key of Object.keys(clone)) {
    const value = clone[key];
    if (typeof value !== "string") continue;
    if (key === "phone") {
      clone[key] = maskPhone(value);
    } else if (PII_FIELDS.has(key)) {
      clone[key] = maskEmail(value);
    }
  }
  return clone;
}
