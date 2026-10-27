import { describe, expect, it } from 'vitest';
import { evaluateIngredients } from '../ingredientEngine';
import { KNOWLEDGE_BASE_BUILD_DATE } from '../knowledgeBase';

describe('evaluateIngredients — PRD Sec 27 (Known ≠ Assumed)', () => {
  it('returns unknown for empty text', () => {
    const result = evaluateIngredients('   ');
    expect(result.verdict).toBe('unknown');
    expect(result.ingredients).toHaveLength(0);
  });

  it('never returns vegetarian for unrecognized long text', () => {
    const result = evaluateIngredients(
      'Mixed Asian herbs, proprietary flavor compound #94, stabilizer, mineral salts.'
    );
    expect(result.verdict).toBe('unknown');
  });

  it('does not flag weights or counts as additives', () => {
    const result = evaluateIngredients('Net weight 120g sugar, salt, 471 calories per pack.');
    expect(result.ingredients).toHaveLength(0);
    expect(result.verdict).toBe('unknown');
  });

  it('flags INS 471 as sourceUndisclosed without manufacturer proof', () => {
    const result = evaluateIngredients('Wheat Flour, Emulsifier (INS 471), Salt.');
    expect(result.verdict).toBe('sourceUndisclosed');
    expect(result.ingredients[0].code).toContain('E471');
    expect(result.summary).toContain('Known ≠ Assumed');
  });

  it('flags gelatin (E441) as nonVegetarian with high confidence', () => {
    const result = evaluateIngredients('Corn Syrup, Sugar, Gelatin (E441).');
    expect(result.verdict).toBe('nonVegetarian');
    expect(result.confidence).toBeGreaterThanOrEqual(90);
  });

  it('lets nonVegetarian win over sourceUndisclosed', () => {
    const result = evaluateIngredients('Emulsifier (E471), Gelatin (E441).');
    expect(result.verdict).toBe('nonVegetarian');
  });

  it('escalates undisclosed to nonVegetarian in strict mode', () => {
    const result = evaluateIngredients('Emulsifier (INS 471).', { strictUndisclosedMode: true });
    expect(result.verdict).toBe('nonVegetarian');
    expect(result.flaggedReasons.some((r) => r.includes('Strict Undisclosed'))).toBe(true);
  });

  it('treats dairy as vegetarian by default and nonVegetarian for vegans', () => {
    const veg = evaluateIngredients('Milk, Sugar, Cocoa.');
    expect(veg.verdict).toBe('vegetarian');
    const vegan = evaluateIngredients('Milk, Sugar, Cocoa.', { dietType: 'vegan' });
    expect(vegan.verdict).toBe('nonVegetarian');
  });

  it('ignores plant lookalikes via allowlist', () => {
    const result = evaluateIngredients(
      'Beefsteak tomato, cream of tartar, milk thistle, curdlan, cocoa butter, chicken of the woods, fish mint.'
    );
    expect(result.ingredients).toHaveLength(0);
    expect(result.verdict).toBe('unknown');
  });

  it('keeps sourceDependent when the label discloses plant origin', () => {
    const result = evaluateIngredients('Humectant (E422), green dot certified vegetarian.');
    const glycerin = result.ingredients.find((i) => i.code?.includes('E422'));
    expect(glycerin?.verdict).toBe('sourceDependent');
    expect(glycerin?.manufacturerDisclosed).toBe(true);
  });

  it('caps very long input instead of freezing', () => {
    const big = `Sugar, Salt, E471. `.repeat(2000);
    const result = evaluateIngredients(big);
    expect(result.verdict).toBe('sourceUndisclosed');
  });

  it('applies sourcePenalty for weak web sources', () => {
    const direct = evaluateIngredients('Emulsifier (INS 471).');
    const web = evaluateIngredients('Emulsifier (INS 471).', {}, { sourcePenalty: 10 });
    expect(web.confidence).toBe(direct.confidence - 10);
  });

  it('flags egg as nonVegetarian for the default strict diet', () => {
    const result = evaluateIngredients('Water, Egg, Acidity Regulator (E330).');
    expect(result.verdict).toBe('nonVegetarian');
    const eggRow = result.ingredients.find((i) => /egg/i.test(i.name));
    expect(eggRow?.verdict).toBe('nonVegetarian');
  });

  it('flags mayonnaise (egg-based) as nonVegetarian', () => {
    const result = evaluateIngredients('Mayonnaise: Egg, Mustard, Antioxidant (E300).');
    expect(result.verdict).toBe('nonVegetarian');
  });

  it('allows egg only for flexible diets', () => {
    const result = evaluateIngredients('Water, Egg, Sugar.', { dietType: 'flexible' });
    expect(result.verdict).toBe('vegetarian');
  });

  it('never flags eggless or vegan egg alternatives as animal egg', () => {
    const eggless = evaluateIngredients('Water, Eggless Mayonnaise, Mustard, Sugar, Salt.');
    expect(eggless.ingredients.filter((i) => i.verdict === 'nonVegetarian')).toHaveLength(0);

    const veganEgg = evaluateIngredients('Flour, Vegan Egg replacer, Sugar.');
    expect(veganEgg.ingredients.filter((i) => i.verdict === 'nonVegetarian')).toHaveLength(0);

    const eggplant = evaluateIngredients('Eggplant, Olive Oil, Salt.');
    expect(eggplant.ingredients.filter((i) => i.verdict === 'nonVegetarian')).toHaveLength(0);
  });

  it('flags detailed egg derivatives (powder, yolk, white, ovalbumin) as nonVegetarian', () => {
    expect(evaluateIngredients('Water, Egg Yolk Powder, Sugar.').verdict).toBe('nonVegetarian');
    expect(evaluateIngredients('Flour, Dried Egg, Salt.').verdict).toBe('nonVegetarian');
    expect(evaluateIngredients('Sugar, Ovalbumin, Citric Acid.').verdict).toBe('nonVegetarian');
  });

  it('evaluates E1105 Lysozyme according to diet type', () => {
    const strict = evaluateIngredients('Preservative (INS 1105), Water.');
    expect(strict.verdict).toBe('nonVegetarian');
    const flex = evaluateIngredients('Preservative (INS 1105), Water.', { dietType: 'flexible' });
    expect(flex.verdict).toBe('vegetarian');
  });

  it('never treats plant milks, vegan cheese or nut butters as animal dairy', () => {
    const vegan = evaluateIngredients('Water, Coconut Milk, Sugar, Salt.', { dietType: 'vegan' });
    expect(vegan.verdict).not.toBe('nonVegetarian');
    expect(vegan.ingredients.filter((i) => i.verdict === 'nonVegetarian')).toHaveLength(0);
    const veganButter = evaluateIngredients('Almond Butter, Cane Sugar.', { dietType: 'vegan' });
    expect(veganButter.ingredients.filter((i) => i.verdict === 'nonVegetarian')).toHaveLength(0);
    const withCode = evaluateIngredients('Coconut Milk, Sugar, Acidity Regulator (E330).', {
      dietType: 'vegan',
    });
    expect(withCode.verdict).toBe('vegetarian');

    const oatMilk = evaluateIngredients('Oat-milk, Sugar, Salt.', { dietType: 'vegan' });
    expect(oatMilk.ingredients.filter((i) => i.verdict === 'nonVegetarian')).toHaveLength(0);

    const veganCheese = evaluateIngredients('Water, Vegan Cheese, Starch.', { dietType: 'vegan' });
    expect(veganCheese.ingredients.filter((i) => i.verdict === 'nonVegetarian')).toHaveLength(0);

    const dairyFree = evaluateIngredients('Dairy-free milk, Sugar.', { dietType: 'vegan' });
    expect(dairyFree.ingredients.filter((i) => i.verdict === 'nonVegetarian')).toHaveLength(0);
  });

  it('resolves hyphenated and plural forms of mono- and diglycerides', () => {
    const res1 = evaluateIngredients('Emulsifier (Mono- and diglycerides).');
    expect(res1.verdict).toBe('sourceUndisclosed');
    expect(res1.ingredients[0].code).toContain('E471');

    const res2 = evaluateIngredients('Contains monoglycerides.');
    expect(res2.verdict).toBe('sourceUndisclosed');
    expect(res2.ingredients[0].code).toContain('E471');
  });

  it('matches plural animal keywords', () => {
    expect(evaluateIngredients('Salt, Duck Feathers, Spices.').verdict).toBe('nonVegetarian');
    expect(evaluateIngredients('Sweets (Glucose Syrup, Gelatins), Citric Acid.').verdict).toBe(
      'nonVegetarian'
    );
  });

  it('downgrades undisclosed E471 when the label discloses plant origin', () => {
    const result = evaluateIngredients('Emulsifier (E471) from vegetable fat. Green dot certified.');
    const e471 = result.ingredients.find((i) => i.code?.includes('E471'));
    expect(e471?.verdict).toBe('sourceDependent');
    expect(e471?.manufacturerDisclosed).toBe(true);
    expect(result.verdict).toBe('sourceDependent');
  });

  it('dates additive evidence from the knowledge-base build, not a fabricated constant', () => {
    const result = evaluateIngredients('Emulsifier (INS 471).');
    expect(result.ingredients[0].evidenceTrail?.[0].date).toBe(KNOWLEDGE_BASE_BUILD_DATE);
  });

  it('derives per-additive evidence confidence from match quality', () => {
    const coded = evaluateIngredients('Emulsifier (INS 471).');
    const named = evaluateIngredients('Contains monoglycerides.');
    const codedScore = coded.ingredients[0].evidenceTrail?.[0].confidenceScore ?? 0;
    const namedScore = named.ingredients[0].evidenceTrail?.[0].confidenceScore ?? 0;
    expect(codedScore).toBeGreaterThan(namedScore);
  });

  it('flags truncation of oversized ingredient text', () => {
    const big = `${'Sugar, salt, calcium carbonate. '.repeat(600)}Emulsifier (E471).`;
    const result = evaluateIngredients(big);
    expect(result.flaggedReasons.some((r) => /truncated/i.test(r))).toBe(true);
  });

  it('keeps bone phosphate nonVegetarian; the flag only gates the watchlist note', () => {
    expect(evaluateIngredients('Contains bone phosphate.').verdict).toBe('nonVegetarian');
    const off = evaluateIngredients('Contains bone phosphate.', { flagBonePhosphate: false });
    expect(off.verdict).toBe('nonVegetarian');
    const coded = evaluateIngredients('Anti-caking agent (E542).', { flagBonePhosphate: true });
    expect(coded.flaggedReasons.some((r) => r.includes('E542'))).toBe(true);
    const codedOff = evaluateIngredients('Anti-caking agent (E542).', { flagBonePhosphate: false });
    expect(codedOff.flaggedReasons.some((r) => r.includes('E542'))).toBe(false);
  });

  it('does not double-count bees wax alongside the E901 entry', () => {
    const result = evaluateIngredients('Glazing agent (bees wax).');
    expect(result.ingredients.filter((i) => /bees\s?wax/i.test(i.name))).toHaveLength(1);
  });

  it('treats beeswax and shellac consistently for disclosure', () => {
    const shellac = evaluateIngredients('Glazing Agent (Shellac E904).');
    const wax = evaluateIngredients('Glazing agent (E901 Beeswax).');
    expect(wax.ingredients.find((i) => i.code?.includes('E901'))?.verdict).toBe(
      shellac.ingredients.find((i) => i.code?.includes('E904'))?.verdict
    );
  });
});
