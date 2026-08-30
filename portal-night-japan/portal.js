const V = window.SAMPLE_VENUES || [];
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const uniq = (k) =>
  [...new Set(V.flatMap((v) => (Array.isArray(v[k]) ? v[k] : [v[k]])))].filter(Boolean);
function ageGate() {
  const key = "axlabo_agegate_nightlife_v1",
    gate = document.getElementById("ageGate");
  if (!gate) return;
  const verified = () => {
      try {
        return localStorage.getItem(key) === "1";
      } catch {
        return false;
      }
    },
    closeGate = () => {
      gate.hidden = true;
      document.body.classList.remove("locked");
    };
  if (verified()) closeGate();
  else {
    document.body.classList.add("locked");
    document.getElementById("ageYes").focus();
  }
  document.getElementById("ageYes").addEventListener("click", () => {
    try {
      localStorage.setItem(key, "1");
    } catch {
      // プライベートブラウジング等でlocalStorageが使用不可でも致命的ではないため無視
    }
    closeGate();
  });
  document.getElementById("ageNo").addEventListener("click", () => {
    const denied = document.getElementById("ageDenied");
    Array.from(denied.parentNode.children).forEach((el) => {
      if (el !== denied) el.hidden = true;
    });
    denied.hidden = false;
  });
  gate.querySelectorAll("[data-age-lang]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const lang = btn.dataset.ageLang;
      gate
        .querySelectorAll("[data-age-lang]")
        .forEach((x) => x.classList.toggle("active", x === btn));
      gate.querySelectorAll("[data-ja][data-en]").forEach((el) => {
        el.textContent = el.dataset[lang];
      });
    }),
  );
}
function shell() {
  document
    .querySelectorAll("[data-year]")
    .forEach((x) => (x.textContent = new Date().getFullYear()));
  const sticky = document.createElement("div");
  sticky.className = "mobile-sticky-cta";
  sticky.innerHTML = '<a class="btn" href="../lp-codex-v2-refined-2026-08-24.html">掲載について相談する</a>';
  document.body.insertBefore(sticky, document.getElementById("ageGate"));
  ageGate();
}
function venueImages(v) {
  const images = Array.isArray(v.images) ? v.images.filter(Boolean) : [];
  return images.length ? images : [v.image].filter(Boolean);
}
function carouselMarkup(v, variant = "card") {
  const images = venueImages(v);
  const multiple = images.length > 1;
  const label = variant === "detail" ? `${v.venueName}の写真ギャラリー` : `${v.venueName}の写真`;
  return `<div class="image-carousel${multiple ? " has-multiple" : ""}" data-images='${esc(JSON.stringify(images))}' data-index="0" aria-label="${esc(label)}"><img src="${esc(images[0] || "")}" loading="lazy" alt="${esc(v.venueName)}">${multiple ? `<span class="photo-count" aria-label="写真${images.length}枚">📷 ${images.length}</span><button class="carousel-arrow prev" type="button" data-carousel-step="-1" aria-label="前の写真">‹</button><button class="carousel-arrow next" type="button" data-carousel-step="1" aria-label="次の写真">›</button><div class="carousel-dots" aria-label="写真を選択">${images.map((_, i) => `<button type="button" data-carousel-index="${i}" class="${i === 0 ? "active" : ""}" aria-label="${i + 1}枚目の写真" aria-current="${i === 0 ? "true" : "false"}"></button>`).join("")}</div>` : ""}</div>`;
}
function updateCarousel(carousel, index) {
  const images = JSON.parse(carousel.dataset.images || "[]");
  if (!images.length) return;
  const next = (index + images.length) % images.length;
  carousel.dataset.index = String(next);
  carousel.querySelector("img").src = images[next];
  carousel.querySelectorAll("[data-carousel-index]").forEach((dot, i) => {
    dot.classList.toggle("active", i === next);
    dot.setAttribute("aria-current", i === next ? "true" : "false");
  });
}
document.addEventListener("click", (event) => {
  const control = event.target.closest("[data-carousel-step], [data-carousel-index]");
  if (!control) return;
  const carousel = control.closest(".image-carousel");
  if (!carousel) return;
  const current = Number(carousel.dataset.index || 0);
  updateCarousel(carousel, control.dataset.carouselIndex === undefined ? current + Number(control.dataset.carouselStep) : Number(control.dataset.carouselIndex));
});
function card(v) {
  return `<article class="card"><div class="image">${carouselMarkup(v)}</div><div class="card-body"><span class="sample">SAMPLE</span><h3>${esc(v.venueName)}</h3><div class="meta">${esc(v.sampleNote)}</div><p class="meta">${esc(v.city)} / ${esc(v.region)} · ${esc(v.category)}</p><p><span class="price">${esc(v.priceTier)}</span> · ${esc(v.openingHours)}</p><div class="tags">${v.features
    .slice(0, 3)
    .map((x) => `<span class="tag">${esc(x)}</span>`)
    .join(
      "",
    )}</div><div class="card-actions"><a class="btn" href="venue-detail.html?id=${encodeURIComponent(v.id)}">詳細を見る</a><a class="btn secondary" href="${esc(v.website)}" aria-label="${esc(v.venueName)}の公式サイトへ">店舗の公式サイトへ</a></div></div></article>`;
}
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let cardObserver;
function revealCards(root = document) {
  const cards = root.querySelectorAll(".card:not([data-reveal-ready])");
  if (reducedMotion() || !("IntersectionObserver" in window)) {
    cards.forEach((card) => card.classList.add("is-visible"));
    return;
  }
  cardObserver ??= new IntersectionObserver(
    (entries, observer) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }),
    { threshold: 0.12 },
  );
  cards.forEach((card) => {
    card.dataset.revealReady = "";
    cardObserver.observe(card);
  });
}
function render(list, target = "venue-list") {
  const box = document.getElementById(target);
  if (!box) return;
  box.innerHTML = list.map(card).join("");
  revealCards(box);
  const count = document.getElementById("result-count");
  if (count) count.textContent = `${list.length}件のSAMPLE店舗`;
  document.getElementById("empty")?.classList.toggle("show", list.length === 0);
}
function addOptions(id, vals) {
  const el = document.getElementById(id);
  if (!el) return;
  vals.forEach((v) =>
    el.insertAdjacentHTML("beforeend", `<option value="${esc(v)}">${esc(v)}</option>`),
  );
}
function setupFilters() {
  addOptions("country", uniq("country"));
  addOptions("city", uniq("city"));
  addOptions("region", uniq("region"));
  addOptions("category", uniq("category"));
  addOptions("priceTier", uniq("priceTier"));
  addOptions("language", uniq("languagesSupported"));
  addOptions("atmosphere", uniq("atmosphereStyle"));
  addOptions("feature", uniq("features"));
  const params = new URLSearchParams(location.search);
  document.querySelectorAll("[data-filter]").forEach((el) => {
    if (params.has(el.id)) el.value = params.get(el.id);
    el.addEventListener(el.tagName === "INPUT" ? "input" : "change", applyFilters);
  });
  applyFilters();
}
function applyFilters() {
  const get = (id) => (document.getElementById(id)?.value || "").trim().toLowerCase();
  const q = get("keyword"),
    hours = get("hours");
  const list = V.filter((v) => {
    const text = [
      v.venueName,
      v.category,
      v.country,
      v.region,
      v.city,
      v.address,
      v.descriptionJa,
      v.descriptionEn,
      ...v.languagesSupported,
      ...v.atmosphereStyle,
      ...v.features,
    ]
      .join(" ")
      .toLowerCase();
    return (
      (!q || text.includes(q)) &&
      (!get("country") || v.country.toLowerCase() === get("country")) &&
      (!get("city") || v.city.toLowerCase() === get("city")) &&
      (!get("region") || v.region.toLowerCase() === get("region")) &&
      (!get("category") || v.category.toLowerCase() === get("category")) &&
      (!get("priceTier") || v.priceTier.toLowerCase() === get("priceTier")) &&
      (!hours || v.openingHours.toLowerCase().includes(hours)) &&
      (!get("language") || v.languagesSupported.some((x) => x.toLowerCase() === get("language"))) &&
      (!get("atmosphere") ||
        v.atmosphereStyle.some((x) => x.toLowerCase() === get("atmosphere"))) &&
      (!get("feature") || v.features.some((x) => x.toLowerCase() === get("feature")))
    );
  });
  render(list);
  const summary = document.getElementById("query-summary");
  if (summary) {
    const active = [
      q && `キーワード「${q}」`,
      ...[
        "country",
        "city",
        "region",
        "category",
        "priceTier",
        "hours",
        "language",
        "atmosphere",
        "feature",
      ].map((id) => get(id) && `${id}: ${get(id)}`),
    ].filter(Boolean);
    summary.textContent = active.length ? active.join(" / ") : "条件指定なし — 全SAMPLE店舗を表示";
  }
}
function home() {
  render(V.slice(0, 4), "pickup-list");
  document.getElementById("hero-search")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const p = new URLSearchParams(new FormData(e.currentTarget));
    location.href = "search-results.html?" + p;
  });
}
function filtersMarkup() {
  const selectField = ([id, l]) =>
    `<div class="field"><label for="${id}">${l}</label><select id="${id}" data-filter><option value="">すべて</option></select></div>`;
  const basic = [
    ["country", "国"],
    ["city", "都市"],
    ["region", "エリア"],
  ];
  const detail = [
    ["category", "カテゴリ"],
    ["priceTier", "価格帯"],
    ["language", "対応言語"],
    ["atmosphere", "雰囲気"],
    ["feature", "特徴"],
  ];
  return `<div class="field"><label for="keyword">キーワード</label><input id="keyword" data-filter placeholder="店名・特徴"></div><p class="filter-group-label">基本条件</p>${basic.map(selectField).join("")}<p class="filter-group-label">詳細条件</p>${detail.map(selectField).join("")}<div class="field"><label for="hours">営業時間（キーワード）</label><input id="hours" data-filter placeholder="例: 19:00 / 金"></div>`;
}
function injectFilters() {
  const x = document.getElementById("filters");
  if (x) x.innerHTML = filtersMarkup();
  setupFilters();
}
function detail() {
  const id = new URLSearchParams(location.search).get("id") || "sample-001";
  const v = V.find((x) => x.id === id) || V[0],
    root = document.getElementById("detail");
  if (!root) return;
  root.dataset.venue = id;
  const draw = (lang) => {
    const en = lang === "en";
    root.innerHTML = `<section class="detail-hero"><div class="wrap"><span class="sample">SAMPLE</span><div class="langs"><button data-lang="ja" class="${en ? "" : "active"}">日本語</button><button data-lang="en" class="${en ? "active" : ""}">English</button></div><h1>${esc(v.venueName)}</h1><p>${esc(v.sampleNote)} / ${esc(v.category)} · ${esc(v.city)}, ${esc(v.region)}</p></div></section><section class="section"><div class="wrap detail-grid"><div class="detail-image">${carouselMarkup(v, "detail")}</div><div><p class="kicker">${en ? "Venue overview" : "店舗情報"}</p><h2>${en ? "About this sample venue" : "このSAMPLE店舗について"}</h2><p>${esc(en ? v.descriptionEn : v.descriptionJa)}</p><div class="detail-facts"><div class="fact"><small>${en ? "Category" : "カテゴリ"}</small>${esc(v.category)}</div><div class="fact"><small>${en ? "Area / Address" : "エリア・住所"}</small>${esc(v.address)}</div><div class="fact"><small>${en ? "Opening Hours" : "営業時間"}</small>${esc(en ? v.openingHoursEn : v.openingHours)}</div><div class="fact"><small>${en ? "Age information" : "年齢情報"}</small>${esc(en ? v.ageRequirementEn : v.ageRequirement)}</div><div class="fact"><small>${en ? "Price information" : "料金情報"}</small><span class="price">${esc(en ? v.priceInformationEn : v.priceInformation)}</span></div><div class="fact"><small>${en ? "Languages" : "対応言語"}</small>${v.languagesSupported.map(esc).join(" / ")}</div></div><h3>${en ? "Features" : "特徴"}</h3><div class="tags">${(en ? v.featuresEn : v.features).map((x) => `<span class="tag">${esc(x)}</span>`).join("")}</div><p class="muted">${esc(en ? v.notesEn : v.notes)}</p><div class="official"><b>${en ? "Contact the venue directly" : "店舗へ直接お問い合わせください"}</b><p>${en ? "AXLABO lists information only. Contact and visit arrangements are handled on the venue’s own official site." : "AXLABOは情報掲載のみを行います。お問い合わせ・来店に関する調整は、掲載店舗の公式サイトで直接ご確認ください。"}</p><a class="btn" href="${esc(v.website)}">${en ? "Go to the venue’s official site" : "店舗の公式サイトへ"}</a></div></div></div></section><section class="section soft"><div class="wrap detail-grid"><div><p class="kicker">ACCESS</p><h2>${en ? "Area information" : "アクセス情報"}</h2><p>${esc(v.address)}</p><p class="muted">${en ? "Detailed address is hidden because this is sample data." : "サンプルのため詳細住所は非表示です。"}</p></div><div class="map">${en ? "Map (hidden for sample data)" : "地図（サンプルのため非表示）"}</div></div></section>`;
    root.querySelectorAll("[data-lang]").forEach((b) => (b.onclick = () => draw(b.dataset.lang)));
  };
  draw("ja");
}
function groupPage(kind) {
  const params = new URLSearchParams(location.search);
  if (kind === "area") {
    const city = params.get("city"),
      region = params.get("region"),
      selected = city || region || uniq("region")[0],
      key = city ? "city" : "region";
    document.getElementById("group-title").textContent = selected;
    document.getElementById("group-chips").innerHTML = `<b>Region</b>${uniq("region")
      .map((x) => `<a class="chip" href="?region=${encodeURIComponent(x)}">${esc(x)}</a>`)
      .join("")}<b>City</b>${uniq("city")
      .map((x) => `<a class="chip" href="?city=${encodeURIComponent(x)}">${esc(x)}</a>`)
      .join("")}`;
    render(V.filter((v) => v[key] === selected));
    return;
  }
  const key = "category",
    selected = params.get(key) || uniq(key)[0];
  document.getElementById("group-title").textContent = selected;
  document.getElementById("group-chips").innerHTML = uniq(key)
    .map((x) => `<a class="chip" href="?${key}=${encodeURIComponent(x)}">${esc(x)}</a>`)
    .join("");
  render(V.filter((v) => v[key] === selected));
}
document.addEventListener("DOMContentLoaded", () => {
  shell();
  const p = document.body.dataset.page;
  if (p === "home") home();
  if (p === "venues" || p === "search") injectFilters();
  if (p === "detail") detail();
  if (p === "area" || p === "category") groupPage(p);
});
