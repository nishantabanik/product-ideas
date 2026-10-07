export type PlaybookItem = { title: string; why: string };
export type Playbook = { do: PlaybookItem[]; dont: PlaybookItem[] };

export const PLAYBOOK_NOTE =
  "Platforms change their ranking often and do not publish exact rules. These are widely used practices, so treat each one as a hypothesis, try it for two weeks and let our own numbers decide.";

export const PLAYBOOK: Record<"linkedin" | "x", Playbook> = {
  linkedin: {
    do: [
      { title: "Win the first two lines", why: "The feed shows only the opening before see more. If those lines do not make a clear promise or raise a question, the rest is never read." },
      { title: "One idea per post", why: "A post that makes one point is easy to read, remember and answer. Cut every sentence that does not serve that point." },
      { title: "Short paragraphs and white space", why: "One or two lines per paragraph reads well on a phone and keeps people reading longer." },
      { title: "Be specific", why: "Numbers, real examples and before and after beat general advice. Specifics make a post believable and quotable." },
      { title: "Tell what happened, then the lesson", why: "A short story with a clear takeaway is easier to follow and share than a list of tips." },
      { title: "End with one easy question", why: "Ask something people can answer from their own experience in one sentence. Thoughts? is too vague to answer." },
      { title: "Reply to every comment, fast", why: "Early replies keep the conversation going while the post is still being shown, and each reply is another chance to be seen." },
      { title: "Comment on other people's posts every day", why: "Useful comments on relevant posts bring new people to our profile and build relationships that later comment on our posts." },
      { title: "Post on a fixed rhythm", why: "Three to five posts a week at similar times builds a habit in our audience. Use our best weekdays from the data." },
      { title: "Mix formats", why: "Text, a photo, a carousel (PDF document), a short video or a poll. Carousels keep people swiping and often earn longer reading time, so test them." },
      { title: "Run a recurring series", why: "A named series (for example Friday lessons) gives readers something to expect and gives us an easy topic." },
      { title: "Reuse winners with a new angle", why: "After two or three months, most of our audience has not seen our best idea. Write it again with a fresh opening." },
      { title: "Make the profile do the selling", why: "Headline says who we help, the banner and featured section show proof. People who like a post will check our profile." },
    ],
    dont: [
      { title: "Do not put links in the main post", why: "Posts that send people away from the platform are often shown to fewer people. Put the link in the first comment and test the difference." },
      { title: "Do not use engagement bait or pods", why: "Comment YES, like if you agree and comment groups produce empty interactions. They do not turn into customers and can hurt trust." },
      { title: "Do not open with a cliche", why: "Excited to announce or Thrilled to share looks like everything else in the feed and gives no reason to read on." },
      { title: "Do not write a wall of text", why: "Long unbroken blocks look like work and get skipped on a phone." },
      { title: "Do not stuff hashtags", why: "Three or fewer relevant hashtags is plenty. A long row of tags looks spammy and adds little." },
      { title: "Do not tag people who were not involved", why: "Mass tagging annoys people and trains them to ignore us." },
      { title: "Do not post and disappear", why: "A post with no replies from us looks abandoned and loses its early momentum." },
      { title: "Do not make every post a pitch", why: "Mostly useful posts, with an occasional offer, keeps people following. Constant selling makes them scroll past." },
      { title: "Do not copy generic motivational text", why: "Anything that could have been written by anyone gets no reaction. Our own experience is the thing nobody else has." },
      { title: "Do not paste the same text on X", why: "Long formal text suits LinkedIn, short and sharp suits X. Rewrite instead of cross-posting." },
    ],
  },
  x: {
    do: [
      { title: "Put the hook in the first line", why: "The timeline shows very little. The opening has to earn the click on its own." },
      { title: "One idea, fewer words", why: "Short posts that make one clear point are easier to like, repost and answer." },
      { title: "Use native images or video when they help", why: "A relevant image or short video stops the scroll. Test it against plain text on similar topics." },
      { title: "Use threads for depth", why: "Make the first post stand on its own and promise value, then deliver in the replies." },
      { title: "Answer every reply, quickly", why: "Conversations are weighted strongly, and an author replying back keeps a post alive in the first hour." },
      { title: "Reply to bigger accounts in our niche", why: "A useful, short reply to a post that is already getting views puts us in front of its audience." },
      { title: "Post daily and mix the types", why: "One to three posts a day, a mix of original posts, replies and quote posts, keeps us in the feed." },
      { title: "Make posts people want to save", why: "Checklists, frameworks and resources earn bookmarks, a sign that a post is useful beyond the moment." },
      { title: "Ask questions and run polls", why: "They make replying easy, and replies are the strongest signal we can generate ourselves." },
      { title: "Pin our best post and keep the bio clear", why: "Visitors decide to follow within seconds. The bio says who we help and the pinned post proves it." },
      { title: "Reuse top posts with a new hook", why: "Most followers missed it the first time. A new opening gives a good idea another chance." },
    ],
    dont: [
      { title: "Do not put links in the main post", why: "Posts with outbound links are often shown less. Put the link in a reply and compare." },
      { title: "Do not use more than one or two hashtags", why: "On X hashtags rarely add reach, and many of them look like spam." },
      { title: "Do not use engagement or rage bait", why: "RT if you agree and manufactured outrage give short bursts and long term damage to trust." },
      { title: "Do not post and disappear", why: "Replies in the first hour decide how far a post travels. Plan to be online after posting." },
      { title: "Do not post many times within minutes", why: "A burst of posts competes with itself. Space them out." },
      { title: "Do not buy followers or automate follows and likes", why: "Fake followers drag engagement rates down and automation can get the account limited." },
      { title: "Do not tag or mention lots of accounts", why: "It reads as begging for attention and can be treated as spam." },
      { title: "Do not write vague teasers", why: "Big news coming soon gives no reason to stop. Say what it is." },
      { title: "Do not paste our LinkedIn posts unchanged", why: "Long formal text gets cut off and ignored on X. Rewrite it short and sharp." },
    ],
  },
};
