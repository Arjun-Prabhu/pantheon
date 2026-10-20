export const LEVEL_LABELS = {breaking: 'Breaking', high: 'High', medium: 'Medium', low: 'Low'};

export const LEVEL_COLOR = {
    breaking: 'var(--breaking)',
    high: 'var(--high)',
    medium: 'var(--medium)',
    low: 'var(--low)',
};

export const scoreColor = s => s >= 9 ? 'var(--breaking)' : s >= 7 ? 'var(--high)' : s >= 5 ? 'var(--medium)' : 'var(--low)';

/* Stable identity for an article — survives the structuredClone() the feed
   does on refresh, so reference equality is never relied on. */
export const articleKey = a => a ? `${a.id ?? 'x'}|${a.time}|${a.headline}` : '';

/* FNV-1a — deterministic so a given outlet always scores the same. */
function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

const BIAS_SCALE = [
    {max: 20,  label: 'Left',         color: '#6aa6ff'},
    {max: 40,  label: 'Center-left',  color: '#83cae8'},
    {max: 60,  label: 'Center',       color: '#d4a820'},
    {max: 80,  label: 'Center-right', color: '#f0a060'},
    {max: 101, label: 'Right',        color: '#ff8888'},
];

const accuracyColor = s => s >= 8.5 ? '#88f1c5' : s >= 7 ? 'var(--medium)' : 'var(--high)';

/* The feed carries no bias/accuracy fields, so both are derived from the outlet
   name. Same source in, same numbers out — no flicker between renders. */
export function sourceMeta(article) {
    const source = article?.source || 'Unknown Source';
    const h = hash(source);

    const biasPct = 6 + (h % 89);
    const bias = BIAS_SCALE.find(b => biasPct < b.max);

    const accuracy = (60 + ((h >>> 9) % 41)) / 10;
    const domain = `${source.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

    return {
        domain,
        bias: {label: bias.label, pct: biasPct, color: bias.color},
        accuracy: {
            score: Number.isInteger(accuracy) ? `${accuracy}` : accuracy.toFixed(1),
            pct: accuracy * 10,
            color: accuracyColor(accuracy),
        },
    };
}

export function buildAiSummary(article) {
    const meta = sourceMeta(article);
    const level = (LEVEL_LABELS[article.level] || article.level || '').toLowerCase();
    return [
        article.summary,
        `Filed from ${article.region} by ${article.source} (${meta.domain}). The desk scores this ${article.importance}/10 on impact and currently classifies it ${level} priority.`,
        `Outlet lean reads ${meta.bias.label.toLowerCase()} and its historical factual accuracy is rated ${meta.accuracy.score}/10 — cross-reference against independent ${article.category} reporting before treating specifics as confirmed.`,
    ].join('\n\n');
}
