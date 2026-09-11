import { RubricTemplate } from '../domain/types.js';

/** Standard LLD evaluation rubric used across problems */
const standardRubric: RubricTemplate = {
  criteria: [
    {
      name: 'Requirement Understanding',
      description: 'Does the solution address the core requirements? Are assumptions stated?',
      maxScore: 5,
      evaluationGuidance: 'Look for explicit mention of requirements, stated assumptions, and coverage of main use cases.',
    },
    {
      name: 'Class Responsibilities',
      description: 'Are classes well-defined with single, clear responsibilities (SRP)?',
      maxScore: 5,
      evaluationGuidance: 'Check that each class has one reason to change. Flag god classes or classes with mixed concerns.',
    },
    {
      name: 'Relationships & Coupling',
      description: 'Are relationships (HAS-A, IS-A, USES) appropriate? Is coupling minimized?',
      maxScore: 5,
      evaluationGuidance: 'Verify proper use of composition vs inheritance. Check for unnecessary dependencies.',
    },
    {
      name: 'Encapsulation & Interfaces',
      description: 'Are implementation details hidden? Are interfaces used to define contracts?',
      maxScore: 5,
      evaluationGuidance: 'Look for interface definitions, private internals, and dependency on abstractions rather than concretions.',
    },
    {
      name: 'Extensibility',
      description: 'Can the design accommodate new requirements with minimal changes?',
      maxScore: 5,
      evaluationGuidance: 'Evaluate if adding a new feature (e.g., new vehicle type, new payment method) requires only additions, not modifications.',
    },
    {
      name: 'Edge Cases & Error Handling',
      description: 'Does the solution consider edge cases, concurrency, and error scenarios?',
      maxScore: 5,
      evaluationGuidance: 'Look for mentions of full capacity, invalid inputs, concurrent access, and failure modes.',
    },
    {
      name: 'Design Rationale',
      description: 'Does the candidate explain WHY they made specific design choices?',
      maxScore: 5,
      evaluationGuidance: 'Check for trade-off discussions, alternative approaches considered, and reasoning behind pattern choices.',
    },
  ],
};

export interface ProblemSeed {
  title: string;
  slug: string;
  description: string;
  requirements: string[];
  hints: string[];
  rubricTemplate: RubricTemplate;
  difficulty: string;
}

export const problems: ProblemSeed[] = [
  {
    title: 'Parking Lot System',
    slug: 'parking-lot',
    description:
      'Design a parking lot system that can manage vehicles entering and exiting a multi-floor parking structure. The system should handle different vehicle sizes, track availability, and support payment processing.',
    requirements: [
      'Support multiple floors with configurable spots per floor',
      'Handle different vehicle types (motorcycle, car, bus/truck) with appropriate spot sizes',
      'Track real-time availability of parking spots',
      'Assign the nearest available spot to an incoming vehicle',
      'Calculate parking fees based on duration and vehicle type',
      'Handle entry and exit with ticket generation',
      'Support multiple entry and exit points',
    ],
    hints: [
      'Think about what entity "owns" the responsibility of finding an available spot',
      'Consider how you would add a new vehicle type without modifying existing classes',
      'How would the payment calculation change if you introduced hourly vs flat rates?',
      'What happens when the parking lot is full?',
    ],
    rubricTemplate: standardRubric,
    difficulty: 'medium',
  },
  {
    title: 'Elevator System',
    slug: 'elevator-system',
    description:
      'Design an elevator system for a building with multiple elevators. The system should efficiently handle requests from different floors and optimize elevator movement to minimize wait times.',
    requirements: [
      'Support multiple elevators in a single building',
      'Handle requests from both inside the elevator (floor buttons) and outside (up/down call buttons)',
      'Implement a scheduling algorithm to assign requests to elevators',
      'Track the current state of each elevator (moving up, moving down, idle, doors open)',
      'Support priority requests (e.g., emergency, VIP)',
      'Display the current floor and direction for each elevator',
    ],
    hints: [
      'Separate the scheduling decision from the elevator movement logic',
      'Think about what happens when an elevator receives a new request while already moving',
      'How would you add a new scheduling algorithm (e.g., SCAN, LOOK) without changing the elevator?',
      'Consider the state machine for an elevator\'s lifecycle',
    ],
    rubricTemplate: standardRubric,
    difficulty: 'hard',
  },
  {
    title: 'Vending Machine',
    slug: 'vending-machine',
    description:
      'Design a vending machine that dispenses products after accepting payment. The machine should manage inventory, handle different payment methods, and manage its internal state transitions.',
    requirements: [
      'Support multiple product types with configurable prices and quantities',
      'Accept different payment methods (coins, notes, card)',
      'Handle the vending state machine: idle → product selected → payment → dispensing → done',
      'Calculate and return change when overpaid with cash',
      'Track inventory and prevent selection of out-of-stock items',
      'Support admin operations: refill products, collect cash, view sales report',
    ],
    hints: [
      'The State pattern is a natural fit here — think about what each state allows and disallows',
      'How would you add a new payment method without modifying the existing dispensing logic?',
      'What happens if the machine cannot make exact change?',
      'Consider separating the payment processing from the product dispensing',
    ],
    rubricTemplate: standardRubric,
    difficulty: 'easy',
  },
];
