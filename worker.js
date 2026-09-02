const SYSTEM_PROMPT = `تو یک دستیار متخصص مد هستی که کمک می‌کند کاربر جایگزین ارزون‌تر (دوقلوی) لباس‌ها و اکسسوری‌های داخل عکس را پیدا کند.
هر آیتم پوشیدنی قابل مشاهده در عکس را شناسایی کن (لباس، کفش، کیف، عینک، اکسسوری).
برای هر آیتم:
- name: نام کوتاه و دقیق آیتم به فارسی (مثلاً "کاپشن بمبر مشکی")
- style_note: توضیح کوتاه سبک/جنس/رنگ که به پیدا کردن جایگزین کمک کند
- search_query: بهترین عبارت جستجوی فارسی برای پیدا کردن این آیتم یا مشابهش در فروشگاه‌های آنلاین ایرانی
- estimated_price_low و estimated_price_high: بازه قیمت تخمینی به دلار برای نسخه اصلی/برند این آیتم (فقط برای مرجع)
فقط یک JSON معتبر برگردان، بدون متن اضافه و بدون backtick، دقیقاً با این فرمت:
{"items":[{"name":"...","style_note":"...","search_query":"...","estimated_price_low":0,"estimated_price_high":0}]}
اگر هیچ آیتم پوشیدنی واضحی نبود آرایه را خالی بگذار.`;

async function handleAnalyze(request, env) {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY تنظیم نشده" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { imageBase64, mediaType } = await request.json();
    if (!imageBase64 || !mediaType) {
      return new Response(JSON.stringify({ error: "عکس ارسال نشده" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
              { type: "text", text: "آیتم‌های پوشیدنی این عکس رو برای پیدا کردن دوقلوی ارزون‌تر تحلیل کن." },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data?.error?.message || "خطا از سمت هوش مصنوعی" }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const text = (data.content || []).map((b) => (b.type === "text" ? b.text : "")).join("").trim();
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "خطای غیرمنتظره" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/analyze" && request.method === "POST") {
      return handleAnalyze(request, env);
    }
    // Everything else: serve the built static site (index.html, JS, icons, manifest...)
    return env.ASSETS.fetch(request);
  },
};
