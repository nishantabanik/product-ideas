/**
 * Story formats and story structures to choose from when writing a post. Each one has a short example and a plain instruction
 * that the writing model follows. A structure can be used inside any format.
 */
export type Format = { id: string; group: string; name: string; example: string; guide: string };
export type Structure = { id: string; name: string; steps: string; guide: string };

const f = (id: string, group: string, name: string, example: string, guide: string): Format => ({ id, group, name, example, guide });

export const GROUPS = ["Personal stories", "Opinions and debates", "Teach something", "Case studies and analysis", "Ask the community", "Series and updates", "Creative and media"] as const;

export const FORMATS: Format[] = [
  // Personal stories
  f("origin-story", GROUPS[0], "Origin story", "How I went from a support desk to a staff engineer", "Tell how we started and the key steps that got us here. Start small, show two or three turning points, end with where we are now and one lesson."),
  f("before-after", GROUPS[0], "Before and after", "Our deploy took 45 minutes. Now it takes 4.", "Show the old situation with one clear number or detail, then the new result, then the two or three changes that made the difference."),
  f("underdog", GROUPS[0], "Underdog, from rejection to success", "Rejected by 63 companies. Then this happened.", "Open with the rejection or the hard start. Show the struggle in a few short lines. Then the turn, the win, and what it taught us."),
  f("confession", GROUPS[0], "Confession", "I will admit it. I faked understanding Kubernetes for a year.", "Start with an honest admission. Say why we hid it, what it cost us, and what we do now. Be kind to ourselves. End with a message for others who feel the same."),
  f("career-pivot", GROUPS[0], "Career pivot", "Why I left management and went back to coding", "Say what we did before, what made us change, how scary it was, and what we found. Be honest about both the good and the hard parts."),
  f("layoff-journey", GROUPS[0], "Layoff or job hunt journey", "Week by week after my layoff", "Write it as a raw, honest account in short time steps (week 1, week 4, week 8). Show feelings and facts. End with where we stand now and what helped."),
  f("burnout-story", GROUPS[0], "Burnout or life meets work", "The week I could not open my laptop", "Tell one real moment of stress or a life event that hit work. Say what we felt, what we changed, and one small thing that helped. Keep it gentle and honest."),
  f("x-taught-me-y", GROUPS[0], "What X taught me about Y", "What my 5 year old taught me about debugging", "Pick a person, pet or everyday moment. Tell the small scene, then connect it to a lesson about the topic in plain words."),
  f("micro-twist", GROUPS[0], "Micro story with a twist", "Five to eight short lines, the punchline last", "Write 5 to 8 very short lines. Set up a normal moment, build a little, then end with a twist or a surprise in the last line."),
  f("parable", GROUPS[0], "Parable or fable", "The farmer and the broken fence", "Make up a very short story with simple characters (a farmer, a fox, a builder). Let the story carry the lesson. State the lesson in one line at the end."),
  f("start-over", GROUPS[0], "If I started over today", "If I had to learn DevOps from zero in 2026, I would do this", "Say what we would do first, second and third if we began again. Name what we would skip. Keep each step short and practical."),
  f("letter-younger-self", GROUPS[0], "Letter to my younger self", "Dear me at 22,", "Write a short letter that starts with Dear me at an age. Give three or four pieces of advice, each with a small reason. End warmly."),

  // Opinions and debates
  f("hot-take", GROUPS[1], "Hot take", "Unpopular opinion: daily stand-ups should be optional", "Open with one firm, clear statement. Give two or three reasons in plain words. Admit when the opposite can be true. End by inviting other views."),
  f("myth-fact", GROUPS[1], "Myth and fact", "Myth: you need a degree to code. Fact: ...", "Name the myth in one line. Then say what is true and give one proof or example. Repeat for two or three myths if the space allows."),
  f("expectation-reality", GROUPS[1], "Expectation and reality", "What I thought senior engineers did and what they really do", "Put two lists side by side: what we expected and what is real. Keep each item short. End with one honest lesson."),
  f("steelman", GROUPS[1], "Both sides", "The case for and against remote work", "Give the best case for one side, then the best case for the other, in fair words. Then say which side we pick and why."),
  f("rant", GROUPS[1], "Pet peeve", "Please stop doing this in meetings", "Name the thing that annoys us. Say why it hurts. Be a little funny and not mean. End with what we wish people did instead."),
  f("manifesto", GROUPS[1], "Things I believe", "10 things I believe about software teams", "Write a list of beliefs, one short line each, 5 to 10 items. Make each one clear and a bit bold. End with one line that ties them together."),
  f("inverse-advice", GROUPS[1], "How to fail on purpose", "How to guarantee our project fails in 5 easy steps", "Give funny bad advice as numbered steps, so the reader sees the real lesson by contrast. End by saying the opposite is the real advice."),
  f("what-if", GROUPS[1], "What if", "What if GitHub went down for a week?", "Ask a big what if question. Walk through what would happen in three or four steps. End with what we should do to be ready."),

  // Teach something
  f("nobody-tells", GROUPS[2], "Things nobody tells you", "Things nobody tells you about your first year as a manager", "Give 4 to 7 honest points that people learn too late. One short line each, with a tiny reason."),
  f("framework", GROUPS[2], "Framework or mental model", "The 2x2 we use to pick what to build next", "Name the framework with a short name or a short acronym. Explain each part in one line. Give one small example of using it."),
  f("checklist", GROUPS[2], "Checklist or cheat sheet", "Before you merge, check these 7 things", "Write a clean checklist of 5 to 9 items, one short line each, in the order we would use them."),
  f("eli5", GROUPS[2], "Explain it simply", "Kubernetes, explained like we are 10", "Explain one hard idea with an everyday comparison (a kitchen, a school, a bus). No jargon. End with one sentence that sums it up."),
  f("tech-history", GROUPS[2], "History or origin", "Why is it called a bug?", "Tell the short true story behind a word or a tool. Use only facts we are given or that are well known. Say why it still matters today."),
  f("decision-tree", GROUPS[2], "Decision tree", "Should we use microservices? Follow the arrows.", "Write a set of yes or no questions that lead to an answer, in short lines (If yes, go to...). End with the possible answers."),
  f("hidden-gem", GROUPS[2], "Hidden gem", "A Git command almost nobody uses", "Introduce one underrated tool or feature. Say what it does, show one tiny example, and say when it saves time."),
  f("say-vs-mean", GROUPS[2], "What they say and what they mean", "'Quick sync?' means a 45 minute meeting", "Write 4 to 7 pairs. First what people say, then what it really means. Keep it light and a little funny."),
  f("unwritten-rules", GROUPS[2], "Unwritten rules", "Unwritten rules of code review", "List 4 to 7 rules that nobody writes down but everybody follows. One short line each, with a tiny reason."),
  f("red-green-flags", GROUPS[2], "Red flags and green flags", "Red flags in a job description", "Give a short red flag list and a short green flag list. One line each. End with one tip on how to check it."),
  f("tier-list", GROUPS[2], "Ranking or tier list", "S to F tier for tools we have used", "Rank items from best (S) to worst (F). Give a short reason for each. Say it is only our opinion and invite others to disagree."),
  f("timeline", GROUPS[2], "Timeline or evolution", "Web development in 2010, 2018 and 2026", "Show how something changed over time in three or four steps with years. End with what we think comes next."),

  // Case studies and analysis
  f("teardown", GROUPS[3], "Teardown", "I broke down a landing page that converts at 12 percent", "Pick one thing (page, product, post, resume). Say what works, what does not, and what we would change. Use 3 to 5 clear points."),
  f("company-case", GROUPS[3], "Company case study", "How a big company handles a huge amount of traffic", "Explain how a known company solved a problem, in simple steps. Use only facts we are given or that are widely known. End with what we can copy."),
  f("customer-success", GROUPS[3], "Customer success story", "How one customer cut their costs by a third", "Tell who the customer is (in general words), what problem they had, what we did, and the result. Use only the numbers we are given."),
  f("how-i-did-x", GROUPS[3], "How I did X", "How I got my first 100 customers", "Say the result first. Then walk through the steps we took, with real details. End with the biggest mistake and the biggest lesson."),
  f("decision-record", GROUPS[3], "Decision record", "Why we chose Postgres over MongoDB", "State the decision. List the options, the main reasons for the choice, and the price we pay for it. End with when we would change our mind."),
  f("original-data", GROUPS[3], "Original data or survey", "We asked 500 developers. Here is what we found.", "Lead with the most surprising number we are given. Share three findings, one short line each. Say what it means. Never invent numbers."),
  f("experiment-report", GROUPS[3], "Experiment report", "I tried this for 30 days. Here are the results.", "Say what we tried and why. Give the result with real numbers if we have them. Say what worked, what did not, and what we do next."),
  f("perspective-switch", GROUPS[3], "Three points of view", "The same outage, told by the developer, the manager and the customer", "Tell one event three times, from three people. Keep each part to two or three short lines. End with what all three can learn."),

  // Ask the community
  f("fill-blank", GROUPS[4], "Fill in the blank", "The best engineer I worked with always ___", "Write one open sentence with a blank for people to finish. Add our own answer first. Ask them to reply."),
  f("crowd-list", GROUPS[4], "Crowdsourced list", "Drop your best VS Code shortcut below", "Ask people to share their best tip, tool or habit on one topic. Share one of ours first. Say we will collect the best ones."),
  f("ama", GROUPS[4], "Ask me anything", "I have done X for 10 years. Ask me anything.", "Say who we are and what we can answer, in two lines. Invite questions. Say when we will answer them."),
  f("roast-me", GROUPS[4], "Roast my work", "Roast my portfolio", "Share something of ours and ask for honest feedback. Say what kind of feedback we want. Thank people in advance."),
  f("help-request", GROUPS[4], "Help request", "Stuck on this. What would you do?", "Explain the problem in a few short lines, what we tried, and exactly what we need. Make it easy to answer in one sentence."),
  f("shoutout", GROUPS[4], "Shout-out", "Someone who deserves more credit", "Praise another person's work. Say what they did, why it helped, and where to find it. Be specific, not just kind."),
  f("tag-person", GROUPS[4], "Tag a person", "Tag the engineer who saved your production", "Ask people to tag someone for a clear reason. Name one person ourselves first and say why."),
  f("co-authored", GROUPS[4], "Co-authored post", "Two creators, one story", "Write it as a shared post from two people (we and a partner). Say who is speaking in each part. Make one story from two views."),

  // Series and updates
  f("build-public", GROUPS[5], "Build in public", "Week 6 of building our SaaS: revenue, users, mistakes", "Give the week number, then the numbers we are given, one win, one mistake and the plan for next week. Keep it short and honest."),
  f("serialized", GROUPS[5], "Serial story", "Part 3 of the outage that almost killed our startup", "Write one part of a longer story. Remind the reader what happened before in one line. Move the story forward. End on a small cliffhanger."),
  f("day-x", GROUPS[5], "Day X of 100", "Day 23 of 100: learning to code", "Start with Day and the number. Say what we did today, one thing we learned, and one thing that was hard. End with tomorrow's plan."),
  f("year-review", GROUPS[5], "Year in review", "My year in 5 lessons", "Look back on the year. Share the main wins, one big failure, and 3 to 5 lessons in short lines. End with a hope for next year."),
  f("goals", GROUPS[5], "Goals and accountability", "My goals for next year. Hold me to them.", "List three to five clear goals with a number or a date. Say why they matter. Ask people to check on us."),

  // Creative and media
  f("meme-humor", GROUPS[6], "Meme or humor", "Me explaining the bug to my manager", "Write a short, kind joke about a common work moment. Give the setup in one line and the punchline in the next. Suggest what the picture should show in brackets."),
  f("short-video", GROUPS[6], "Short video script", "A talking head video of 30 to 45 seconds", "Write what we say out loud: a strong first sentence, three short points, and a closing line. Use spoken, easy words. Also write a short caption for the post."),
  f("poem", GROUPS[6], "Poem or haiku", "A short poem about shipping on Friday", "Write a short poem (4 to 8 lines or a haiku) about the topic. Keep the words simple and the idea clear."),
  f("live-thread", GROUPS[6], "Live coverage", "Live from the conference, session by session", "Write short updates as the event happens, each starting with a time or a number. Keep each update to one or two lines."),
  f("launch-demo", GROUPS[6], "Launch or demo", "We just shipped our new side project", "Say what we built, who it helps, and why we made it. Show one clear benefit. End with where to try it and a simple ask."),
  f("newsletter-teaser", GROUPS[6], "Newsletter or article teaser", "A story hook with a link to the full piece", "Tell the most interesting part of the story in a few lines, then stop at the best moment and point to the full piece. Use [link] as a placeholder."),
  f("steal-template", GROUPS[6], "Steal my template", "Steal the prompt I use for code reviews", "Share one useful template, prompt or checklist in a clean block. Say what it is for and how to use it. Invite people to copy it."),
  f("broetry", GROUPS[6], "One line per line", "Short punchy lines made for scrolling", "Write one short sentence per line with a blank line between most lines. Build up slowly and end with a strong last line."),
];

const s = (id: string, name: string, steps: string, guide: string): Structure => ({ id, name, steps, guide });

export const STRUCTURES: Structure[] = [
  s("pas", "PAS", "Problem, Agitate, Solution", "Name the problem. Make the reader feel why it hurts. Then offer the solution."),
  s("aida", "AIDA", "Attention, Interest, Desire, Action", "Grab attention in the first line. Build interest with a fact. Create desire with a benefit. End with one clear action."),
  s("bab", "BAB", "Before, After, Bridge", "Show the situation before. Show the situation after. Then explain the bridge that got us there."),
  s("sla", "SLA", "Struggle, Lesson, Action", "Tell the struggle. Say the lesson. Finish with the action the reader can take."),
  s("star", "STAR", "Situation, Task, Action, Result", "Set the situation. Say the task. Tell what we did. Share the result."),
  s("in-medias-res", "In the middle of the action", "Start mid-scene, then explain", "Start in the middle of a tense moment with a time and a detail. Then go back and explain how we got there, then tell how it ended."),
  s("pixar", "Pixar story spine", "Once upon a time, every day, until one day, because of that, until finally", "Use the lines: Once upon a time... Every day... Until one day... Because of that... Until finally... Then say what we learned."),
  s("hero", "Hero's journey, short", "Ordinary world, challenge, struggle, change, return", "Show the normal world, the challenge, the struggle, the change, and what we bring back for others."),
  s("sparkline", "Sparkline", "What is, and what could be, back and forth", "Move between how things are now and how they could be. End on the better future and the first step to get there."),
  s("false-start", "False start", "Looks like success, then flips", "Begin as if everything went well. Then flip: it failed. Say what we learned from the failure."),
  s("nested-loops", "Nested loops", "Open story one, open story two, close both", "Begin one short story and stop. Tell a second short story inside. Close the second one, then close the first. Both carry the same message."),
  s("petal", "Petal structure", "Several mini stories around one message", "State one central message. Tell two or three tiny stories that each prove it. End by repeating the message."),
  s("converging", "Converging ideas", "Separate threads that join", "Start two or three separate threads. Let them meet in one insight near the end."),
  s("mountain", "Mountain", "Rising tension to one climax", "Raise the tension with small problems, one after another, until one big moment. Then show the result."),
  s("open-loop", "Open loop", "Question first, answer last", "Ask a question in the first line. Do not answer it until the very end."),
  s("contrast-hook", "Contrast hook", "Everyone says X, I did Y", "Open with: Everyone says X. I did Y. Then show what happened."),
  s("three-act", "Three acts", "Setup, conflict, resolution", "Set up who and what. Show the conflict. Resolve it and say what changed."),
  s("rule-of-three", "Rule of three", "Three examples, three lessons, three beats", "Use three of everything: three examples, three lessons or three short beats. Keep each one equal in size."),
];

export const formatById = (id?: string) => FORMATS.find((x) => x.id === id) ?? null;
export const structureById = (id?: string) => STRUCTURES.find((x) => x.id === id) ?? null;

/** Kinds of writing, chosen in addition to the story format. They change the shape of the post, not the story. */
export type Output = { id: string; name: string; guide: string };
export const OUTPUTS: Output[] = [
  { id: "standard", name: "Standard post", guide: "A normal post of the usual length for the platform." },
  { id: "short", name: "Short and punchy", guide: "As short as it can be while still being whole. A few lines. Every word must earn its place." },
  { id: "long", name: "Long story post", guide: "A fuller story with more detail and a clear beginning, middle and end. Still one idea, still short lines." },
  { id: "carousel", name: "Carousel outline", guide: "Write the text for a slide carousel: a title slide, 5 to 8 short slides (one idea each, under 25 words), and a last slide with a simple call to action. Number the slides." },
  { id: "poll", name: "Poll", guide: "Write a short question and 3 or 4 short answer options, plus one line that explains why we ask." },
  { id: "list", name: "List post", guide: "A short promise line, then a numbered list of 5 to 9 items with one short line each, then one closing line." },
];
export const outputById = (id?: string) => OUTPUTS.find((o) => o.id === id) ?? null;
