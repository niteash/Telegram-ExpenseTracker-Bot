require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

const TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

let data = [];

// ---------- LOAD DATA ----------
if (fs.existsSync("data.json")) {
  try {
    data = JSON.parse(fs.readFileSync("data.json"));
  } catch {
    data = [];
  }
}

let budget = 0;

// load budget if exists
if (fs.existsSync("budget.json")) {
  budget = Number(fs.readFileSync("budget.json"));
}

function saveBudget() {
  fs.writeFileSync("budget.json", String(budget));
}

function save() {
  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
}

// ---------- CATEGORY AI ----------
const categoryMap = {
  food: ["tea", "momos", "pizza", "coffee", "dinner", "lunch"],
  transport: ["bus", "metro", "auto", "uber"],
  bills: ["recharge", "wifi", "electricity"],
  study: ["book", "pen", "notes"],
};

function autoCategory(word) {
  for (let cat in categoryMap) {
    if (categoryMap[cat].includes(word)) return cat;
  }
  return word;
}

// ---------- PARSER ----------
function parseMessage(text) {
  let words = text.toLowerCase().split(" ");

  let amount = words.find((w) => !isNaN(w));
  if (!amount) return null;

  let ignore = ["add", "spent", "spend", "rs", "₹", "on", "yesterday"];

  let clean = words.filter((w) => !ignore.includes(w) && isNaN(w));

  let category = autoCategory(clean[0] || "other");

  // date detect
  let date = new Date();
  if (text.includes("yesterday")) {
    date.setDate(date.getDate() - 1);
  }

  return {
    amount: Number(amount),
    category,
    date: date.toDateString(),
  };
}

// ---------- BUTTON MENU ----------
function menu(chatId) {
  bot.sendMessage(chatId, "Choose:", {
    reply_markup: {
      keyboard: [
        ["show today", "show month"],
        ["analytics", "export"],
        ["delete last"],
      ],
      resize_keyboard: true,
    },
  });
}

// ========== MAIN BOT ==========

bot.on("message", (msg) => {
  let text = msg.text.toLowerCase();
  let chatId = msg.chat.id;

  // ---- MENU ----
  if (text === "/start") {
    menu(chatId);
    return;
  }
  // ----- SET BUDGET -----
  if (text.startsWith("set budget")) {
    let num = text.split(" ")[2];

    budget = Number(num);
    saveBudget();

    bot.sendMessage(chatId, `✅ Monthly budget set to ₹${budget}`);
    return;
  }
  // ---- SHOW TODAY ----
  if (text === "show today") {
    let today = new Date().toDateString();

    let list = data.filter((e) => e.date === today);

    if (list.length === 0) {
      bot.sendMessage(chatId, "No expenses today");
      return;
    }

    let total = list.reduce((s, e) => s + e.amount, 0);

    let reply = "Today:\n";
    list.forEach((e, i) => {
      reply += `${i + 1}. ${e.category} - ₹${e.amount}\n`;
    });

    reply += `Total: ₹${total}`;

    bot.sendMessage(chatId, reply);
    return;
  }

  // ---- SHOW MONTH ----
  if (text === "show month") {
    let month = new Date().getMonth();

    let list = data.filter((e) => new Date(e.date).getMonth() === month);

    let total = list.reduce((s, e) => s + e.amount, 0);

    bot.sendMessage(chatId, `This month total: ₹${total}`);
    return;
  }

  // ---- ANALYTICS ----
  if (text === "analytics") {
    let report = {};

    data.forEach((e) => {
      report[e.category] = (report[e.category] || 0) + e.amount;
    });

    let reply = "Category Wise:\n";

    for (let c in report) {
      reply += `${c}: ₹${report[c]}\n`;
    }

    bot.sendMessage(chatId, reply);
    return;
  }

  // ---- DELETE LAST ----
  if (text === "delete last") {
    let removed = data.pop();
    save();

    bot.sendMessage(chatId, `Removed ₹${removed.amount} → ${removed.category}`);
    return;
  }

  // ---- DELETE BY NUMBER ----
  if (text.startsWith("delete ")) {
    let num = Number(text.split(" ")[1]) - 1;

    if (data[num]) {
      let r = data.splice(num, 1)[0];
      save();

      bot.sendMessage(chatId, `Deleted ₹${r.amount} ${r.category}`);
    }
    return;
  }
  // ----- BUDGET STATUS -----
  if (text === "budget") {
    let used = monthTotal();
    let left = budget - used;

    let percent = Math.round((used / budget) * 100);

    let msg = `Budget: ₹${budget}
Used: ₹${used}
Left: ₹${left}
Usage: ${percent}%`;

    if (percent >= 80) {
      msg += "\n⚠ Warning: Near budget limit!";
    }

    bot.sendMessage(chatId, msg);
    return;
  }

  // ---- EXPORT CSV ----
  if (text === "export") {
    let csv = "amount,category,date\n";

    data.forEach((e) => {
      csv += `${e.amount},${e.category},${e.date}\n`;
    });

    fs.writeFileSync("report.csv", csv);

    bot.sendDocument(chatId, "report.csv");
    return;
  }

  // ---- ADD EXPENSE ----
  let exp = parseMessage(text);

  if (exp) {
    data.push(exp);
    save();

    let used = monthTotal();
    let percent = Math.round((used / budget) * 100);

    let warn = "";

    if (budget > 0 && percent >= 80) {
      warn = `\n⚠ You used ${percent}% of budget!`;
    }

    bot.sendMessage(chatId, `✅ Added ₹${exp.amount} → ${exp.category}${warn}`);
    return;
  }

  bot.sendMessage(chatId, "Type:\nadd 100 tea\nshow today\nanalytics");
});

function monthTotal() {
  let m = new Date().getMonth();

  return data
    .filter((e) => new Date(e.date).getMonth() === m)
    .reduce((s, e) => s + e.amount, 0);
}
