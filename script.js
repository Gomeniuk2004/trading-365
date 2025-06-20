// script.js
const API_KEY = "7360f9cdc4b144449affc7c0f3d4fc53";
const signalDisplay = document.getElementById("signalDisplay");
const signalHistory = document.getElementById("signalHistory");
const pairSelect = document.getElementById("pairSelect");

async function fetchData(pair) {
  const url = `https://api.twelvedata.com/time_series?symbol=${pair}&interval=5min&outputsize=100&apikey=${API_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.values) throw new Error("No data");
    return data.values.reverse(); // найновіші останні
  } catch (err) {
    console.error("Fetch error:", err);
    return null;
  }
}

function calculateMA(data, period) {
  const ma = [];
  for (let i = 0; i <= data.length - period; i++) {
    const slice = data.slice(i, i + period);
    const avg = slice.reduce((sum, d) => sum + parseFloat(d.close), 0) / period;
    ma.push(avg);
  }
  return ma;
}

function calculateRSI(data, period = 14) {
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = parseFloat(data[i].close) - parseFloat(data[i - 1].close);
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);
  return rsi;
}

function generateSignal(ma5, ma20, rsi) {
  const lastMA5 = ma5[ma5.length - 1];
  const lastMA20 = ma20[ma20.length - 1];
  if (lastMA5 > lastMA20 && rsi < 70) return "BUY";
  if (lastMA5 < lastMA20 && rsi > 30) return "SELL";
  return "WAIT";
}

async function updateSignal() {
  const pair = pairSelect.value;
  signalDisplay.textContent = "Завантаження...";
  const data = await fetchData(pair);
  if (!data) {
    signalDisplay.textContent = "Помилка завантаження даних";
    return;
  }

  const ma5 = calculateMA(data, 5);
  const ma20 = calculateMA(data, 20);
  const rsi = calculateRSI(data);
  const signal = generateSignal(ma5, ma20, rsi);

  signalDisplay.className = "signal";
  if (signal === "BUY") signalDisplay.classList.add("buy");
  else if (signal === "SELL") signalDisplay.classList.add("sell");

  signalDisplay.textContent = `Сигнал: ${signal}`;
  const time = new Date().toLocaleTimeString();
  signalHistory.innerHTML = `<div><strong>${time}</strong> — ${pair} — <span class="${signal.toLowerCase()}">${signal}</span></div>` + signalHistory.innerHTML;
}

pairSelect.addEventListener("change", updateSignal);
updateSignal();
setInterval(updateSignal, 300000); // оновлення кожні 5 хв
