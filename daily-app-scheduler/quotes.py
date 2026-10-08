"""Thought of the moment: a set of quotes that rotates every few seconds and is replaced every hour."""

import datetime as dt

QUOTES = [
    # discipline
    ("We are what we repeatedly do. Excellence, then, is not an act, but a habit.", "Will Durant", "Discipline"),
    ("You do not rise to the level of your goals. You fall to the level of your systems.", "James Clear", "Discipline"),
    ("Every action you take is a vote for the type of person you wish to become.", "James Clear", "Discipline"),
    ("Discipline equals freedom.", "Jocko Willink", "Discipline"),
    ("Hard choices, easy life. Easy choices, hard life.", "Jerzy Gregorek", "Discipline"),
    ("Motivation is what gets you started. Habit is what keeps you going.", "Jim Ryun", "Discipline"),
    ("Discipline is the bridge between goals and accomplishment.", "Jim Rohn", "Discipline"),
    ("Success is the sum of small efforts, repeated day in and day out.", "Robert Collier", "Discipline"),
    ("No man is free who is not master of himself.", "Epictetus", "Discipline"),
    ("First say to yourself what you would be; and then do what you have to do.", "Epictetus", "Discipline"),
    ("Waste no more time arguing what a good man should be. Be one.", "Marcus Aurelius", "Discipline"),
    ("Well done is better than well said.", "Benjamin Franklin", "Discipline"),
    ("Lost time is never found again.", "Benjamin Franklin", "Discipline"),
    ("Knowing is not enough; we must apply. Willing is not enough; we must do.", "Johann Wolfgang von Goethe", "Discipline"),
    ("Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", "Stephen King", "Discipline"),
    ("Long-term consistency trumps short-term intensity.", "Bruce Lee", "Discipline"),
    ("Discipline is choosing between what you want now and what you want most.", "Augusta F. Kantra", "Discipline"),
    ("Small deeds done are better than great deeds planned.", "Peter Marshall", "Discipline"),
    ("Don't count the days, make the days count.", "Muhammad Ali", "Discipline"),
    ("Well begun is half done.", "Aristotle", "Discipline"),
    ("Genius is one percent inspiration, ninety-nine percent perspiration.", "Thomas Edison", "Discipline"),
    ("You have a right to perform your prescribed duty, but you are not entitled to the fruits of action.", "Bhagavad Gita 2.47", "Discipline"),

    # focus
    ("Focus is a matter of deciding what things you're not going to do.", "John Carmack", "Focus"),
    ("Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.", "Alexander Graham Bell", "Focus"),
    ("The successful warrior is the average man, with laser-like focus.", "Bruce Lee", "Focus"),
    ("It is not that we have a short time to live, but that we waste a lot of it.", "Seneca", "Focus"),
    ("Begin at once to live, and count each separate day as a separate life.", "Seneca", "Focus"),
    ("Do the difficult things while they are easy and do the great things while they are small.", "Lao Tzu", "Focus"),
    ("Take up one idea. Make that one idea your life. Think of it, dream of it, live on that idea.", "Swami Vivekananda", "Focus"),
    ("Inspiration exists, but it has to find you working.", "Pablo Picasso", "Focus"),

    # resilience
    ("The impediment to action advances action. What stands in the way becomes the way.", "Marcus Aurelius", "Resilience"),
    ("Men are disturbed not by things, but by the views which they take of things.", "Epictetus", "Resilience"),
    ("We suffer more often in imagination than in reality.", "Seneca", "Resilience"),
    ("Difficulties strengthen the mind, as labor does the body.", "Seneca", "Resilience"),
    ("He who has a why to live can bear almost any how.", "Friedrich Nietzsche", "Resilience"),
    ("Everything can be taken from a man but one thing: the last of the human freedoms, to choose one's attitude in any given set of circumstances.", "Viktor Frankl", "Resilience"),
    ("When we are no longer able to change a situation, we are challenged to change ourselves.", "Viktor Frankl", "Resilience"),
    ("Fall seven times, stand up eight.", "Japanese proverb", "Resilience"),
    ("You may encounter many defeats, but you must not be defeated.", "Maya Angelou", "Resilience"),
    ("Tough times never last, but tough people do.", "Robert H. Schuller", "Resilience"),
    ("Courage doesn't always roar. Sometimes courage is the quiet voice at the end of the day saying, 'I will try again tomorrow.'", "Mary Anne Radmacher", "Resilience"),
    ("I've missed more than 9000 shots in my career. I've failed over and over and over again in my life. And that is why I succeed.", "Michael Jordan", "Resilience"),
    ("Strength does not come from winning. Your struggles develop your strengths.", "Arnold Schwarzenegger", "Resilience"),
    ("A smooth sea never made a skilled sailor.", "English proverb", "Resilience"),
    ("Life is like riding a bicycle. To keep your balance you must keep moving.", "Albert Einstein", "Resilience"),
    ("The credit belongs to the man who is actually in the arena.", "Theodore Roosevelt", "Resilience"),
    ("Do what you can, with what you have, where you are.", "Theodore Roosevelt", "Resilience"),
    ("Be not afraid of growing slowly, be afraid only of standing still.", "Chinese proverb", "Resilience"),
    ("A river cuts through rock, not because of its power, but because of its persistence.", "Jim Watkins", "Resilience"),
    ("Perseverance is not a long race; it is many short races one after the other.", "Walter Elliot", "Resilience"),
    ("Strength is life, weakness is death.", "Swami Vivekananda", "Resilience"),
    ("The roots of education are bitter, but the fruit is sweet.", "Aristotle", "Resilience"),

    # motivation
    ("Arise, awake, and stop not till the goal is reached.", "Swami Vivekananda", "Motivation"),
    ("Dream is not that which you see while sleeping, it is something that does not let you sleep.", "A. P. J. Abdul Kalam", "Motivation"),
    ("If you want to shine like a sun, first burn like a sun.", "A. P. J. Abdul Kalam", "Motivation"),
    ("Excellence is a continuous process and not an accident.", "A. P. J. Abdul Kalam", "Motivation"),
    ("The journey of a thousand miles begins with a single step.", "Lao Tzu", "Motivation"),
    ("The only way to do great work is to love what you do.", "Steve Jobs", "Motivation"),
    ("You miss 100% of the shots you don't take.", "Wayne Gretzky", "Motivation"),
    ("Hard work beats talent when talent doesn't work hard.", "Tim Notke", "Motivation"),
    ("Ships in harbor are safe, but that's not what ships are built for.", "John A. Shedd", "Motivation"),
    ("Education is the most powerful weapon which you can use to change the world.", "Nelson Mandela", "Motivation"),
    ("The expert in anything was once a beginner.", "Helen Hayes", "Motivation"),
    ("Act as if what you do makes a difference. It does.", "William James", "Motivation"),
    ("If you want to go fast, go alone. If you want to go far, go together.", "African proverb", "Motivation"),
    ("The secret of change is to focus all of your energy not on fighting the old, but on building the new.", "Dan Millman", "Motivation"),
    ("The best time to plant a tree was 20 years ago. The second best time is now.", "Proverb", "Motivation"),
    ("Do not wait; the time will never be 'just right.' Start where you stand.", "Napoleon Hill", "Motivation"),
]


SET_SIZE = 8  # quotes per hour
SLIDE_SECONDS = 15  # each quote stays this long


def hourly_set(moment: dt.datetime) -> list[tuple[str, str, str]]:
    """A fresh set of quotes every hour; the sets go through the whole list before repeating."""
    hour_number = moment.date().toordinal() * 24 + moment.hour
    return [QUOTES[((hour_number * SET_SIZE + i) * 37) % len(QUOTES)] for i in range(SET_SIZE)]


def current(moment: dt.datetime) -> tuple[int, list[tuple[str, str, str]]]:
    """(index of the quote to show now, this hour's set)."""
    seconds_into_hour = moment.minute * 60 + moment.second
    return (seconds_into_hour // SLIDE_SECONDS) % SET_SIZE, hourly_set(moment)
