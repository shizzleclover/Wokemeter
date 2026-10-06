window.QUESTIONS = [
  {
    id: "values_ranking",
    type: "rank",
    version: "1.0",
    category: "Values & Priorities",
    text: "Drag and drop to rank these values from most important (top) to least important (bottom).",
    options: ["Personal Freedom", "Social Equality", "National Security", "Traditional Morality", "Technological Progress"]
  },
  {
    id: "abortion_murder",
    type: "choice",
    version: "1.0",
    category: "Abortion",
    text: "Is abortion murder?",
    options: ["Strongly agree", "Agree", "Somewhat agree", "Unsure", "Somewhat disagree", "Disagree", "Strongly disagree"]
  },
  {
    id: "abortion_rape",
    type: "choice",
    version: "1.0",
    category: "Abortion",
    text: "If abortion is generally immoral, should it still be legally permitted when the pregnancy resulted from rape?",
    options: ["Strongly agree", "Agree", "Somewhat agree", "Unsure", "Somewhat disagree", "Disagree", "Strongly disagree"]
  },
  {
    id: "abortion_punishment",
    type: "essay",
    version: "1.0",
    category: "Abortion",
    text: "If you believe abortion is morally wrong, should the woman who gets one face criminal punishment? Explain why or why not.",
    placeholder: "Explain the difference, if any, between something being morally wrong and something being criminal..."
  },
  {
    id: "death_penalty",
    type: "choice",
    version: "1.0",
    category: "Punishment",
    text: "Should the death penalty exist for people who deliberately murder another person?",
    options: ["Strongly agree", "Agree", "Somewhat agree", "Unsure", "Somewhat disagree", "Disagree", "Strongly disagree"]
  },
  {
    id: "life_sentence",
    type: "choice",
    version: "1.0",
    category: "Punishment",
    text: "If someone deliberately murders another person, should they ever be eligible for release from prison?",
    options: ["Strongly agree", "Agree", "Somewhat agree", "Unsure", "Somewhat disagree", "Disagree", "Strongly disagree"]
  },
  {
    id: "self_defense",
    type: "essay",
    version: "1.0",
    category: "Murder",
    text: "Someone breaks into your home at night and you reasonably believe they are about to kill your family. You have the opportunity to kill them first. Is killing them morally justified? Explain.",
    placeholder: "Explain what principle you would use to decide..."
  },
  {
    id: "rape_consent",
    type: "choice",
    version: "1.0",
    category: "Sexual Ethics",
    text: "If someone continues having sex after their partner clearly says 'stop', is that rape even if the partner consented initially?",
    options: ["Strongly agree", "Agree", "Somewhat agree", "Unsure", "Somewhat disagree", "Disagree", "Strongly disagree"]
  },
  {
    id: "intoxicated_consent",
    type: "choice",
    version: "1.0",
    category: "Sexual Ethics",
    text: "If someone is so intoxicated that they cannot meaningfully consent, should sex with them be considered rape even if they never explicitly said no?",
    options: ["Strongly agree", "Agree", "Somewhat agree", "Unsure", "Somewhat disagree", "Disagree", "Strongly disagree"]
  },
  {
    id: "false_accusation",
    type: "essay",
    version: "1.0",
    category: "Sexual Ethics",
    text: "Should someone who knowingly makes a deliberately false rape accusation face serious criminal punishment? Explain what you think is fair.",
    placeholder: "Think about intent, harm, evidence, and proportional punishment..."
  },
  {
    id: "free_speech",
    type: "choice",
    version: "1.0",
    category: "Free Speech",
    text: "Should people be legally allowed to express opinions that most people consider deeply offensive, as long as they are not directly threatening anyone?",
    options: ["Strongly agree", "Agree", "Somewhat agree", "Unsure", "Somewhat disagree", "Disagree", "Strongly disagree"]
  },
  {
    id: "offensive_job",
    type: "choice",
    version: "1.0",
    category: "Free Speech",
    text: "Should someone be fired from their job for a genuinely offensive political opinion they expressed outside of work?",
    options: ["Strongly agree", "Agree", "Somewhat agree", "Unsure", "Somewhat disagree", "Disagree", "Strongly disagree"]
  },
  {
    id: "speech_personal",
    type: "essay",
    version: "1.0",
    category: "Free Speech",
    text: "What principle should determine when offensive speech crosses the line from something society should tolerate into something that should have consequences?",
    placeholder: "There is no correct answer. Explain your actual principle..."
  },
  {
    id: "religion_children",
    type: "choice",
    version: "1.0",
    category: "Religion",
    text: "Should parents generally be allowed to raise their children according to their religious beliefs, even when those beliefs conflict with mainstream social values?",
    options: ["Strongly agree", "Agree", "Somewhat agree", "Unsure", "Somewhat disagree", "Disagree", "Strongly disagree"]
  },
  {
    id: "religion_law",
    type: "choice",
    version: "1.0",
    category: "Religion",
    text: "Should religious beliefs ever be allowed to override a generally applicable civil law?",
    options: ["Strongly agree", "Agree", "Somewhat agree", "Unsure", "Somewhat disagree", "Disagree", "Strongly disagree"]
  },
  {
    id: "religion_essay",
    type: "essay",
    version: "1.0",
    category: "Religion",
    text: "Can a society respect religious freedom while still restricting religious practices that it considers harmful? Explain where you would draw the line.",
    placeholder: "Explain your boundary..."
  },
  {
    id: "affirmative_action",
    type: "choice",
    version: "1.0",
    category: "Race & Ethnicity",
    text: "If two candidates are equally qualified, is it acceptable for an employer to prefer the candidate from an underrepresented ethnic group?",
    options: ["Strongly agree", "Agree", "Somewhat agree", "Unsure", "Somewhat disagree", "Disagree", "Strongly disagree"]
  },
  {
    id: "racial_dating",
    type: "choice",
    version: "1.0",
    category: "Race & Ethnicity",
    text: "Is it inherently racist to have a racial preference when choosing romantic partners?",
    options: ["Strongly agree", "Agree", "Somewhat agree", "Unsure", "Somewhat disagree", "Disagree", "Strongly disagree"]
  },
  {
    id: "ethnic_priority",
    type: "essay",
    version: "1.0",
    category: "Nigeria",
    text: "If a scarce opportunity can go to one equally qualified Nigerian from your ethnic group or another equally qualified Nigerian from a different ethnic group, is it ever morally acceptable to favor your own group? Explain.",
    placeholder: "Explain whether identity should matter and why..."
  },
  {
    id: "sex_gender",
    type: "choice",
    version: "1.0",
    category: "Gender",
    text: "When there is a conflict between biological sex and a person's gender identity, should legal institutions generally prioritize gender identity?",
    options: ["Strongly agree", "Agree", "Somewhat agree", "Unsure", "Somewhat disagree", "Disagree", "Strongly disagree"]
  },
  {
    id: "trans_sports",
    type: "choice",
    version: "1.0",
    category: "Gender",
    text: "Should transgender women be allowed to compete in women's sports under the same rules as other women?",
    options: ["Strongly agree", "Agree", "Somewhat agree", "Unsure", "Somewhat disagree", "Disagree", "Strongly disagree"]
  },
  {
    id: "gender_roles",
    type: "essay",
    version: "1.0",
    category: "Gender",
    text: "Do you think men and women naturally tend to have different interests or roles? If yes, how much of that difference comes from biology versus culture?",
    placeholder: "Give your actual view, even if you're uncertain..."
  },
  {
    id: "wealth",
    type: "choice",
    version: "1.0",
    category: "Money",
    text: "Should extremely wealthy people be taxed significantly more even if they acquired their wealth legally?",
    options: ["Strongly agree", "Agree", "Somewhat agree", "Unsure", "Somewhat disagree", "Disagree", "Strongly disagree"]
  },
  {
    id: "wealth_limit",
    type: "essay",
    version: "1.0",
    category: "Money",
    text: "Is there a point at which one person can have so much wealth that society is justified in taking more of it through taxation? Explain.",
    placeholder: "Explain what makes wealth legitimate or excessive in your view..."
  },
  {
    id: "immigration",
    type: "choice",
    version: "1.0",
    category: "Immigration",
    text: "Should a country prioritize the economic interests of its existing citizens over making immigration easier?",
    options: ["Strongly agree", "Agree", "Somewhat agree", "Unsure", "Somewhat disagree", "Disagree", "Strongly disagree"]
  },
  {
    id: "immigration_essay",
    type: "essay",
    version: "1.0",
    category: "Immigration",
    text: "What do you think a country owes to people who want to immigrate to it, if anything?",
    placeholder: "Think about borders, opportunity, security, and human rights..."
  },
  {
    id: "drugs",
    type: "choice",
    version: "1.0",
    category: "Drugs",
    text: "Should adults be legally allowed to use recreational drugs if their use does not directly harm another person?",
    options: ["Strongly agree", "Agree", "Somewhat agree", "Unsure", "Somewhat disagree", "Disagree", "Strongly disagree"]
  },
  {
    id: "drugs_paternalism",
    type: "essay",
    version: "1.0",
    category: "Drugs",
    text: "When, if ever, should the government protect adults from their own harmful choices?",
    placeholder: "Explain where personal freedom ends and public responsibility begins..."
  },
  {
    id: "privacy",
    type: "choice",
    version: "1.0",
    category: "Privacy",
    text: "Should governments be allowed to conduct extensive digital surveillance if it significantly reduces the risk of terrorism or serious crime?",
    options: ["Strongly agree", "Agree", "Somewhat agree", "Unsure", "Somewhat disagree", "Disagree", "Strongly disagree"]
  },
  {
    id: "cancel_culture",
    type: "choice",
    version: "1.0",
    category: "Culture",
    text: "Is it reasonable for society to socially punish someone for a controversial opinion even when the opinion is legal to express?",
    options: ["Strongly agree", "Agree", "Somewhat agree", "Unsure", "Somewhat disagree", "Disagree", "Strongly disagree"]
  },
  {
    id: "personal_principle",
    type: "essay",
    version: "1.0",
    category: "Meta",
    text: "What's one belief you hold that you think most people would judge you for? Explain why you hold it.",
    placeholder: "This is the place to be honest rather than socially acceptable..."
  }
];
window.QUESTIONS.push(
  {
    id: "universal_basic_income",
    type: "choice",
    version: "1.0",
    category: "Economics",
    text: "Should the government provide a Universal Basic Income to all citizens regardless of employment status?",
    options: ["Strongly agree", "Agree", "Somewhat agree", "Unsure", "Somewhat disagree", "Disagree", "Strongly disagree"]
  },
  {
    id: "cancel_culture_impact",
    type: "essay",
    version: "1.0",
    category: "Culture",
    text: "Does 'cancel culture' hold people accountable, or does it create a toxic environment of fear? Explain."
  },
  {
    id: "ai_automation",
    type: "choice",
    version: "1.0",
    category: "Technology",
    text: "Is the rapid advancement of Artificial Intelligence a net positive or net negative for society?",
    options: ["Overwhelmingly positive", "Mostly positive", "Slightly positive", "Unsure", "Slightly negative", "Mostly negative", "Overwhelmingly negative"]
  },
  {
    id: "billionaire_existence",
    type: "choice",
    version: "1.0",
    category: "Economics",
    text: "Is the existence of billionaires a policy failure?",
    options: ["Strongly agree", "Agree", "Somewhat agree", "Unsure", "Somewhat disagree", "Disagree", "Strongly disagree"]
  },
  {
    id: "nuclear_energy",
    type: "choice",
    version: "1.0",
    category: "Environment",
    text: "Should we aggressively expand nuclear energy to combat climate change?",
    options: ["Strongly agree", "Agree", "Somewhat agree", "Unsure", "Somewhat disagree", "Disagree", "Strongly disagree"]
  }
);
