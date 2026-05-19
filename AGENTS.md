# This is NOT the NestJS or Next.js you know

This architecture operates under a strict Turborepo monorepo workspace structure using **NestJS 11** and **Next.js 15**. Execution boundaries, dependency lines, and module generation paths differ completely from traditional isolated scaffolding configurations. Read the context workspace configurations thoroughly and do not guess version capabilities. Heed all pinned compilation boundaries.

## Application Building Context

Read the following structural project files in order before implementing features, writing endpoints, or making any system-level architectural decisions:

1. `contexts/project-overview.md` — Product definition, 15-screen questionnaire topography, and scope boundaries.
2. `contexts/architecture-context.md` — Monorepo workspace topology, system limits, atomic storage models, and strict transactional invariants.
3. `contexts/code-standards.md` — Type safety requirements, strict Prisma 6 generation guidelines, and multi-tier testing parameters.
4. `contexts/progress-tracker.md` — Active phases, logged architectural milestones, recursive routing resolutions, and upcoming features.

Update `contexts/progress-tracker.md` immediately following each meaningful implementation milestone or framework adjustment.

If any implementation shift introduces structural revisions to the database entities, cross-package validation pipelines, or routing boundaries recorded in these baseline text scopes, you must update the corresponding context file before writing downstream application modifications.