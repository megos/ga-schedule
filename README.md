# ga-schedule

A web app that automatically generates employee shift schedules using a genetic algorithm.

## Overview

ga-schedule builds work shift tables for a small team. Each cell is either ○ (working) or × (day off), laid out as employees (rows) * days (columns). You set a few constraints, and a genetic algorithm searches for a schedule that satisfies them.

Use it in four steps:

1. Enter the number of employees (2–10).
2. Enter the required headcount per day (1–10).
3. Pick the schedule period — start and end dates, up to 31 days.
4. Click the Generate button to run the algorithm. The result appears in an editable grid.

While it runs, the page shows the current generation and a fitness score (out of 100). Two sliders let you tune the trade-off in real time:

- Headcount — how strongly the daily headcount is pushed to match the requirement.
- Consecutive shifts — how strongly back-to-back identical shifts are penalized.

## How it works

A schedule is encoded as a chromosome: a string of ○/× cells of length employees * days. A genetic algorithm evolves a population of candidate schedules, minimizing a penalty (fitness) score until the schedule fits the constraints well.

| Aspect | Implementation |
| --- | --- |
| Goal | Minimize the penalty score |
| Selection | Tournament (size 2) |
| Crossover | Two-point |
| Mutation | Single-cell random replacement |
| Fitness | Per day: `abs(required − scheduled headcount) * employeeWeight`; per adjacent same-shift pair: `(1 − continuityWeight)` |

The two sliders adjust `employeeWeight` and `continuityWeight`, so you can re-generate the schedule with different priorities.

## Getting started

```bash
# install dependencies
yarn install

# start the dev server at http://localhost:3000
yarn dev

# type-check and build for production
yarn build
```
