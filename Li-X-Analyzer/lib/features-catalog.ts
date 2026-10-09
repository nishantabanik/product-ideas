/**
 * Every feature of the app, where to find it, what it does and how to switch it on. The Features page shows this list, and a test
 * checks that every link leads to a real page and every feature says how to enable it.
 *
 * WHEN WE ADD A FEATURE: add it here (name, what it does, where it is, how to enable it) and add a line to the README table.
 */
export type Need = "none" | "model" | "x" | "linkedin" | "postiz" | "email" | "github";
export type Feature = {
  name: string;
  what: string;
  where: string;
  href: string;
  /** How to switch it on, in plain steps. "Nothing to do" is a valid answer when it works as it is. */
  enable: string;
  need?: Need[];
};
export type Group = { id: string; title: string; blurb: string; features: Feature[] };

export const NEED_LABEL: Record<Need, string> = {
  none: "Works as it is",
  model: "Needs a model on Settings",
  x: "Needs X keys",
  linkedin: "Needs LinkedIn connection for sending",
  postiz: "Needs Postiz",
  email: "Email needs a Resend key",
  github: "Needs GitHub secrets for automatic checks",
};

const READY = "Nothing to do. It works as soon as the app is connected to Postiz and the database.";
const MODEL = "On Settings, enter our gateway URL and key, press Load models, pick one and save (or sign in with GitHub Copilot).";

export const CATALOG: Group[] = [
  {
    id: "measure", title: "Measure", blurb: "See how LinkedIn and X posts perform.",
    features: [
      { name: "Overview", what: "LinkedIn and X numbers at a glance, what is scheduled next and recent posts.", where: "Overview", href: "/", enable: "Add POSTIZ_API_KEY, then press Sync from Postiz once.", need: ["postiz"] },
      { name: "Analytics for any range", what: "Impressions, engagements, likes, comments and reposts from 7 days to several years, with charts and a comparison to the previous period.", where: "Analytics", href: "/analytics", enable: "Upload a LinkedIn export on Import data, and sync Postiz for X." },
      { name: "LinkedIn and X side by side", what: "One table that puts both platforms next to each other for the same period.", where: "Analytics, choose Both", href: "/analytics", enable: READY },
      { name: "Top posts table", what: "Every post with its numbers, sortable. Click a post to open its page.", where: "Analytics, lower down", href: "/analytics", enable: READY },
      { name: "Import LinkedIn and X exports", what: "Upload the Excel or CSV exports. Safe to repeat, nothing is counted twice.", where: "Import data", href: "/import", enable: "In LinkedIn, open Analytics, export the file, and upload it on Import data." },
      { name: "Advisory", what: "A daily review of every post: health scores, what holds us back, what is missing, what to stop, a post by post audit and a playbook.", where: "Advisory", href: "/advisory", enable: READY },
      { name: "Coach notes", what: "Written advice and rewrites of our weakest posts, saved each morning.", where: "Advisory, Coach notes section", href: "/advisory", enable: MODEL, need: ["model"] },
      { name: "Post speed: first hour, growth curve, versus the previous post", what: "On each post page: impressions in the first hour, how the numbers grew over time, and how the post compares with the one before it.", where: "Analytics, click a post title", href: "/analytics", enable: "The comparison with the previous post works at once. The growth curve builds up from the checks we take: one a day by default, every 15 minutes with the GitHub workflow (see Alerts). The first hour figure needs a check within the first hour or two, and only works for X posts.", need: ["github"] },
      { name: "Follower growth and what caused it", what: "Followers over time, and the posts that came just before our best follower gains.", where: "Analytics, Growth tab", href: "/analytics/growth", enable: "Add follower numbers in one of three ways: upload the LinkedIn followers export or the X analytics CSV on Import data, or type today's follower count on the Growth tab. We need at least a few weeks." },
      { name: "Weekly and monthly report (PDF and email)", what: "A one page PDF summary of the period: numbers, best posts, goals and what to do next. Download it, or have it emailed on a schedule.", where: "Analytics, Reports tab", href: "/analytics/reports", enable: "Downloading works as it is. For email, create a free Resend account, add RESEND_API_KEY and NOTIFY_EMAIL_TO in Vercel, redeploy, then choose weekly or monthly on the Reports tab.", need: ["email"] },
      { name: "Content analysis: topic, format, length, hook", what: "Which topics, post formats, lengths and openings earn the most, compared with our typical post.", where: "Analytics, Content tab", href: "/analytics/content", enable: "Needs posts with their text (posts made through Postiz or the Studio). Add pillars on Studio, Pillars to see topics." },
      { name: "Goal tracking", what: "Set a target such as 100,000 impressions a month and see progress, the pace we need and whether we are on track.", where: "Analytics, Goals tab", href: "/analytics/goals", enable: "Open the Goals tab, pick platform, number, period and target, and save." },
      { name: "Benchmarks against our own past", what: "This month against last month, the same month last year, our usual month and our best ever, plus our records.", where: "Analytics, Benchmarks tab", href: "/analytics/benchmarks", enable: "Needs a few months of daily numbers, from a LinkedIn export or Postiz." },
      { name: "Analytics AI Assistant", what: "Chat with an AI about your numbers, missing recent data (last 7 days), LinkedIn/X comments, and resolution steps. Can automatically trigger a Postiz sync for missing X data.", where: "Analytics, Ask AI tab", href: "/analytics/chat", enable: MODEL, need: ["model"] },
    ],
  },
  {
    id: "create", title: "Create", blurb: "Write better posts, faster, in our own voice.",
    features: [
      { name: "Write a post from a story format", what: "The simplest way to write. Type a topic, pick one of 61 story formats (origin story, before and after, hot take, checklist, build in public and more) and optionally one of 18 story structures (PAS, AIDA, STAR, Pixar spine and more), choose the model, and get a LinkedIn post and an X post of at most 279 characters. Simple Class 5 English, no dashes, with a reading level shown on each post.", where: "Studio, Write tab (the first screen of Studio)", href: "/studio/write", enable: MODEL, need: ["model"] },
      { name: "My style: tone, rules, memory, own formats and skill files", what: "Tell the writer who we are. Save our tone, our way of writing, memory (facts about us), our own story formats, our own kinds of writing (carousel, poll, mini case study) and skill files (upload markdown or text instruction files). Tick what to use for each post in the Write tab; the chat uses whatever is on by default.", where: "Studio, My style tab, and step 3 of the Write tab", href: "/studio/style", enable: "Open My style and add items. Mark the ones to use by default. In the Write tab, open step 3 (Our style) to tick items for one post. The model must be connected on Settings." },
      { name: "Studio board", what: "Ideas, Drafts, In review, Approved and Scheduled in one place.", where: "Studio, Board tab", href: "/studio", enable: READY },
      { name: "Idea bank", what: "Save ideas as they come, or ask for suggestions based on our pillars and best posts.", where: "Studio, top box", href: "/studio", enable: `Saving ideas works as it is. For suggestions: ${MODEL}`, need: ["model"] },
      { name: "Draft editor with rules check", what: "Every draft is scored against the same rules the Advisory uses, with a tip for each issue.", where: "Studio, open any draft", href: "/studio", enable: READY },
      { name: "AI chat for drafting and questions", what: "A chat with a writing assistant that knows our voice. Ask for drafts, openings, a shorter version, a critique, or any question about writing for LinkedIn and X. It sits next to every draft and on its own page.", where: "Studio, Chat tab, and the right side of every draft", href: "/studio/chat", enable: MODEL, need: ["model"] },
      { name: "Write 3 versions in our voice", what: "The model reads our best past posts and the playbook, then writes three versions, each scored.", where: "Studio, open a draft, right side", href: "/studio", enable: MODEL, need: ["model"] },
      { name: "Adapt to the other format", what: "One post becomes a LinkedIn version, a short X post and an X thread.", where: "Studio, open a draft, right side", href: "/studio", enable: `Works as it is by cutting the text. For a proper rewrite: ${MODEL}` },
      { name: "X thread builder", what: "Write a thread post by post with a character counter on each, reorder, split and number.", where: "Studio, new X draft, Thread builder", href: "/studio", enable: "Open an X draft and choose Thread builder." },
      { name: "Hook and template library", what: "Built in openings and templates, our own saved ones and the first lines of our best posts.", where: "Studio, Library tab", href: "/studio/library", enable: READY },
      { name: "Content pillars", what: "Our main topics with keywords. Every post is tagged, and we see which topics earn the most.", where: "Studio, Pillars tab", href: "/studio/pillars", enable: "Open Pillars, add three to five topics with keywords, and save." },
      { name: "Compose", what: "Write one post to X, LinkedIn or both, and post it now or schedule it.", where: "Compose", href: "/compose", enable: "Add POSTIZ_API_KEY and connect X and LinkedIn in Postiz.", need: ["postiz"] },
      { name: "Bulk schedule", what: "Upload an Excel or CSV with many posts, each with its own date, time and platform.", where: "Bulk schedule", href: "/bulk", enable: "Download the sample file on the page, fill it in and upload it.", need: ["postiz"] },
    ],
  },
  {
    id: "schedule", title: "Schedule", blurb: "Decide when posts go out, and keep the rhythm.",
    features: [
      { name: "Calendar", what: "Month and week views of every scheduled, published and failed post, live from Postiz.", where: "Calendar", href: "/calendar", enable: "Add POSTIZ_API_KEY.", need: ["postiz"] },
      { name: "Approval flow", what: "Send a draft for review, approve it or ask for changes. A switch makes approval mandatory.", where: "Studio, open a draft", href: "/studio", enable: "Tick Require approval before anything is scheduled on the Studio board to make it mandatory." },
      { name: "Best time to post", what: "A heat map per platform from our own numbers, and our strongest hours.", where: "Queue", href: "/queue", enable: "Needs about 20 posts with impressions. Before that we show common starter times." },
      { name: "Queue slots", what: "Weekly posting times in our time zone, for each platform.", where: "Queue, Our queue", href: "/queue", enable: "Add slots, set the time zone, and press Save slots." },
      { name: "Fill the queue", what: "Gives every approved draft the next free slot and schedules it in Postiz.", where: "Queue, Fill the queue now", href: "/queue", enable: "Save slots first, approve some drafts, then press Fill the queue now.", need: ["postiz"] },
      { name: "Run old winners again", what: "Strong posts older than three months, not tied to a date, turned into a new draft.", where: "Queue, Run these again", href: "/queue", enable: `Needs at least eight older posts with numbers and text. A fresh opening needs a model: ${MODEL}` },
    ],
  },
  {
    id: "engage", title: "Engage and grow", blurb: "Answer people, follow up and keep the right conversations going.",
    features: [
      { name: "Comments inbox", what: "Every comment on our posts in one list, with status, filters and a count in the menu.", where: "Comments", href: "/comments", enable: READY },
      { name: "Read and reply on X", what: "New X replies are read automatically and we answer from the app.", where: "Comments, Check X for replies", href: "/comments", enable: "Create an X developer app with read and write access, add X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN and X_ACCESS_SECRET in Vercel, and redeploy.", need: ["x"] },
      { name: "Capture LinkedIn comments", what: "LinkedIn does not allow reading comments on a personal profile, so paste them, add one, or upload a file.", where: "Comments, Add comments", href: "/comments", enable: READY },
      { name: "Reply on LinkedIn from the app", what: "Send a reply when LinkedIn is connected and we saved the comment link.", where: "Comments, on a comment", href: "/comments", enable: "Add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET, press Connect LinkedIn on Settings, and save the comment link on each comment.", need: ["linkedin"] },
      { name: "Suggested replies and smart paste", what: "Three reply suggestions per comment, and messy pasted text turned into clean comments.", where: "Comments", href: "/comments", enable: MODEL, need: ["model"] },
      { name: "Direct messages in the inbox", what: "Keep DM conversations next to comments. Neither platform lets apps read DMs, so we paste them in.", where: "Comments, filter Messages", href: "/comments", enable: "On Comments, choose Add comments, switch the type to Message, and paste the conversation." },
      { name: "Reply templates", what: "Saved answers for the questions we get again and again, filled in with the person's name.", where: "Comments, Templates", href: "/comments", enable: "Open Templates on the Comments page, save a template, and insert it from any comment." },
      { name: "Reminders for quiet conversations", what: "A list of people we answered who have not replied for a few days, and reminders we set ourselves, with a suggested nudge.", where: "Comments, filter Follow up", href: "/comments", enable: "Nothing to do for quiet conversations. For our own reminders, press Remind me on any comment." },
      { name: "Lead tracker", what: "Turn commenters, profile visitors and DMs into leads and follow them from first contact to a deal.", where: "Leads", href: "/leads", enable: "Press Mark as lead on a comment, or add people on the Leads page." },
      { name: "Target list and daily engagement", what: "A short list of people we want to engage with, with today's few to comment on, prompts for useful comments and a streak.", where: "Targets", href: "/targets", enable: "Add five to twenty people on the Targets page. Comment suggestions need a model, the prompts work without one." },
      { name: "Alerts: a post taking off or starting slowly", what: "A message while a fresh post is still young, so we can reply fast or help it along.", where: "Alerts", href: "/alerts", enable: "Press Check now after posting. For automatic checks every 15 minutes add the GitHub secrets APP_URL and CRON_SECRET (see the Alerts page). For email or Telegram messages add the Resend or Telegram keys.", need: ["postiz", "github"] },
    ],
  },
  {
    id: "setup", title: "Set up", blurb: "Connections that switch features on.",
    features: [
      { name: "Model gateway", what: "Type the gateway URL and key, load the model list and pick one from a dropdown.", where: "Settings, Coach model", href: "/settings", enable: "Our gateway must have a public https address. Enter URL and key on Settings, press Load models, pick one and press Save gateway." },
      { name: "GitHub Copilot sign in", what: "An experimental alternative to a gateway, using a device code.", where: "Settings, Coach model", href: "/settings", enable: "On Settings press Sign in with GitHub and type the shown code on GitHub." },
      { name: "X and LinkedIn connections", what: "Status of the X keys and the LinkedIn connection, with a test button.", where: "Settings", href: "/settings", enable: "Set the X and LinkedIn variables in Vercel (see the README), redeploy, then press Test connection." },
      { name: "Features page", what: "This page: every feature, where it lives and how to switch it on.", where: "Features, left menu", href: "/features", enable: READY },
      { name: "Side advisor", what: "A chat window in the bottom right of every page. Ask why data is missing, what a screen means, or how to fix something. It answers for the page you are on, and runs the fix itself when one exists (sync X, read new X replies, refresh the Advisory).", where: "Every page, bottom right corner", href: "/", enable: MODEL, need: ["model"] },
    ],
  },
  {
    id: "auto", title: "Runs by itself", blurb: "Nothing to click.",
    features: [
      { name: "Daily Postiz sync", what: "Posts, channels and numbers refresh every morning at 06:00 UTC.", where: "Background, shown on Overview", href: "/", enable: "Set CRON_SECRET in Vercel. The schedule is in vercel.json." },
      { name: "Daily Advisory", what: "A fresh review is saved every morning at 06:20 UTC, and older days stay available.", where: "Advisory, date picker", href: "/advisory", enable: "Set CRON_SECRET in Vercel." },
      { name: "X replies check", what: "New X replies are collected with the daily run when the X keys are set.", where: "Comments", href: "/comments", enable: "Add the four X keys in Vercel and redeploy.", need: ["x"] },
      { name: "Scheduled report email", what: "The weekly or monthly report is sent in the morning run when it is due.", where: "Analytics, Reports tab", href: "/analytics/reports", enable: "Add the Resend keys and choose weekly or monthly on the Reports tab.", need: ["email"] },
    ],
  },
];

export const featureCount = () => CATALOG.reduce((n, g) => n + g.features.length, 0);
