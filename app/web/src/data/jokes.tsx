let jokes = [
  {
    joke: "We don't have any vegetables jokes yet, so if you do lettuce know",
    img: "lettuce.svg",
  },
  {
    joke: "Funny fact, carrot is orange but orange is not carrot",
    img: "carrot.svg",
  },
  {
    joke: "The garlic said to the onion `you stink`",
    img: "onion.svg",
  },
  {
    joke: "Potatoes make french fries, chips and Vodka. it's like the other vegetables aren't even trying",
    img: "potatoes.svg",
  },
  {
    joke: "Cauliflower is nothing but cabbage with a college education",
    img: "cauliflower.svg",
  },
  {
    joke: "Maybe broccoli doesn't like you either",
    img: "broccoli.svg",
  },
  {
    joke: "I know i'm supposed to be fruit, but I feel like a vegetable",
    img: "tomato.svg",
  },
  {
    joke: "Knowledge is knowing that tomato is a fruit, wisdom is not putting it in a fruit salad",
    img: "tomato.svg",
  },
  {
    joke: "A nickel will get you on the subway, but garlic will get you a seat",
    img: "garlic.svg",
  },
  {
    joke: "The human body is 90% water so we're basically just cucumbers with anxiety",
    img: "cucumber.svg",
  },
  {
    joke: "The cucumber is just a pickle before it started drinking",
    img: "cucumber.svg",
  },
  {
    joke: "Celery is 95% water and 100% not pizza",
    img: "celery.svg",
  },
  {
    joke: "Why is there no egg in eggplant and no ham in hamburger?",
    img: "eggplant.svg",
  },
  {
    joke: "I don't mean to to brag, but I've been told I'm kinda hot",
    img: "pepper.svg",
  },
  {
    joke: "All mushrooms are edible, but some only once in a lifetime",
    img: "mushroom.svg",
  },
  {
    joke: "The turnip is a capricious vegetable, which seems reluctant to show itself at its best",
    img: "turnip.svg",
  },
  {
    joke: "I don't always turnip at parties. but when I do, I'm the radish guy there",
    img: "turnip.svg",
  },
];

/**
 * Shuffles jokes in place.
 */
export function getJokes() {
  for (let i = jokes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [jokes[i], jokes[j]] = [jokes[j], jokes[i]];
  }
  return jokes;
}
