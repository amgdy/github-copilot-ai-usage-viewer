/**
 * Compares the built-in price card (src/lib/pricing/card.ts) with the live GitHub Docs page
 * "Models and pricing for GitHub Copilot". Run: npm run check:prices
 * Exit code 0: the card matches. Exit code 1: something differs (the differences are printed).
 */
import { CARD_AS_OF, CARD_SOURCE } from '../src/lib/pricing/card.ts';
import { compareWithCard, fetchLivePriceCard } from '../src/lib/pricing/docsParser.ts';

// Temporal is built into Node 26, so date math needs no Date tricks or extra packages.
const cardAgeInDays = Temporal.PlainDate.from(CARD_AS_OF).until(Temporal.Now.plainDateISO()).days;
const livePriceCard = await fetchLivePriceCard();
const priceDifferences = compareWithCard(livePriceCard.models);

const cardAgeText = cardAgeInDays === 1 ? '1 day old' : `${cardAgeInDays} days old`;
console.log(`Built-in card: ${CARD_AS_OF} (${cardAgeText}). Live page: ${CARD_SOURCE}`);
console.log(`Models on the live page: ${livePriceCard.models.length}`);
for (const warning of livePriceCard.warnings) console.log(`Warning: ${warning}`);

if (priceDifferences.length === 0) {
  console.log('The built-in card matches the live page.');
} else {
  for (const difference of priceDifferences) {
    if (difference.kind === 'new') console.log(`New on GitHub Docs: ${difference.name} ${JSON.stringify(difference.live)}`);
    else if (difference.kind === 'missing') console.log(`Not on GitHub Docs anymore: ${difference.name}`);
    else console.log(`Changed: ${difference.name} (${difference.fields.join(', ')}) live ${JSON.stringify(difference.live)}`);
  }
  console.log('Update src/lib/pricing/card.ts and CARD_AS_OF, then run the tests.');
  process.exitCode = 1;
}
