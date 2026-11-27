// "What can I cook?" — ranks recipes by how much of them the pantry covers.
// Pure functions, no DOM.

export function suggestFromPantry(recipes, pantry, staples, { expiringKeys = [], minScore = 0.5 } = {}) {
  const haveKeys = new Set(pantry.filter((p) => p.key && Number(p.qty) > 0).map((p) => p.key));

  return recipes.map((r) => {
    const have = [], missing = [], staple = [], usesExpiring = [];
    for (const i of r.ingredients) {
      if (haveKeys.has(i.key)) {
        have.push(i.key);
        if (expiringKeys.includes(i.key)) usesExpiring.push(i.key);
      } else if (staples.includes(i.key)) {
        staple.push(i.key);
      } else {
        missing.push(i.key);
      }
    }
    const score = (have.length + staple.length) / r.ingredients.length;
    return { recipe: r, score, have, missing, staple, usesExpiring };
  })
    .filter((s) => s.have.length > 0 && s.score >= minScore)
    .sort((a, b) => (b.usesExpiring.length - a.usesExpiring.length) || (b.score - a.score) || (a.missing.length - b.missing.length));
}
