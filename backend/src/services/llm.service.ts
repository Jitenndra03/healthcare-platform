import Groq from 'groq-sdk';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── FALLBACK RESPONSES (used when LLM fails) ─────────────────────────────────
const PRE_VISIT_FALLBACK = {
  urgency: 'Medium' as const,
  chief_complaint: 'Patient-reported symptoms (AI summary unavailable)',
  suggested_questions: [
    'Can you describe your symptoms in more detail?',
    'When did your symptoms first appear?',
    'Do you have any relevant medical history or allergies?',
  ],
  generated: false,
};

const POST_VISIT_FALLBACK = (notes: string) =>
  notes
    ? `Your doctor's visit is complete. Please refer to the clinical notes and follow your prescribed treatment plan. Contact your doctor if symptoms worsen.`
    : 'Post-visit summary unavailable. Please contact your doctor for details.';

// ─── PRE-VISIT SUMMARY ────────────────────────────────────────────────────────
export async function generatePreVisitSummary(symptoms: string) {
  if (!symptoms.trim()) return PRE_VISIT_FALLBACK;

  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `You are a clinical assistant. Analyse the following patient-reported symptoms and return a JSON object with exactly these fields:
- urgency: "Low" | "Medium" | "High"
- chief_complaint: string (one sentence, plain English, max 20 words)
- suggested_questions: string[] (exactly 3 questions the doctor should ask)

Return ONLY valid JSON. No explanation, no markdown code fences.

Symptoms: ${symptoms}`,
      }],
    });

    const text = response.choices[0]?.message?.content ?? '';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

    return {
      urgency: parsed.urgency ?? 'Medium',
      chief_complaint: parsed.chief_complaint ?? PRE_VISIT_FALLBACK.chief_complaint,
      suggested_questions: parsed.suggested_questions ?? PRE_VISIT_FALLBACK.suggested_questions,
      generated: true,
    };
  } catch (err) {
    console.error('[LLM] Pre-visit summary failed:', err);
    return PRE_VISIT_FALLBACK; // System does NOT break
  }
}

// ─── POST-VISIT SUMMARY ───────────────────────────────────────────────────────
export async function generatePostVisitSummary(clinicalNotes: string): Promise<string> {
  if (!clinicalNotes.trim()) return POST_VISIT_FALLBACK('');

  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `You are a patient communication specialist. Convert the following clinical notes into a patient-friendly summary. Use simple language — no medical jargon.

Structure your response in exactly 3 sections:
1. What happened during your visit (2-3 sentences)
2. Your medications (name, dose, when to take — use a simple list)
3. Follow-up steps and warning signs to watch for

Clinical notes: ${clinicalNotes}`,
      }],
    });

    return response.choices[0]?.message?.content ?? POST_VISIT_FALLBACK(clinicalNotes);
  } catch (err) {
    console.error('[LLM] Post-visit summary failed:', err);
    return POST_VISIT_FALLBACK(clinicalNotes); // System does NOT break
  }
}
