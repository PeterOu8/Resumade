export function cleanResumeText(text: string) {
  return text
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function redactText(text: string) {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]') //blurs email
    .replace(/\+?\d[\d \-()]{7,}\d/g, '[redacted-phone]') //blurs phone number
    .replace(
      //blurs linkedin
      /(https?:\/\/)?(www\.)?(linkedin\.com\/[^\s]+|lnkd\.in\/[^\s]+)/gi,
      '[redacted-linkedin]'
    );
}

export function estimateTokens(s: string) {
  return Math.ceil((s?.length || 0) / 4);
}
