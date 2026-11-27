// GET /api/health — quick check that the API is deployed and configured.
// Never returns the key itself.
export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    model: process.env.GEMINI_MODEL || 'gemini-3.7-flash',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY)
  });
}
