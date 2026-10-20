/** Legacy KYC documents may be stored in policyReturn; never render them as policy text. */
export function publicPolicyText(value?: string | null): string | null {
  const text = value?.trim();
  return text && !text.startsWith('{') && !text.startsWith('[') ? text : null;
}
