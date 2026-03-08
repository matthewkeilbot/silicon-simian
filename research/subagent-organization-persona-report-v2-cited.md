# Sub-Agent Organization & Persona Prompting — Web-Discovery + Web-Scraping Pass (v2)

Date: 2026-03-03 UTC  
Method: Browser-first discovery fallback via arXiv discovery pages + direct paper scraping with `web_fetch` (no `web_search` API).

## What I did this pass

I explicitly used a discovery→scrape workflow:
1. Discovery: arXiv query/search result pages for multi-agent architectures and persona/role prompting
2. Scraping: direct fetch of key paper pages and abstracts
3. Synthesis: pattern-level conclusions + practical design recommendations

---

## Core findings

## 1) Best organization patterns are usually **hierarchical or hybrid**, not unconstrained peer swarms

### Evidence
- **AutoGen** (Wu et al., 2023) shows multi-agent conversation is flexible and powerful, but requires careful conversation design and control policies to be reliable in practice.  
  Source: https://arxiv.org/abs/2308.08155
- **MetaGPT** (Hong et al., 2023/2024) reports stronger coherence when using SOP-like role decomposition and assembly-line workflows.  
  Source: https://arxiv.org/abs/2308.00352
- **ChatDev** (Qian et al., 2023/2024) emphasizes role specialization plus explicit communication structure (“chat chain”, dehallucination) for software workflows.  
  Source: https://arxiv.org/abs/2307.07924
- **ChatEval** (Chan et al., 2023) suggests multi-agent debate/verification can improve evaluator quality vs single-agent judging in some settings.  
  Source: https://arxiv.org/abs/2308.07201

### Synthesis
For production systems, a **hub-and-spoke/hybrid topology** with explicit verifier loops is generally the safest bet:
- Orchestrator/planner
- Specialist workers
- Evaluator/critic gate

Peer-to-peer only tends to win in exploratory ideation, and usually needs bounded rounds + convergence rules.

---

## 2) Persona prompting: **functional role prompts help; theatrical identity prompts are mixed**

### Evidence
- **CAMEL** (Li et al., 2023) supports role-playing as a mechanism for autonomous cooperation and task progress in multi-agent setups.  
  Source: https://arxiv.org/abs/2303.17760
- Recent persona-heavy work trends show active research on stronger persona control, but these are often optimizing role-play fidelity itself, not necessarily factual reliability for tool-centric production workflows.
  - Example discovery item: “Enhancing Persona Following at Decoding Time...” (2026)  
    Discovered via arXiv search: https://arxiv.org/search/?query=persona+prompting+large+language+models&searchtype=all&source=header

### Synthesis
Use **minimal functional personas** for workers:
- responsibility
- boundaries
- I/O schema
- quality/failure policy

Avoid heavy character backstories for sub-agents unless your objective is simulation/creative tone.

---

## 3) Verification and protocol design usually matter more than “more agents”

Across the cited frameworks, gains come less from raw agent count and more from:
- decomposition quality
- communication constraints
- explicit stop conditions
- evaluator/critic/reflection loops

That aligns with your long-term direction: delegate execution heavily, but keep orchestration + quality governance strong.

---

## Recommended org pattern for your system (practical)

1. **Chief Orchestrator** (routing, budgeting, arbitration)
2. **Research Worker** (sources + evidence grading)
3. **Execution Worker** (code/config/task completion)
4. **Evaluator Worker** (red-team, factuality/completeness checks)
5. **Ops Worker** (latency, cost, loop/failure telemetry)

Rules:
- max turns per subtask
- schema-constrained handoffs
- mandatory evaluator pass for high-impact outputs
- explicit uncertainty escalation

---

## Open questions I want us to test empirically

1. What is the smallest team that beats your best single-agent baseline on *your* real tasks?
2. Does routing by uncertainty score outperform routing by task-type labels?
3. What communication schema minimizes retries while preserving quality?
4. Should evaluator be same model family as workers, or intentionally different?
5. How much private memory should each sub-agent get before drift/conflict increases?
6. What’s the max useful persona depth before factual accuracy drops?
7. What’s your hard SLO triangle (quality / latency / cost)?
8. Should we require citation-backed outputs from research agents by default?
9. Which failure should trigger automatic human escalation immediately?
10. How do we version prompts/contracts so regressions are quickly detectable?

---

## Suggested next step

Run a 2-week A/B in your environment:
- **A:** single strong agent + evaluator loop
- **B:** orchestrator + 2 specialists + evaluator

Track:
- completion quality
- correction rate after evaluation
- latency
- token/tool cost
- human trust rating

That experiment will give us a concrete answer for your team design, beyond general literature patterns.
