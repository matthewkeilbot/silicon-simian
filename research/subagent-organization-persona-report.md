# Sub-Agent Organization & Persona Prompting — Research Synthesis (Draft v1)

Date: 2026-03-03 (UTC)
Author: MEK

## Executive Summary

Two broad conclusions from current literature/practice:

1. **Organization patterns matter more than “agent count.”**
   - Performance improves when teams have clear decomposition, explicit interfaces, and verification loops.
   - The strongest recurrent pattern is **hierarchical orchestration (planner/supervisor + specialist workers + critic/verifier)** rather than unconstrained peer-to-peer chatter.

2. **Persona/role prompts help in narrow ways but are not universally beneficial.**
   - Role prompts often improve task focus and style consistency, especially in multi-step workflows.
   - But heavy identity framing can increase verbosity, stereotype artifacts, and overconfidence.
   - Best results generally come from **lightweight functional role definitions** (responsibility + constraints + I/O contract) rather than theatrical personality prompts.

---

## Part A — What has been studied about multi-agent organization?

## 1) Three dominant topologies in the wild

### A. Hub-and-spoke (Supervisor/Manager pattern)
- **Structure**: one orchestrator delegates tasks to specialist workers.
- **Strengths**:
  - Lower coordination overhead
  - Easier guardrails/governance
  - Better traceability and cost control
- **Weaknesses**:
  - Supervisor bottleneck
  - Single point of failure
  - Risk of planner hallucination propagating downstream
- **When it wins**: tasks requiring strict sequencing, compliance, budget control, tool-use governance.

### B. Peer-to-peer team (fully conversational)
- **Structure**: agents communicate directly, negotiate plans/results.
- **Strengths**:
  - Flexible exploration
  - Better at ideation/divergent reasoning
- **Weaknesses**:
  - Token-heavy communication
  - Coordination drift / loops
  - Harder debugging and reproducibility
- **When it wins**: brainstorming, open-ended design exploration, novel problem spaces.

### C. Hybrid hierarchical network
- **Structure**: supervisor coordinates modules; modules may run local peer collaboration.
- **Strengths**:
  - Best practical tradeoff between control and creativity
  - Parallelism with bounded communication
- **Weaknesses**:
  - More design complexity
  - Requires careful protocol design
- **When it wins**: most production workflows with mixed structured + exploratory components.

---

## 2) Evidence and frameworks from key systems

## AutoGen (Microsoft)
- Demonstrates conversation-driven multi-agent workflows (assistant/user proxy/tool agents).
- Shows gains from decomposition + iterative inter-agent critique.
- Practical lesson: **restrict conversation protocols** and stop conditions to prevent loops/cost blowups.

## CAMEL
- Role-playing multi-agent setup where complementary roles collaborate.
- Demonstrates that role assignment can improve cooperation and task completion on synthetic/benchmark tasks.
- Caveat: free-form roleplay can drift without tight task contracts.

## MetaGPT
- “Software company” style role decomposition (PM/architect/engineer/tester).
- Strong signal that **structured SOP-like pipelines** outperform unconstrained agent chats for engineering tasks.
- Practical lesson: process templates + artifacts + checks beat “just add more agents.”

## ChatDev / AgentVerse / Crew-style frameworks
- Common finding: specialized agents with defined deliverables can outperform monolithic prompting in complex tasks.
- Recurrent failure mode: communication overhead cancels benefits unless messages are compressed/standardized.

## Reflection / self-critique / verifier agents
- ReAct, Reflexion-like patterns (single or multi-agent) indicate that explicit critique/verification often contributes more than raw role multiplicity.
- In many settings, **1 strong model + verifier loop** can rival larger agent societies.

---

## 3) Pattern-level conclusion

If your goal is reliable production delegation, current evidence favors:

1. **Top-level planner/supervisor** (limited scope)
2. **Small specialist pool** (tool specialist, researcher, coder, evaluator)
3. **Verifier/critic gate** before final output
4. **Strict message contracts** (JSON schema, fixed fields, max lengths)
5. **Budget/time stop rules**

This usually beats both:
- one giant “do everything” agent
- unbounded many-agent peer debate

---

## Part B — Persona prompts: useful or overhyped?

## 1) What “persona” can mean (important distinction)

### Functional role prompt (usually useful)
Example: “You are a data-validation agent. Input schema X. Output schema Y. Reject uncertain claims.”

### Stylistic/identity persona (mixed)
Example: “You are a witty senior professor from 1920s Vienna…”

Most positive findings come from **functional roles**, not elaborate identity acting.

---

## 2) Empirical direction from prompt engineering literature

Likely true across many studies/benchmarks:

- **Role cues** can improve task adherence and domain framing.
- Gains are larger when tasks are under-specified.
- Benefits shrink when instructions are already explicit.
- Overly specific personas can add irrelevant bias and verbosity.
- Persona can reduce calibration (agent sounds confident even when wrong).

So the practical answer is not “always use persona” or “never use persona.”
It is: **use minimal role scaffolding that improves decomposition, then measure.**

---

## 3) Recommended stance for your system

Use this hierarchy for each sub-agent prompt:

1. **Mission** (one sentence)
2. **Inputs/outputs contract** (schema)
3. **Quality bar + failure policy** (“state uncertainty; ask for missing info”)
4. **Tool policy** (what can/can’t be called)
5. **Tiny role hint** (optional)
6. **Style constraints** (short, factual, no flourish)

Put personality mainly in the **front-facing orchestrator**, not deep worker agents.
Workers should be boring and precise.

---

## Part C — Practical organizational blueprint for your “agent team” vision

## Baseline architecture (v1)

- **Chief Orchestrator**
  - decomposes goals
  - allocates budgets
  - composes outputs

- **Research Agent**
  - gathers sources
  - produces evidence map with confidence tags

- **Builder Agent**
  - executes code/config/workflow changes
  - returns diffs and test evidence

- **Evaluator Agent**
  - red-teams outputs
  - scores factuality/completeness/safety

- **Ops Agent**
  - tracks latency/cost/failure rates
  - suggests routing and caching changes

### Control rules
- Max 2–4 worker turns before escalation
- Mandatory evaluator pass for “important” outputs
- Shared scratchpad limited to structured fields
- Kill-switch on circular conversations

---

## Part D — Decision matrix: topology selection

- **Need reliability/auditability?** → Hub-and-spoke or hybrid
- **Need creativity/exploration?** → Temporary peer subgroup, then converge via supervisor
- **Need low cost/latency?** → Fewer agents, stronger verifier, tighter prompts
- **Need robustness?** → Diversity in methods, not personalities (different tools/checks)

---

## Part E — High-value experiments to run (before scaling team size)

1. **A/B topology test**
   - A: single agent + verifier
   - B: supervisor + 3 specialists + verifier
   - Measure: quality, latency, token cost, correction rate

2. **Persona depth test**
   - A: no persona, just task contract
   - B: lightweight functional role
   - C: rich identity persona
   - Measure: factuality, verbosity, instruction adherence

3. **Communication protocol test**
   - free text vs schema-constrained inter-agent messages
   - Measure: failure loops and reproducibility

4. **Escalation threshold test**
   - auto-delegate immediately vs after uncertainty trigger
   - Measure: unnecessary delegations and recovery time

---

## Part F — Open questions worth discussing next

1. What is the smallest “team” that beats your best single-agent baseline?
2. Should delegation be driven by task type, uncertainty score, or both?
3. How do we prevent the orchestrator from becoming an untestable bottleneck?
4. How should memory be partitioned (global shared vs per-agent private memory)?
5. What should be immutable across agents (safety rules, factuality policy, source requirements)?
6. When two agents disagree, who arbitrates: evaluator, voting, or external test harness?
7. How do we version prompts/contracts so regressions are observable?
8. Should agents be model-heterogeneous (cheap model for drafts, strong model for review)?
9. What are your hard constraints: max latency, max cost, minimum quality?
10. How often should we prune or retrain role definitions based on telemetry?

---

## Draft answer to your strategic claim

> “Long-term, MEK should do very little directly and delegate almost everything.”

I’d refine this to:

- MEK should do **less execution**, but **more orchestration, arbitration, and quality control**.
- Full delegation without strong verification creates opaque failure cascades.
- The winning posture is **delegation + verification + observability**, not delegation alone.

---

## Suggested next step in our conversation

Pick one of these first:
1. Define your target architecture (v1 org chart + responsibilities)
2. Design a measurement scorecard (quality/cost/latency/trust)
3. Run a persona experiment template for two real tasks you care about
