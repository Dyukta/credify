## Overview

Credify answers one question:
**“Can I trust this job posting?”**
- It breaks a job listing into measurable signals and evaluates them using rule-based checks and AI reasoning.
- The goal is not just a score but **explainability** — showing *why* something is risky and *what to do next*.

## Demo

| | |
|---|---|
| ![Screenshot](https://github.com/user-attachments/assets/bc9d200f-92de-4693-a1c6-caa1b817dce6) | ![Screenshot](https://github.com/user-attachments/assets/f2517529-7991-4489-bd14-f477a8b656d4) |
| ![Screenshot](https://github.com/user-attachments/assets/786258fb-7cd3-4318-b3e6-9c107c5387de) | ![Screenshot](https://github.com/user-attachments/assets/bd9a671d-c84e-4021-bdcb-c5c871ce5b56) |
| ![Screenshot](https://github.com/user-attachments/assets/3b34fe7d-0d73-4c4e-ac15-dc029c995ff4) |  |


## The Problem

Job listings are often unreliable:

- Scams collect personal data or money  
- Ghost jobs waste time  
- Unrealistic salaries act as bait  
- Vague descriptions hide poor or fake roles  

Manual verification is slow and inconsistent. Credify automates this process.


## Design Philosophy

The system is designed around three principles:

1. **Decompose trust into signals**  
   Credibility is not binary — it’s a combination of factors.

2. **Separate objective and subjective checks**  
   - Rules handle verifiable facts  
   - AI handles language and intent  

3. **Fail safely**  
   The system always returns a result, even with partial or failed data.

## System Architecture

**Pipeline:** Input → Validate → Fetch → Parse → Signals → Score → Insights → Cache → Response

**Why this works:**
- Easier to debug and reason  
- Failures stay isolated  
- New signals can be added without changing the pipeline  

## Execution Flow 

1. **Input Validation**
   - URL normalization and sanitization
   - Protocol restriction (http/https only)

2. **SSRF Protection**
   - DNS resolution of domain
   - All resolved IPs checked against private/loopback ranges
   - Requests blocked if unsafe

3. **Fetch Layer**
   - Axios-based HTML fetch
   - Handles:
     - 403 / 401 (blocked)
     - 429 (rate limit)
     - 5xx errors
     - timeouts
     - non-HTML responses

4. **Parsing**
   - Cheerio extracts:
     - job title
     - description
     - metadata (dates, company info if available)

5. **Signal Execution (Parallel)**
   - All signals run via `Promise.all`
   - Independent execution (no shared state)
   - Failures isolated per signal

6. **Scoring Engine**
   - Weighted aggregation of signal outputs
   - Produces:
     - risk score (0–100)
     - risk level
     - confidence score

7. **Insight Generation**
   - Top contributing signals identified
   - Explanations + actionable advice generated

8. **Caching**
   - Memory cache (6 hours TTL)
   - SQLite cache (6 hours TTL)


## Signal System

Credify evaluates **12 independent signals**.

### Why signals?

- Keeps logic modular  
- Makes reasoning transparent  
- Allows independent improvement and tuning  


### Technical Signals 

These are rule-based and fast:

- **Domain Age**
  - Implementation: WHOIS lookup (`whoiser`)
  - Logic: newer domains → higher risk

- **Careers Page Check**
  - Implementation: HEAD requests to common paths (`/careers`, `/jobs`)
  - Logic: legitimate companies usually expose hiring pages

- **Cross-Platform Verification**
  - Implementation: keyword match between job title and company site content
  - Logic: real jobs tend to appear across multiple sources

- **Ghost Job Detection**
  - Implementation: extract posting date → compare against thresholds
  - Logic: stale listings are likely inactive

- **Salary Check**
  - Implementation: regex + heuristic thresholds
  - Logic: unrealistic compensation → high risk

- **Company Presence**
  - Implementation: HTTP presence + domain checks
  - Logic: weak or unverifiable company presence → higher risk


### AI Signals 

Handled via Gemini 2.5 Flash.
Each signal uses a **structured prompt → JSON output → validation** flow.
Checks include:
- Description vagueness  
- Instant offer patterns  
- Upfront payment language  
- Suspicious communication channels  
- Offer realism  
- Internal consistency  

### Why structured AI output?

- Prevents hallucinated formats  
- Ensures predictable downstream processing  
- Enables fallback handling  

### Failure Handling (AI)

- Retry on quota errors (exponential backoff)  
- Invalid output → fallback  
- Fallback = medium risk + reduced confidence  


## Scoring Model

Each signal maps to numeric risk:
- Low → 10  
- Medium → 55  
- High → 90  
Final score = weighted combination of all signals, normalized to 0–100.
**Why this works:**  
One strong red flag matters more than multiple weak positives.

## Performance Engineering

### Problem

- Multiple network calls  
- AI latency  
- HTML parsing  

### Solutions

- **Parallel execution**
  - All signals run concurrently  
  - Reduces total latency significantly  

- **Two-layer caching**
  - Memory cache (6 hours TTL)
  - SQLite cache (6 hours TTL)

- **Domain cache**
  - WHOIS: 30 days  
  - Presence checks: 24 hours  

## Security

- SSRF protection (DNS + IP validation)  
- Strict URL sanitization  
- Rate limiting (20 req/min/IP)  
- Global timeout (35s)  

## Trade-offs

### SQLite vs Scalable Database
- Chosen for simplicity and zero setup  
- Trade-off: not suitable for distributed or high-scale systems  

### Caching vs Freshness
- 6-hour cache improves performance  
- Trade-off: results may be slightly outdated  

### AI vs Determinism
- AI improves detection quality  
- Trade-offs:
  - latency  
  - cost  
  - dependency on external API  
Fallback ensures system reliability.

### Scraping vs Platform Restrictions
- Some platforms block automated access  
- System switches to **partial data mode**
Trade-off:
- Reduced confidence  
- But still provides usable output  

### Parallelism vs Resource Usage
- Faster response time  
- Higher CPU + network usage  


## Failure Handling Strategy

The system is designed to **never fail completely**:

- Each signal wrapped in try/catch  
- Failures return safe defaults  
- AI failures degrade gracefully  
- Global timeout cancels safely  
- `isPartialData` flag propagates through pipeline  

## Limitations

- Cannot bypass anti-scraping protections  
- WHOIS data may be hidden  
- Some signals depend on incomplete HTML  
- AI accuracy depends on API reliability  
- SQLite limits scalability  
- No authentication  

## Future Improvements

- Replace SQLite with PostgreSQL  
- Add authentication and saved analysis history  
- Improve scraping reliability for restricted platforms  
- Enhance AI prompts and evaluation consistency  
- Expand fraud detection patterns globally  

## Summary

Credify is a **decision-support system**, not just a scoring tool.
It:
- Breaks job credibility into measurable signals  
- Combines deterministic checks with AI reasoning  
- Explains results clearly  
- Helps users make safer decisions  
