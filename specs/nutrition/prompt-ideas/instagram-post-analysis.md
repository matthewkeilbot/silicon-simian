# Instagram Nutrition Prompt Post — First-Pass Analysis

Source:
- https://www.instagram.com/p/DXcsBsRFZJ0/
- Account: `@thewizeai`
- Retrieved: 2026-04-27 UTC

## What I could verify directly

I was able to read the public caption text and confirm the post is a carousel about using AI prompts for nutrition planning.

The visible caption says, in substance:

1. Most people approach nutrition with motivation but no structure.
2. The post claims prompt quality improves when the AI is given a role + institution framing.
3. It recommends chaining prompts:
   - Prompt 1: nutrition blueprint
   - Prompt 2: weekly meals
   - Prompt 3: grocery list
4. It highlights a batch-cooking prompt as practically important.
5. It highlights a behavioral / habits prompt as underrated because diet problems are often about triggers and environment, not just food.

## Prompt set structure inferred from the caption

Even without perfectly extracting every slide, the post’s system appears to be built around these prompt categories:

### 1) Nutrition blueprint prompt
Purpose:
- establish goals, calories/macros, dietary preferences, constraints, and overall plan structure

Likely strengths:
- good starting scaffold
- forces explicit inputs instead of vague “make me healthy” nonsense

Likely weakness:
- if it pretends to be clinical without guardrails, it can sound more authoritative than it really is

### 2) Weekly meal-planning prompt
Purpose:
- turn the blueprint into a practical week of meals

Likely strengths:
- moves from abstract goals to executable meals
- useful if it includes prep time, food preferences, and repetition tolerance

Likely weakness:
- AI meal plans often over-optimize variety and under-optimize laziness
- if every dinner is a tiny culinary side quest, the plan dies by Wednesday 💀

### 3) Grocery-list prompt
Purpose:
- convert meals into a consolidated shopping list

Likely strengths:
- very practical
- reduces friction between plan and execution

Likely weakness:
- often duplicates ingredients or ignores package-size realities unless explicitly told not to

### 4) Batch-cooking / meal-prep prompt
Purpose:
- turn the weekly plan into a prep workflow

This is probably the best idea in the whole post.

Why:
- nutrition plans fail less because of information and more because of execution friction
- a prep system beats a “perfect” meal list every time

### 5) Behavioral / habit prompt
Purpose:
- identify eating triggers, routines, weak spots, and environment design

This is also legitimately strong.

Why:
- most people don’t fail because they lack knowledge
- they fail because they are tired, busy, stressed, impulsive, surrounded by garbage food, or trying to sustain an unrealistic plan

## My read on the core thesis

The post’s main claim is:

> institutional framing + role prompting produces better nutrition outputs than generic prompting.

That is directionally true, but it’s not magic.

### What’s true
- Specific prompts usually beat vague prompts.
- Giving the model a job, context, constraints, and output format usually improves results.
- Chaining steps is smarter than one giant “do everything” prompt.

### What’s overhyped
- “Act like a senior coach at [fancy company]” is mostly a style/control trick, not actual credential transfer.
- It can make outputs feel more professional than they are.
- The value comes more from structured inputs, explicit constraints, and staged workflow than from cosplay as Precision Nutrition or Noom.

So the useful part is the workflow design.
The cringe part is the fake lab coat effect 😏

## Better design principles than the post’s marketing angle

If we were to build actually good prompt ideas from this, I’d prefer these rules:

1. **Use role lightly, constraints heavily**
   - Role: okay
   - Constraints: essential
   - Output schema: essential

2. **Separate planning from execution**
   - blueprint
   - meals
   - grocery list
   - prep plan
   - review / adjustment loop

3. **Make adherence the target, not theoretical perfection**
   - include energy level
   - time available
   - cooking skill
   - budget
   - eating-out frequency
   - “I will absolutely not do X” constraints

4. **Build feedback loops**
   - what worked this week?
   - what meals were annoying?
   - what did I skip?
   - what caused off-plan eating?

5. **Never let the model silently invent medical certainty**
   - especially around disease, hormones, supplements, or aggressive calorie deficits

## Prompt ideas worth saving / evolving

Here’s the prompt architecture actually worth keeping:

### A. Nutrition Strategy Prompt
Ask for:
- goal
- target rate of change
- body metrics if user wants to provide them
- dietary preferences
- allergies / exclusions
- budget
- time available
- cooking skill
- number of meals
- training schedule
- adherence risks

Output:
- calorie target range
- protein target
- rough carb/fat guidance
- meal pattern
- non-negotiables
- easy fallback foods
- key tradeoffs explained plainly

### B. Weekly Meal Plan Prompt
Input:
- strategy prompt output

Output:
- 7-day plan
- repeated meals where useful
- prep time per meal
- swap options
- restaurant / takeaway fallback options

### C. Grocery Consolidation Prompt
Input:
- weekly meal plan

Output:
- consolidated shopping list by category
- quantities aggregated
- note on optional vs required ingredients
- 1-trip shopping bias

### D. Batch Prep Prompt
Input:
- meal plan + grocery list

Output:
- 60–90 minute prep workflow
- what to cook first
- what to portion
- what keeps well
- what to freeze
- what to leave fresh

### E. Adherence Debugging Prompt
Input:
- what failed this week

Output:
- identify friction points
- suggest simpler substitutions
- reduce complexity
- modify environment/habits

## Suggested next move

Instead of blindly copying the Instagram prompts, we should do one of these:

1. reconstruct a **clean MEK version** of the prompt stack
2. make it specifically for **fat loss**, **muscle gain**, or **high-adherence general health**
3. optimize it for your actual lifestyle rather than influencer sludge

## Artifact status

Saved in this folder:
- `README.md`
- `instagram-post-analysis.md`

What is still incomplete:
- exact verbatim prompt text from every image slide
- clean image exports for each carousel card

Reason:
- Instagram public web view exposed the caption, but image extraction was obstructed by login modals and browser-side anti-scraping friction

## If you want the next pass

I can continue in one of two ways:

1. **Forensic extraction pass**
   - keep fighting Instagram to pull each slide/image text verbatim
2. **Practical synthesis pass**
   - skip the influencer archaeology and build a sharper prompt set ourselves

My bias: option 2 is probably more useful and less stupid.
