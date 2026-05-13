
"use strict";

// ─── Estado Global ───────────────────────────────────
const PRECO = {
  bitcoin:  { brl: null, usd: null, change: null },
  ethereum: { brl: null, usd: null, change: null },
  litecoin: { brl: null, usd: null, change: null },
  tron:     { brl: null, usd: null, change: null },
};

const CHARTS = {};
const HISTORICO = {};

// ─── Utilitários ────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const fmt = (n, decimais = 2) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  }).format(n);

const fmtUSD = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(n);

const fmtNum = (n, casas = 8) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: casas,
  }).format(n);

// ─── Canvas de Estrelas ───────────────────────────────
(function iniciarEstrelas() {
  const canvas = document.getElementById("canvas-estrelas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W, H, estrelas = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    criarEstrelas();
  }

  function criarEstrelas() {
    estrelas = [];
    const n = Math.floor((W * H) / 4000);
    for (let i = 0; i < n; i++) {
      estrelas.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.5 + 0.2,
        op: Math.random(),
        vel: Math.random() * 0.3 + 0.05,
        dir: Math.random() * Math.PI * 2,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const s of estrelas) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(160, 220, 255, ${s.op})`;
      ctx.fill();
      s.op += (Math.random() - 0.5) * 0.02;
      s.op = Math.max(0.05, Math.min(1, s.op));
      s.x += Math.cos(s.dir) * s.vel;
      s.y += Math.sin(s.dir) * s.vel;
      if (s.x < -5) s.x = W + 5;
      if (s.x > W + 5) s.x = -5;
      if (s.y < -5) s.y = H + 5;
      if (s.y > H + 5) s.y = -5;
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  draw();
})();

// ─── Buscar Preços Atuais ────────────────────────────
async function buscarPrecos() {
  try {
    const url =
      "https://api.coingecko.com/api/v3/simple/price" +
      "?ids=bitcoin,ethereum,litecoin,tron" +
      "&vs_currencies=brl,usd" +
      "&include_24hr_change=true";

    const res = await fetch(url);
    if (!res.ok) throw new Error("Falha na API");
    const data = await res.json();

    const mapa = {
      bitcoin:  { brl: "btc-brl", usd: "btc-usd", chg: "btc-change", stat: "stat-btc", card: "card-btc" },
      ethereum: { brl: "eth-brl", usd: "eth-usd", chg: "eth-change", stat: "stat-eth", card: "card-eth" },
      litecoin: { brl: "ltc-brl", usd: "ltc-usd", chg: "ltc-change", stat: "stat-ltc", card: "card-ltc" },
      tron:     { brl: "trx-brl", usd: "trx-usd", chg: "trx-change", stat: null,       card: "card-trx" },
    };

    for (const [id, ids] of Object.entries(mapa)) {
      if (!data[id]) continue;
      const precoBRL = data[id].brl;
      const precoUSD = data[id].usd;
      const change   = data[id].brl_24h_change;

      PRECO[id] = { brl: precoBRL, usd: precoUSD, change };

      // Preço BRL
      const elBRL = document.getElementById(ids.brl);
      if (elBRL) elBRL.textContent = fmt(precoBRL);

      // Preço USD
      const elUSD = document.getElementById(ids.usd);
      if (elUSD) elUSD.textContent = fmtUSD(precoUSD);

      // Variação 24h
      const elChg = document.getElementById(ids.chg);
      if (elChg) {
        const sinal = change >= 0 ? "▲" : "▼";
        elChg.textContent = `${sinal} ${Math.abs(change).toFixed(2)}%`;
        elChg.className = "crypto-change " + (change < 0 ? "negativo" : "");
      }

      // Stat hero
      if (ids.stat) {
        const elStat = document.getElementById(ids.stat);
        if (elStat) {
          const decimais = precoBRL >= 100 ? 0 : 4;
          elStat.textContent = fmt(precoBRL, decimais);
        }
      }
    }

    // Ticker atualizado
    atualizarTicker(data);

    // Hora atualização
    const el = document.getElementById("ultima-atualizacao");
    if (el) {
      const hora = new Date().toLocaleTimeString("pt-BR");
      el.innerHTML = `<span class="pulse-dot"></span> Última atualização: ${hora}`;
    }

    // Conversor
    calcularConversao();

  } catch (err) {
    console.warn("Erro ao buscar preços:", err.message);
    const el = document.getElementById("ultima-atualizacao");
    if (el) el.innerHTML = `<span style="color:var(--red)">⚠ Falha ao conectar à API. Verificando novamente...</span>`;
  }
}

// ─── Ticker ──────────────────────────────────────────
function atualizarTicker(data) {
  const ticker = document.getElementById("ticker");
  if (!ticker) return;

  const moedas = [
    { id: "bitcoin",  nome: "BTC" },
    { id: "ethereum", nome: "ETH" },
    { id: "litecoin", nome: "LTC" },
    { id: "tron",     nome: "TRX" },
  ];

  let html = "";
  for (const m of moedas) {
    if (!data[m.id]) continue;
    const p = data[m.id].brl;
    const c = data[m.id].brl_24h_change;
    const cls = c >= 0 ? "up" : "down";
    const sinal = c >= 0 ? "▲" : "▼";
    const decimais = p >= 100 ? 0 : 4;
    html += `<span class="ticker-item">
      ${m.nome} <span class="price">${fmt(p, decimais)}</span>
      <span class="${cls}">${sinal}${Math.abs(c).toFixed(2)}%</span>
    </span>`;
  }

  // Duplicar para loop contínuo
  ticker.innerHTML = html + html;
}

// ─── Buscar Histórico (gráfico) ───────────────────────
async function buscarHistorico(moedaId) {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${moedaId}/market_chart?vs_currency=brl&days=7&interval=daily`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.prices.map((p) => p[1]);
  } catch {
    return null;
  }
}

// ─── Mini Gráficos ───────────────────────────────────
const COR_CHART = {
  bitcoin:  { linha: "#f7931a", fundo: "rgba(247,147,26,0.12)" },
  ethereum: { linha: "#627eea", fundo: "rgba(98,126,234,0.12)" },
  litecoin: { linha: "#bebebe", fundo: "rgba(190,190,190,0.1)" },
  tron:     { linha: "#ef0027", fundo: "rgba(239,0,39,0.1)" },
};

const ID_CANVAS = {
  bitcoin: "chart-btc",
  ethereum: "chart-eth",
  litecoin: "chart-ltc",
  tron: "chart-trx",
};

async function carregarMiniGraficos() {
  const moedas = ["bitcoin", "ethereum", "litecoin", "tron"];

  for (const m of moedas) {
    const precos = await buscarHistorico(m);
    if (!precos || precos.length < 2) continue;

    HISTORICO[m] = precos;

    const canvasEl = document.getElementById(ID_CANVAS[m]);
    if (!canvasEl) continue;

    const cor = COR_CHART[m];
    const subindo = precos[precos.length - 1] >= precos[0];
    const linhaFinal = subindo ? cor.linha : "#ef4444";
    const fundoFinal = subindo ? cor.fundo : "rgba(239,68,68,0.1)";

    CHARTS[m] = new Chart(canvasEl, {
      type: "line",
      data: {
        labels: precos.map((_, i) => `D-${precos.length - 1 - i}`),
        datasets: [
          {
            data: precos,
            borderColor: linhaFinal,
            backgroundColor: fundoFinal,
            borderWidth: 2,
            pointRadius: 0,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600 },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false },
        },
        elements: { line: { borderCapStyle: "round" } },
      },
    });
  }
}

// ─── Conversor ───────────────────────────────────────
function calcularConversao() {
  const amount   = parseFloat($("#conv-amount")?.value) || 0;
  const fromSel  = $("#conv-from")?.value;
  const toSel    = $("#conv-to")?.value;
  const elNum    = document.getElementById("conv-num");
  const elLbl    = document.getElementById("conv-lbl");
  const elRate   = document.getElementById("conv-rate");

  if (!elNum || !elLbl) return;

  const getBRL = (id) => (id === "brl" ? 1 : PRECO[id]?.brl || null);

  const fromBRL = getBRL(fromSel);
  const toBRL   = getBRL(toSel);

  if (fromBRL === null || toBRL === null) {
    elNum.textContent = "—";
    elLbl.textContent = "Aguardando cotações...";
    if (elRate) elRate.textContent = "";
    return;
  }

  const emBRL   = amount * fromBRL;
  const result  = emBRL / toBRL;

  const nomeLabel = {
    brl: "BRL", bitcoin: "BTC", ethereum: "ETH", litecoin: "LTC", tron: "TRX"
  };

  const isSmall = Math.abs(result) < 1;
  const casas   = isSmall ? 8 : 2;

  elNum.textContent = fmtNum(result, casas) + " " + nomeLabel[toSel];
  elLbl.textContent = `${fmtNum(amount, 8)} ${nomeLabel[fromSel]} → ${nomeLabel[toSel]}`;

  if (elRate) {
    if (fromSel !== "brl" && toSel === "brl") {
      elRate.textContent = `1 ${nomeLabel[fromSel]} = ${fmt(fromBRL)}`;
    } else if (fromSel === "brl" && toSel !== "brl") {
      elRate.textContent = `1 ${nomeLabel[toSel]} = ${fmt(toBRL)}`;
    } else if (fromSel !== "brl" && toSel !== "brl") {
      const taxa = fromBRL / toBRL;
      elRate.textContent = `1 ${nomeLabel[fromSel]} ≈ ${fmtNum(taxa, 6)} ${nomeLabel[toSel]}`;
    } else {
      elRate.textContent = "";
    }
  }
}

// ─── Swap moedas ────────────────────────────────────
function iniciarConversor() {
  const swapBtn = document.getElementById("conv-swap");
  const fromSel = document.getElementById("conv-from");
  const toSel   = document.getElementById("conv-to");
  const amount  = document.getElementById("conv-amount");

  if (!swapBtn || !fromSel || !toSel) return;

  swapBtn.addEventListener("click", () => {
    const tmp = fromSel.value;
    fromSel.value = toSel.value;
    toSel.value = tmp;
    calcularConversao();
  });

  fromSel.addEventListener("change", calcularConversao);
  toSel.addEventListener("change", calcularConversao);
  amount?.addEventListener("input", calcularConversao);
}

// ─── Navegação ───────────────────────────────────────
function iniciarNav() {
  // Header scroll
  const header = document.querySelector(".header");
  window.addEventListener("scroll", () => {
    header?.classList.toggle("scrolled", window.scrollY > 50);
    const btn = document.getElementById("btn-topo");
    btn?.classList.toggle("visible", window.scrollY > 400);
  }, { passive: true });

  // Menu mobile
  const toggle = document.getElementById("menu-toggle");
  const navMobile = document.getElementById("nav-mobile");
  toggle?.addEventListener("click", () => {
    toggle.classList.toggle("open");
    navMobile?.classList.toggle("open");
  });

  // Fechar mobile ao clicar em link
  navMobile?.querySelectorAll(".nav-link-m").forEach((link) => {
    link.addEventListener("click", () => {
      toggle?.classList.remove("open");
      navMobile.classList.remove("open");
    });
  });

  // Nav links ativos por seção
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link[data-section]");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.classList.toggle(
              "active",
              link.dataset.section === entry.target.id
            );
          });
        }
      });
    },
    { rootMargin: "-40% 0px -40% 0px" }
  );

  sections.forEach((s) => observer.observe(s));

  // Smooth scroll para links internos
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

// ─── Revelar elementos ao rolar ──────────────────────
function iniciarReveal() {
  const revealEls = document.querySelectorAll(
    ".price-card, .info-card, .converter-box, .section-header"
  );

  revealEls.forEach((el) => el.classList.add("reveal"));

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  revealEls.forEach((el) => obs.observe(el));
}

// ─── Copiar endereço BTC ─────────────────────────────
function copiarBTC() {
  const addr = document.getElementById("btc-addr")?.textContent.trim();
  if (!addr) return;
  navigator.clipboard.writeText(addr).then(() => {
    const hint = document.getElementById("copy-hint");
    if (hint) {
      hint.textContent = "✓ Copiado!";
      setTimeout(() => (hint.textContent = ""), 2500);
    }
  });
}
window.copiarBTC = copiarBTC;

// ─── Ano no footer ───────────────────────────────────
const anoEl = document.getElementById("ano");
if (anoEl) anoEl.textContent = new Date().getFullYear();

// ─── Inicialização ───────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  iniciarNav();
  iniciarReveal();
  iniciarConversor();

  // Primeiro carregamento de preços
  await buscarPrecos();

  // Gráficos (após preços)
  await carregarMiniGraficos();

  // Atualização automática a cada 60s
  setInterval(buscarPrecos, 60_000);
});
