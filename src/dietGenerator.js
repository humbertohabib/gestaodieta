function round(value) {
  return Math.round(value * 10) / 10;
}

function activityFactor(activity) {
  const factors = {
    sedentario: 1.2,
    leve: 1.375,
    moderado: 1.55,
    intenso: 1.725,
    atleta: 1.9
  };
  return factors[activity] || factors.moderado;
}

function goalAdjustment(goal) {
  const adjustments = {
    emagrecimento: -450,
    recomposicao: -150,
    manutencao: 0,
    hipertrofia: 350
  };
  return adjustments[goal] || 0;
}

function basalMetabolicRate({ sex, weight, height, age }) {
  const base = 10 * Number(weight) + 6.25 * Number(height) - 5 * Number(age);
  return sex === 'feminino' ? base - 161 : base + 5;
}

function generateDiet(input) {
  const weight = Number(input.weight);
  const height = Number(input.height);
  const age = Number(input.age);
  const mealsCount = Math.max(3, Math.min(Number(input.mealsCount) || 5, 7));
  const bmr = basalMetabolicRate({ sex: input.sex, weight, height, age });
  const targetCalories = Math.max(1200, Math.round(bmr * activityFactor(input.activity) + goalAdjustment(input.goal)));
  const proteinGrams = Math.round(weight * (input.goal === 'hipertrofia' ? 2.1 : 1.8));
  const fatGrams = Math.round((targetCalories * 0.27) / 9);
  const carbGrams = Math.max(80, Math.round((targetCalories - proteinGrams * 4 - fatGrams * 9) / 4));

  const mealTemplates = [
    { name: 'Cafe da manha', pct: 0.22, foods: ['ovos', 'fruta', 'aveia ou pao integral'] },
    { name: 'Lanche da manha', pct: 0.1, foods: ['iogurte ou whey', 'castanhas'] },
    { name: 'Almoco', pct: 0.28, foods: ['proteina magra', 'arroz ou batata', 'legumes', 'salada'] },
    { name: 'Lanche da tarde', pct: 0.13, foods: ['fruta', 'fonte proteica'] },
    { name: 'Jantar', pct: 0.22, foods: ['proteina magra', 'carboidrato ajustado', 'vegetais'] },
    { name: 'Ceia', pct: 0.05, foods: ['caseina, iogurte ou ovos'] },
    { name: 'Pre-treino', pct: 0.1, foods: ['banana', 'cafe', 'carboidrato leve'] }
  ].slice(0, mealsCount);

  const pctTotal = mealTemplates.reduce((sum, meal) => sum + meal.pct, 0);
  const meals = mealTemplates.map((meal) => {
    const share = meal.pct / pctTotal;
    return {
      name: meal.name,
      calories: Math.round(targetCalories * share),
      protein: round(proteinGrams * share),
      carbs: round(carbGrams * share),
      fat: round(fatGrams * share),
      foods: meal.foods
    };
  });

  return {
    calories: targetCalories,
    protein: proteinGrams,
    carbs: carbGrams,
    fat: fatGrams,
    meals,
    notes: [
      'Modelo matematico MVP baseado em Mifflin-St Jeor.',
      'Substitua este modulo pela logica VBA traduzida quando ela for fornecida.',
      input.restrictions ? `Restricoes consideradas: ${input.restrictions}.` : 'Sem restricoes alimentares declaradas.'
    ]
  };
}

module.exports = { generateDiet };
