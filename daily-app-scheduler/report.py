"""Weekly report: this week vs last week, as a PDF you can download or get by email.

Email is optional. Put these in .env (Gmail: use an App Password,
myaccount.google.com/apppasswords):
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USER=you@gmail.com
    SMTP_PASSWORD=your-16-letter-app-password
    REPORT_TO=you@gmail.com
"""

import datetime as dt
import os
import smtplib
from email.message import EmailMessage

from fpdf import FPDF

import insights

ROWS = [
    ("Deep work", lambda d: insights.fmt_minutes(d["focus_min"].sum()), lambda d: d["focus_min"].sum()),
    ("Meetings", lambda d: insights.fmt_minutes(d["meeting_min"].sum()), lambda d: d["meeting_min"].sum()),
    ("Study room", lambda d: insights.fmt_minutes(d["room_min"].sum()), lambda d: d["room_min"].sum()),
    ("Workouts", lambda d: str(int(d["workouts"].sum())), lambda d: d["workouts"].sum()),
    ("Exercise time", lambda d: insights.fmt_minutes(d["exercise_min"].sum()), lambda d: d["exercise_min"].sum()),
    ("Movement breaks", lambda d: str(int(d["movement_breaks"].sum())), lambda d: d["movement_breaks"].sum()),
    ("Average sleep", lambda d: _avg(d["sleep_h"], "{:.1f} h"), lambda d: d["sleep_h"].mean()),
    ("Average steps", lambda d: _avg(d["steps"], "{:,.0f}"), lambda d: d["steps"].mean()),
]


def _avg(series, fmt: str) -> str:
    s = series.dropna()
    return fmt.format(s.mean()) if len(s) else "-"


def _change(now, before) -> str:
    try:
        if before is None or before != before or not before:
            return ""
        return f"{(now - before) / before * 100:+.0f}%"
    except TypeError:
        return ""


def summary(week_start: dt.date) -> dict:
    this = insights.daily_frame(week_start, week_start + dt.timedelta(days=6))
    last = insights.daily_frame(week_start - dt.timedelta(days=7), week_start - dt.timedelta(days=1))
    rows = [(name, show(this), show(last), _change(value(this), value(last))) for name, show, value in ROWS]
    topics = insights.topic_minutes(week_start, week_start + dt.timedelta(days=6))
    topic_rows = (
        topics.groupby("topic")["minutes"].sum().sort_values(ascending=False).items() if len(topics) else []
    )
    return {
        "week_start": week_start,
        "rows": rows,
        "goals": insights.week_progress(this, insights.goals()),
        "topics": [(t, insights.fmt_minutes(m)) for t, m in topic_rows],
        "findings": insights.findings(insights.daily_frame(week_start - dt.timedelta(days=55), week_start + dt.timedelta(days=6)),
                                      insights.goals()["sleep_hours"]),
    }


def _latin(text: str) -> str:
    return (text.replace("–", "-").replace("—", "-").replace("’", "'").replace("“", '"').replace("”", '"')
            .encode("latin-1", "replace").decode("latin-1"))


def pdf(week_start: dt.date) -> bytes:
    s = summary(week_start)
    end = week_start + dt.timedelta(days=6)
    doc = FPDF()
    doc.add_page()
    doc.set_font("Helvetica", "B", 18)
    doc.cell(0, 10, "Daily App - weekly report", new_x="LMARGIN", new_y="NEXT")
    doc.set_font("Helvetica", "", 11)
    doc.cell(0, 7, f"{week_start:%a %d %b} to {end:%a %d %b %Y}", new_x="LMARGIN", new_y="NEXT")
    doc.ln(4)

    def table(header, rows, widths):
        doc.set_font("Helvetica", "B", 10)
        for h, w in zip(header, widths):
            doc.cell(w, 7, _latin(h), border="B")
        doc.ln()
        doc.set_font("Helvetica", "", 10)
        for row in rows:
            for v, w in zip(row, widths):
                doc.cell(w, 7, _latin(str(v)))
            doc.ln()
        doc.ln(4)

    table(["", "This week", "Last week", "Change"], s["rows"], [60, 40, 40, 30])
    goal_rows = [
        (g["label"], f"{g['value']:.1f}" if isinstance(g["value"], float) else g["value"], g["target"], "reached" if g["done"] else "")
        for g in s["goals"]
    ]
    doc.set_font("Helvetica", "B", 12)
    doc.cell(0, 8, "Goals", new_x="LMARGIN", new_y="NEXT")
    table(["Goal", "This week", "Target", ""], goal_rows, [80, 35, 30, 25])
    if s["topics"]:
        doc.set_font("Helvetica", "B", 12)
        doc.cell(0, 8, "Deep work by topic", new_x="LMARGIN", new_y="NEXT")
        table(["Topic", "Time"], s["topics"], [100, 40])
    if s["findings"]:
        doc.set_font("Helvetica", "B", 12)
        doc.cell(0, 8, "Patterns from the last 8 weeks", new_x="LMARGIN", new_y="NEXT")
        doc.set_font("Helvetica", "", 10)
        for f in s["findings"]:
            doc.multi_cell(0, 6, _latin("- " + f), new_x="LMARGIN", new_y="NEXT")
    return bytes(doc.output())


# ---------- email ----------

def email_configured() -> bool:
    return all(os.getenv(k) for k in ("SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "REPORT_TO"))


def send(week_start: dt.date) -> None:
    s = summary(week_start)
    msg = EmailMessage()
    msg["Subject"] = f"Weekly report: week of {week_start:%d %b %Y}"
    msg["From"] = os.environ["SMTP_USER"]
    msg["To"] = os.environ["REPORT_TO"]
    lines = [f"{name}: {now} (last week {before}) {change}".rstrip() for name, now, before, change in s["rows"]]
    lines += ["", "Goals:"] + [f"- {g['label']}: {'reached' if g['done'] else 'not yet'}" for g in s["goals"]]
    msg.set_content("\n".join(lines) + "\n\nThe full report is attached.")
    msg.add_attachment(pdf(week_start), maintype="application", subtype="pdf", filename=f"weekly-report-{week_start}.pdf")
    with smtplib.SMTP(os.environ["SMTP_HOST"], int(os.getenv("SMTP_PORT") or 587), timeout=30) as smtp:
        smtp.starttls()
        smtp.login(os.environ["SMTP_USER"], os.environ["SMTP_PASSWORD"])
        smtp.send_message(msg)
