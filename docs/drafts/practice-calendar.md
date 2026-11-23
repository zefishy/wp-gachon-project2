# Draft: "Add practice to calendar" button (sign-up success screen)

Removed from the live site; kept here so it can be restored. It adds a button to the
success view that downloads a weekly Tue/Thu 18:30–21:00 KST `.ics` event.

## 1. index.html

Inside `.success-actions` in the sign-up dialog, after the "Copy details" button:

```html
<button class="btn btn-primary" type="button" data-add-practice hidden>
  <span data-i18n="form.addPractice">Add practice to calendar</span>
  <span aria-hidden="true">+</span>
</button>
```

## 2. js/main.js

Next to `var chatLink = ...`:

```js
var practiceButton = $("[data-add-practice]");
```

In `renderApplication()`, after the copy button line:

```js
if (practiceButton) practiceButton.hidden = !sent;
```

In `showSuccess()`, make the sent state focus the button:

```js
var primary = state.app.sent ? practiceButton : mailtoLink;
```

After the submit handler (uses the existing `icsDate()` helper):

```js
function practiceICS() {
  // Weekly Tue/Thu 18:30–21:00 KST (= 09:30–12:00 UTC, Korea has no DST).
  var now = new Date();
  var start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 9, 30));
  while ([2, 4].indexOf(start.getUTCDay()) === -1 || start.getTime() < now.getTime()) {
    start = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  }
  var end = new Date(start.getTime() + 2.5 * 60 * 60 * 1000);
  var esc = function (text) { return String(text).replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n"); };
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GACHON WIND//Baseball Club//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    "UID:gw-practice@gachonwind.club",
    "DTSTAMP:" + icsDate(now),
    "DTSTART:" + icsDate(start),
    "DTEND:" + icsDate(end),
    "RRULE:FREQ=WEEKLY;BYDAY=TU,TH",
    "SUMMARY:" + esc(t("form.icsPracticeSummary")),
    "LOCATION:" + esc(t("contact.fieldValue")),
    "DESCRIPTION:" + esc(t("form.icsPracticeDesc")),
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}

if (practiceButton) {
  practiceButton.addEventListener("click", function () {
    var blob = new Blob([practiceICS()], { type: "text/calendar;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "gachon-wind-practice.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  });
}
```

## 3. js/i18n.js

Add these three keys to each language block (next to the other `form.*` keys):

```js
// en
"form.addPractice": "Add practice to calendar",
"form.icsPracticeSummary": "GACHON WIND practice",
"form.icsPracticeDesc": "Weekly practice, Tuesday and Thursday. Times are Korea Standard Time. Gloves are provided.",

// ko
"form.addPractice": "연습 일정 캘린더에 추가",
"form.icsPracticeSummary": "GACHON WIND 연습",
"form.icsPracticeDesc": "매주 화·목 정기 연습. 시간은 한국 표준시 기준이며 글러브는 빌려 드립니다.",

// vi
"form.addPractice": "Thêm buổi tập vào lịch",
"form.icsPracticeSummary": "Buổi tập GACHON WIND",
"form.icsPracticeDesc": "Tập hằng tuần vào thứ Ba và thứ Năm. Giờ theo KST. Có sẵn găng tay cho bạn.",

// ja
"form.addPractice": "練習をカレンダーに追加",
"form.icsPracticeSummary": "GACHON WIND 練習",
"form.icsPracticeDesc": "毎週火曜・木曜の練習。時刻は韓国標準時です。グローブは貸し出します。",

// zh
"form.addPractice": "将训练添加到日历",
"form.icsPracticeSummary": "GACHON WIND 训练",
"form.icsPracticeDesc": "每周二、周四例行训练。时间为韩国标准时间，提供手套。",
```
