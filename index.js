require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// ---- ERROR HANDLING ----
process.on("unhandledRejection", (e) => console.log(e.message));
bot.on("polling_error", (e) => console.log(e.message));

function safe(id, text, opt = {}) {
  bot.sendMessage(id, text, opt).catch(() => {});
}

// ---- DB ----
let db = {};
if (fs.existsSync("data.json")) {
  try {
    db = JSON.parse(fs.readFileSync("data.json"));
  } catch {
    db = {};
  }
}

function save() {
  fs.writeFileSync("data.json", JSON.stringify(db, null, 2));
}

function user(id) {
  if (!db[id]) {
    db[id] = {
      currency: "MMK",
      budget: { MMK: 0, INR: 0 },
      expenses: [],
    };
  }
  return db[id];
}

// ---- CATEGORY ----
const map = {
  food: ["tea", "coffee", "momos", "rice", "မုန့်", "လက်ဖက်ရည်"],
  transport: ["bus", "taxi", "metro", "ကား", "ဘတ်စ်"],
  bills: ["wifi", "recharge", "မီး", "bill"],
};

function auto(w) {
  for (let c in map) if (map[c].includes(w)) return c;
  return "other";
}

// ---- PARSER ----
function parse(text) {
  let w = text.toLowerCase().split(" ");

  let amount = w.find((x) => !isNaN(x));
  if (!amount) return null;

  let cur = "MMK";

  if (w.includes("inr") || w.includes("rupee") || w.includes("rupees"))
    cur = "INR";

  if (w.includes("mmk") || w.includes("kyat")) cur = "MMK";

  let ignore = [
    "add",
    "ထည့်",
    "rs",
    "₹",
    "ကျပ်",
    "inr",
    "mmk",
    "yesterday",
    "မနေ့",
  ];

  let clean = w.filter((x) => !ignore.includes(x) && isNaN(x));

  let category = auto(clean[0]);

  let date = new Date();
  if (text.includes("yesterday") || text.includes("မနေ့"))
    date.setDate(date.getDate() - 1);

  return {
    amount: Number(amount),
    currency: cur,
    category,
    date: date.toDateString(),
  };
}

// ---- TOTAL ----
function monthTotal(id, cur) {
  let m = new Date().getMonth();

  return user(id)
    .expenses.filter(
      (e) => e.currency === cur && new Date(e.date).getMonth() === m,
    )
    .reduce((s, e) => s + e.amount, 0);
}

// ---- MENU ----
function menu(id) {
  safe(id, "ရွေးပါ | Choose:", {
    reply_markup: {
      keyboard: [
        ["show today", "analytics"],
        ["budget", "export"],
      ],
      resize_keyboard: true,
    },
  });
}

// ===== BOT =====
bot.on("message", (msg) => {
  let id = msg.chat.id;
  let text = msg.text.toLowerCase();
  let u = user(id);

  // ---- DELETE ----
  if (
    text === "delete last" ||
    text === "delete" ||
    text === "delete last one" ||
    text === "ဖျက်" ||
    text === "နောက်ဆုံးဖျက်"
  ) {
    if (u.expenses.length === 0) {
      safe(id, "Nothing to delete");
      return;
    }

    let r = u.expenses.pop();
    save();

    safe(id, `Removed ${r.amount} ${r.currency} → ${r.category}`);
    return;
  }

  if (text === "/start") {
    menu(id);
    return;
  }

  // ---- SET BUDGET ----
  if (text.startsWith("set budget") || text.startsWith("budget")) {
    let p = text.split(" ");
    let num = p.find((x) => !isNaN(x));
    let cur = p.includes("inr") ? "INR" : "MMK";

    u.budget[cur] = Number(num);
    save();

    safe(id, `✅ Budget ${num} ${cur}`);
    return;
  }

  // ---- TODAY ----
  if (text.includes("today") || text.includes("ဒီနေ့")) {
    let t = new Date().toDateString();

    let list = u.expenses.filter((e) => e.date === t);

    if (!list.length) return safe(id, "No expenses");

    let r = "Today:\n";
    list.forEach((e) => (r += `${e.category} ${e.amount} ${e.currency}\n`));

    safe(id, r);
    return;
  }

  // ---- ANALYTICS ----
  if (text.includes("analytics") || text.includes("စာရင်း")) {
    let rep = {};

    u.expenses.forEach((e) => {
      let k = e.category + "-" + e.currency;
      rep[k] = (rep[k] || 0) + e.amount;
    });

    let r = "Report:\n";
    for (let k in rep) r += `${k}: ${rep[k]}\n`;

    safe(id, r);
    return;
  }

  // ---- EXPORT ----
  if (text === "export") {
    let csv = "amount,currency,category,date\n";

    u.expenses.forEach(
      (e) => (csv += `${e.amount},${e.currency},${e.category},${e.date}\n`),
    );

    fs.writeFileSync(`${id}.csv`, csv);

    bot.sendDocument(id, `${id}.csv`).catch(() => {});
    return;
  }

  // ---- ADD EXPENSE ----
  let e = parse(text);

  if (e) {
    u.expenses.push(e);
    save();

    let used = monthTotal(id, e.currency);
    let b = u.budget[e.currency];

    let w = "";
    if (b > 0 && used / b >= 0.8) w = "\n⚠ Budget 80% ကျော်ပြီ";

    safe(id, `✅ ${e.amount} ${e.currency} → ${e.category}${w}`);
    return;
  }

  safe(id, "example:\nadd 100 tea\nထည့် ၃၀၀ ကား");
});

// ---- RENDER FREE SUPPORT ----
const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Expense Bot Running"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("port opened"));
