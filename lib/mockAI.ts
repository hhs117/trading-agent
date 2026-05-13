import type { Copywriting, ImageReview, Language } from "./types";

/**
 * Minimal product shape the mock AI calls care about. Compatible with both
 * the legacy `Product` (which has `name + category + targetCountries`) and
 * the new `MockProduct` (which uses `targetMarket` for the same idea).
 */
export interface AIProductContext {
  name: string;
  category: string;
  /** ISO country codes the product targets, e.g. ["TH","VN"]. */
  targetMarket: string[];
}

const TITLE_TEMPLATES: Record<Language, (name: string) => string> = {
  en: (name) => `[Hot Sale] ${name} - Premium Quality, Fast Shipping, Free Gift!`,
  th: (name) => `[ขายดี] ${name} คุณภาพดี ส่งไว มีของแถม!`,
  vi: (name) => `[Bán Chạy] ${name} - Chất Lượng Cao, Giao Hàng Nhanh, Tặng Quà!`,
  id: (name) => `[Terlaris] ${name} - Kualitas Premium, Pengiriman Cepat, Gratis Hadiah!`,
  ms: (name) => `[Laris] ${name} - Kualiti Premium, Penghantaran Pantas, Hadiah Percuma!`,
};

const BULLET_TEMPLATES: Record<Language, string[]> = {
  en: [
    "✓ Premium materials, durable for daily use",
    "✓ Trendy design loved by Gen Z buyers",
    "✓ Lightweight & portable, easy to carry",
    "✓ Free local shipping, 7-day delivery",
    "✓ 30-day money-back guarantee, shop with confidence",
  ],
  th: [
    "✓ วัสดุพรีเมียม ทนทานต่อการใช้งาน",
    "✓ ดีไซน์ทันสมัย ที่วัยรุ่นชอบ",
    "✓ น้ำหนักเบา พกพาสะดวก",
    "✓ จัดส่งฟรีในประเทศ ภายใน 7 วัน",
    "✓ รับประกันคืนเงิน 30 วัน",
  ],
  vi: [
    "✓ Chất liệu cao cấp, bền bỉ theo thời gian",
    "✓ Thiết kế thời trang, hợp Gen Z",
    "✓ Nhẹ và gọn, dễ mang theo",
    "✓ Miễn phí giao hàng nội địa, 7 ngày",
    "✓ Bảo hành đổi trả 30 ngày",
  ],
  id: [
    "✓ Bahan premium, tahan lama untuk pemakaian harian",
    "✓ Desain trendy yang disukai Gen Z",
    "✓ Ringan & portabel, mudah dibawa",
    "✓ Gratis ongkir lokal, 7 hari sampai",
    "✓ Garansi uang kembali 30 hari",
  ],
  ms: [
    "✓ Bahan premium, tahan lama untuk kegunaan harian",
    "✓ Reka bentuk trendi disukai Gen Z",
    "✓ Ringan & mudah alih",
    "✓ Penghantaran tempatan percuma dalam 7 hari",
    "✓ Jaminan wang dikembalikan 30 hari",
  ],
};

const DESC_TEMPLATES: Record<Language, (name: string) => string> = {
  en: (name) =>
    `Discover the all-new ${name}, designed for modern Southeast Asian lifestyles. Made with premium materials and tested for durability, this product is perfect whether you are at home, at work, or on the go. Join 10,000+ happy customers across the region. Limited stock - order today and enjoy free shipping!`,
  th: (name) =>
    `ค้นพบ ${name} รุ่นใหม่ล่าสุด ออกแบบเพื่อไลฟ์สไตล์คนรุ่นใหม่ในเอเชียตะวันออกเฉียงใต้ ผลิตจากวัสดุพรีเมียมที่ผ่านการทดสอบความทนทาน เหมาะสำหรับใช้ที่บ้าน ที่ทำงาน หรือเดินทาง ลูกค้ากว่า 10,000 คนพึงพอใจ สั่งวันนี้ส่งฟรี!`,
  vi: (name) =>
    `Khám phá ${name} hoàn toàn mới, được thiết kế cho lối sống hiện đại Đông Nam Á. Làm từ chất liệu cao cấp, kiểm định độ bền. Phù hợp cho gia đình, công sở hay du lịch. Hơn 10.000 khách hàng hài lòng. Đặt ngay, miễn phí vận chuyển!`,
  id: (name) =>
    `Temukan ${name} terbaru, dirancang untuk gaya hidup modern Asia Tenggara. Dibuat dengan bahan premium dan teruji ketahanan. Cocok di rumah, kantor, maupun bepergian. Bergabunglah dengan 10.000+ pelanggan puas. Pesan sekarang, gratis ongkir!`,
  ms: (name) =>
    `Temui ${name} terbaru yang direka untuk gaya hidup moden Asia Tenggara. Diperbuat daripada bahan premium dan diuji ketahanan. Sesuai di rumah, pejabat atau dalam perjalanan. Sertai 10,000+ pelanggan berpuas hati. Pesan hari ini, percuma penghantaran!`,
};

const KEYWORD_TEMPLATES: Record<Language, (name: string, category: string) => string[]> = {
  en: (name, cat) => [name.toLowerCase(), cat, "best seller", "trending 2026", "free shipping", "premium quality"],
  th: (name, cat) => [name, cat, "ขายดี", "มาแรง", "ส่งฟรี", "ของแท้"],
  vi: (name, cat) => [name, cat, "bán chạy", "hot trend", "freeship", "chính hãng"],
  id: (name, cat) => [name.toLowerCase(), cat, "terlaris", "viral", "gratis ongkir", "original"],
  ms: (name, cat) => [name.toLowerCase(), cat, "terlaris", "trending", "penghantaran percuma", "berkualiti"],
};

export async function generateCopywriting(
  product: AIProductContext,
  language: Language
): Promise<Copywriting> {
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 600));
  return {
    language,
    title: TITLE_TEMPLATES[language](product.name),
    bullets: BULLET_TEMPLATES[language],
    description: DESC_TEMPLATES[language](product.name),
    keywords: KEYWORD_TEMPLATES[language](product.name, product.category),
  };
}

export async function reviewImage(
  imageUrl: string,
  product: AIProductContext
): Promise<ImageReview> {
  await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
  const seed = imageUrl.length + product.name.length;
  return {
    imageUrl,
    hasChinese: seed % 3 === 0,
    isCluttered: seed % 4 === 0,
    hasSellingPoint: seed % 2 === 0,
    localizationTip:
      product.targetMarket.length > 0
        ? `针对 ${product.targetMarket.join(", ")} 市场，建议使用当地模特或场景，并将文字替换为目标语言。`
        : "建议根据目标市场的审美调整配色与排版。",
    ctrTip:
      "主图建议突出价格优势（如划线价 + 折扣徽章）、加入「Free Shipping」「Best Seller」等点击吸引元素，并保证主体占比 ≥ 60%。",
  };
}
