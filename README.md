# CriptoVoid — Plataforma de Criptomoedas

> Interface web premium para monitoramento de criptomoedas em tempo real.

---

##  Funcionalidades

- **Cotações ao Vivo** — Preços de BTC, ETH, LTC e TRX atualizados a cada 60 segundos via CoinGecko
- **Ticker de Preços** — Barra de cotações em tempo real no topo da página
- **Mini Gráficos** — Histórico de 7 dias para cada criptomoeda
- **Conversor de Moedas** — Converta entre BRL e qualquer criptomoeda instantaneamente
- **Guia de Mineradoras** — FreeBitco.in, Freetrx.in, AutoFaucet e Unmineable
- **Carteiras** — FaucetPay e Mercado Bitcoin
- **Scripts** — Tampermonkey + scripts automatizadores

## 🚀 Como Usar

### Modo Direto (sem servidor)
Abra o arquivo `index.html` diretamente no navegador. As cotações serão carregadas automaticamente via API pública do CoinGecko.

### Com Servidor Local
```bash
# Python
python -m http.server 3000

# Node.js
npx serve .
```

Acesse: `http://localhost:3000`

## 🛠 Tecnologias

| Tecnologia | Uso |
|---|---|
| HTML5 | Estrutura semântica |
| CSS3 (Custom Properties) | Design responsivo com variáveis CSS |
| JavaScript ES2022 | Lógica, API calls e interações |
| Chart.js | Mini gráficos de histórico |
| CoinGecko API | Dados de preços gratuitos e em tempo real |
| Google Fonts (Orbitron + Space Mono + Inter) | Tipografia premium |

## 📁 Estrutura

```
WebCripto/
├── index.html     # Página principal
├── styles.css     # Estilos (tema Deep Space)
├── scripts.js     # Lógica e API
└── README.md      # Este arquivo
```

## API

Utiliza a [CoinGecko API](https://www.coingecko.com/api/documentation) — gratuita, sem chave de API necessária.

Endpoints utilizados:
- `GET /simple/price` — Cotações atuais
- `GET /coins/{id}/market_chart` — Histórico de preços

## ⚠️ Aviso

Este projeto é apenas informativo e educacional. Não constitui aconselhamento financeiro ou de investimento.

##  Autor

**Hyago Nunes** — [GitHub](https://github.com/HyagoNunes/WebCripto)

##  Licença

MIT License
