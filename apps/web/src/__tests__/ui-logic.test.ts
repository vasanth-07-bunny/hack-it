import { describe, it, expect } from 'vitest';

describe('Frontend UI & Scoring Math Tests', () => {
  it('should calculate weighted rubric total accurately based on criteria weights', () => {
    const criteria = [
      { id: 'crit-tech', maxScore: 10, weight: 0.30 },
      { id: 'crit-innov', maxScore: 10, weight: 0.25 },
      { id: 'crit-impact', maxScore: 10, weight: 0.20 },
      { id: 'crit-ux', maxScore: 10, weight: 0.15 },
      { id: 'crit-demo', maxScore: 10, weight: 0.10 }
    ];

    const scores = [
      { criterionId: 'crit-tech', score: 9.0 },
      { criterionId: 'crit-innov', score: 8.0 },
      { criterionId: 'crit-impact', score: 9.5 },
      { criterionId: 'crit-ux', score: 8.5 },
      { criterionId: 'crit-demo', score: 10.0 }
    ];

    let totalWeightedScore = 0;
    scores.forEach(s => {
      const crit = criteria.find(c => c.id === s.criterionId);
      if (crit) {
        totalWeightedScore += (s.score / crit.maxScore) * (crit.weight * 100);
      }
    });

    const rounded = Math.round(totalWeightedScore * 10) / 10;
    // (9/10)*30 + (8/10)*25 + (9.5/10)*20 + (8.5/10)*15 + (10/10)*10 = 27 + 20 + 19 + 12.75 + 10 = 88.75 -> 88.8
    expect(rounded).toBe(88.8);
  });

  it('should calculate skill compatibility match percentage for matchmaking', () => {
    const participantSkills = ['React', 'TypeScript', 'Node.js', 'PostgreSQL'];
    const teamNeededSkills = ['React', 'Node.js', 'Python', 'Docker'];

    const matchingSkills = participantSkills.filter(s =>
      teamNeededSkills.some(needed => needed.toLowerCase() === s.toLowerCase())
    );

    const matchPercentage = Math.round((matchingSkills.length / teamNeededSkills.length) * 100);
    expect(matchingSkills.length).toBe(2);
    expect(matchPercentage).toBe(50);
  });

  it('should correctly format rank delta indicators', () => {
    const getDeltaIndicator = (delta: number) => {
      if (delta > 0) return { icon: '▲', text: `+${delta}`, color: 'emerald' };
      if (delta < 0) return { icon: '▼', text: `${delta}`, color: 'rose' };
      return { icon: '―', text: '0', color: 'slate' };
    };

    expect(getDeltaIndicator(2)).toEqual({ icon: '▲', text: '+2', color: 'emerald' });
    expect(getDeltaIndicator(-1)).toEqual({ icon: '▼', text: '-1', color: 'rose' });
    expect(getDeltaIndicator(0)).toEqual({ icon: '―', text: '0', color: 'slate' });
  });
});
