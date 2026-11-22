/** Latest copy-details text from the activity report. The dispute form reads it only on that page. */

let attached = "";

export function setReportAttachment(text: string) {
  attached = text;
}

export function reportAttachment(): string {
  return attached;
}
