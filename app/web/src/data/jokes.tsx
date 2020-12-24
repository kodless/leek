let jokes = [
    {
        joke: "We don't have any vegetables jokes yet, so if you do lettuce know",
        img: "lettuce.svg"
    },
    {
        joke: "Funny fact, carrot is orange but orange is not carrot",
        img: "carrot.svg"
    },
    {
        joke: "Please don't cry about me",
        img: "onion.svg"
    },
    {
        joke: "Potatoes make french fries, chips and Vodka. it's like the other vegetables aren't even trying",
        img: "potatoes.svg"
    },
    {
        joke: "Cauliflower is nothing but cabbage with a college education",
        img: "cauliflower.svg"
    },
    {
        joke: "Maybe broccoli doesn't like you either",
        img: "broccoli.svg"
    },
    {
        joke: "I know i'm supposed to be fruit, but I feel like a vegetable",
        img: "tomato.svg"
    },
    {
        joke: "Knowledge is knowing that tomato is a fruit, wisdom is not putting it in a fruit salad",
        img: "tomato.svg"
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