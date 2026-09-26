const summary = require('./db_lessons_summary.json');

const levelWeight = { beginner: 1, intermediate: 2, advanced: 3 };
summary.sort((a,b) => {
  if (levelWeight[a.level] !== levelWeight[b.level]) return levelWeight[a.level] - levelWeight[b.level];
  return a.order - b.order;
});

for (const l of summary) {
  console.log(`[${l.level.toUpperCase()}] #${l.order} (${l.slug}): ${l.title} -> ${l.subLessonsCount} sublessons`);
}
