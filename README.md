# 💰 Smart Expense Tracker Telegram Bot

A simple, powerful, and human-friendly Telegram bot to track daily expenses using natural language — no apps, no forms, just chat.

---

## 🚀 Features

### ✅ Natural Language Input

Add expenses like real conversation:

* `add 100 tea`
* `yesterday 300 bus`
* `ထည့် ၅၀၀ မုန့်`
* `add 200 taxi inr`

### 💱 Dual Currency Support

* MMK (Myanmar Kyat)
* INR (Indian Rupee)
* Separate budget & analytics for each currency

### 📊 Analytics

* Daily report
* Monthly summary
* Category-wise insights
* Budget usage warnings

### 📁 Export

* CSV report export
* Per-user data isolation

### 👥 Multi-User Ready

Each Telegram user gets:

* Own expense history
* Own budget
* Own currency preference

### 🧠 Smart Category Detection

Auto categorizes expenses:

| Category  | Examples                  |
| --------- | ------------------------- |
| food      | tea, coffee, momos, မုန့် |
| transport | bus, taxi, metro, ကား     |
| bills     | wifi, recharge, မီး       |
| others    | auto fallback             |

---

## 🛠 Tech Stack

* Node.js
* JavaScript
* Telegram Bot API
* JSON File Storage
* CSV Export
* Natural Language Parsing

---

## 📥 Installation

```bash
git clone <repo-url>
cd ExpenseBot
npm install
```

### Create `.env`

```
BOT_TOKEN=your_telegram_bot_token
```

### Run

```bash
npm start
```

---

## 📘 Commands

### Add Expense

```
add 100 tea
add 200 bus inr
ထည့် ၅၀၀ မုန့် mmk
```

### View

```
show today
analytics
```

### Budget

```
set budget 5000 mmk
set budget 3000 inr
budget
```

### Delete

```
delete last
ဖျက်
```

### Export

```
export
```

---

## 📂 Data Structure

`data.json`

```json
{
  "chatId": {
    "currency": "MMK",
    "budget": {
      "MMK": 0,
      "INR": 0
    },
    "expenses": [
      {
        "amount": 300,
        "currency": "MMK",
        "category": "food",
        "date": "Mon Feb 5 2026"
      }
    ]
  }
}
```

---

## 🔒 Stability

* Global error handling
* Safe Telegram messaging
* Corrupted JSON auto-reset
* User-wise isolation

---

## 🧩 What I Learned

* API integration
* Telegram bot development
* Data parsing logic
* Multi-user architecture
* File-based database design
* 24/7 deployment on Render

---

## 🌱 Future Improvements

* Voice expense input
* Weekly auto report
* Exchange rate converter
* AI category detection
* Button-based currency selector

---

## 🤝 Contributing

Feedback and pull requests are welcome!

---

## 📄 License

MIT

---

### Built with ❤️ by Nicky
