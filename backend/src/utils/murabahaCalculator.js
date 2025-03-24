// Murabaha markup rates by duration
// These rates represent the profit markup percentage over the cost price
const MARKUP_RATES = {
  7: 0.025,   // 2.5% for 7 days
  14: 0.05,   // 5% for 14 days
  21: 0.075,  // 7.5% for 21 days
  30: 0.10,   // 10% for 30 days
};

/**
 * Calculate Murabaha financing terms
 * All calculation MUST happen on backend - never on frontend
 */
const calculateMurabaha = (costPrice, durationDays) => {
  const rate = MARKUP_RATES[durationDays];
  if (!rate) throw new Error(`Invalid duration. Must be 7, 14, 21, or 30 days.`);

  const profitMarkup = Math.round(costPrice * rate);
  const totalRepaymentAmount = costPrice + profitMarkup;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + durationDays);

  return {
    costPrice,
    profitMarkup,
    totalRepaymentAmount,
    markupRate: rate,
    markupPercentage: rate * 100,
    durationDays,
    dueDate,
  };
};

/**
 * Get markup rate description for display
 */
const getMarkupDescription = (durationDays) => {
  const rate = MARKUP_RATES[durationDays];
  return `${(rate * 100).toFixed(1)}% profit markup for ${durationDays}-day Murabaha financing`;
};

module.exports = { calculateMurabaha, getMarkupDescription, MARKUP_RATES };
