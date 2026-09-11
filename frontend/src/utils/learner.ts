const LEARNER_KEY = 'lld_practice_learner';

export function getLearnerIdentifier(): string | null {
  return localStorage.getItem(LEARNER_KEY);
}

export function setLearnerIdentifier(name: string): void {
  localStorage.setItem(LEARNER_KEY, name.trim());
}

export function clearLearnerIdentifier(): void {
  localStorage.removeItem(LEARNER_KEY);
}
