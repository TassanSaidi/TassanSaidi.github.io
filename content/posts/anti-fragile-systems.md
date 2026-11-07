---
title: "Anti-fragile Systems: Houston, We Have a Problem"
date: 2026-11-02
tag: "ESSAY"
description: "From call centres and load shedding to PHP2Shell and Apollo 13 — what anti-fragility means for software teams in 2026, and how to practise it."
---

<figure class="post-figure">
<img src="/images/posts/antifragile/fig1-stress-responses.svg" alt="Four responses to stress: Fragile breaks, Robust absorbs, Resilient springs back, Anti-fragile gets stronger">
<figcaption>Four responses to stress, from the call-centre example</figcaption>
</figure>

## Robust, resilient, anti-fragile

Say we're asked to build call centres for a company that must be available to its customers 24/7 in South Africa. The brief: handle up to 1,000 concurrent calls, and stay insulated from intermittent disruptions in cell reception.

We start with a single office in the CBD, where good signal is guaranteed. That works until one tower goes down or one fibre line is cut, and all 1,000 calls go with it. That system is fragile.

So we make it **robust**. A robust system holds its shape under the stresses we planned for. We sign on multiple phone carriers as providers and open offices in different locations, so losing one carrier or one office doesn't take the service down. The system doesn't change; it absorbs the hit.

Then we make it **resilient**. A system is resilient if it can withstand, adapt to and ultimately recover from disruption without losing its core functions. Calls route automatically to whichever site and carrier is healthy, and traffic flows back when the failed one recovers. Where a robust system absorbs a shock, a resilient one bends and springs back. But it springs back to the shape it had before: it survives the outage without learning anything from it.

But the multi-carrier plan has a flaw. Redundancy only protects you from failures that are independent of each other, and load shedding is not. When the grid drops to a high stage, it doesn't matter whose name is on the tower. Once the backup batteries run flat (or have been stolen), every carrier in that area degrades together. Our offices in other cities are often on similar schedules. Our four independent providers turn out to share one dependency: the grid. Engineers call this a common-mode failure. On paper we had redundancy; in practice we had the same single point of failure four times over.

<figure class="post-figure">
<img src="/images/posts/antifragile/fig2-common-mode-failure.svg" alt="Four carriers, one shared point of failure: the grid">
<figcaption>Common-mode failure · four carriers, one grid</figcaption>
</figure>

This is where **anti-fragility** comes in. Nassim Taleb describes an anti-fragile system as one that gains from disorder, and gets stronger when subjected to stress and uncertainty. For our call centre, that means treating every stage of load shedding as data. Which sites dropped first? Whose tower batteries lasted? How long did failover take, and how did the agents cope? Then we change the system because of what we learnt: power at the sites, a path that doesn't depend on a cell tower at all (cloud telephony over fibre, agents who can log in from anywhere), sites spread across different load-shedding blocks. And we pull the plug on a site ourselves on a Tuesday afternoon, rather than waiting for the grid to do it at 2am.

A robust system survives the next outage. A resilient one recovers from it. An anti-fragile one is better because of the last one.

One caveat before going further: code can't gain from disorder by itself. What gets stronger is the loop around it, the people who watch it fail, work out why and change it. That loop is the anti-fragile part, and the rest of this piece is about building it.

## Testing the theory

When we build complex distributed systems, we're taught principles that should give us high availability, scalability and robustness. The theory is good. What we don't always do is test it.

We write test cases for the happy path and the error path. But they rarely capture the chain reactions that follow when something goes wrong in a distributed system, where every part is connected to every other. Integration tests show us whether the parts work together. They don't generate the edge cases that only appear at scale, when the system is stretched to its limits. If the only place you learn how your system behaves under stress is production, you are always waiting for the next incident.

You can't prevent every failure in a complex system. But you can build a practice that learns quickly from failure and responds well to it.

In software there's a shortcut: unlike a bridge or an aircraft, we can break things on purpose and put them back in minutes. In 2010, Netflix built Chaos Monkey, a tool that randomly shut down production instances during working hours. Engineers were at their desks to watch what an outage in one service, in one region, did to everything else. Each test was isolated, but it pushed the team to design services that tolerate those failures, and to be ready when they happened for real. They simulated failure, watched the response and improved it. Above all, they became comfortable with failure.

Even so, killing whole instances in production has a cost: real customers feel it. So Netflix kept shrinking the blast radius. Failure Injection Testing (FIT), introduced in 2014, injected latency and errors into specific requests. Its successor, the Chaos Automation Platform (ChAP), described in a 2016 paper, sends a small slice of real traffic to an experiment group and an identical control group, then compares how they behave. Fault injection is still part of how Netflix works today.

## Houston, we have a problem

On 21 October 2026, the industry got a stress test it hadn't planned for. A pair of flaws in the PHP engine itself, dubbed PHP2Shell, let an attacker run arbitrary code on a server without logging in. PHP runs an estimated 70% of websites. The flaws had been hiding for more than a decade, and they were found with AI.

- **11 August:** researchers at Calif, working with OpenAI's GPT-5.6 Sol, report the first flaw.
- **24 August:** Wiz reports the second, found with its own AI agent alongside Gemini 4 Argon and GPT-5.6 Sol.
- **17 October:** AWS spots exploit attempts, four days before public disclosure.
- **20 October:** an anonymous Hacker News post claims the bugs are real, two days before the planned coordinated disclosure on 22 October.
- **21 October:** disclosure is brought forward. The NSA tells organisations to patch immediately or take their systems offline. CISA, the UK's NCSC and CERT-EU issue alerts, and government sites across Europe go dark.
- **26 October:** CISA confirms both flaws are being exploited, adds them to its Known Exploited Vulnerabilities catalogue and gives US federal agencies until 29 October to patch.

<figure class="post-figure">
<img src="/images/posts/antifragile/fig3-php2shell-timeline.svg" alt="PHP2Shell timeline from August to October 2026">
<figcaption>PHP2Shell timeline · August to October 2026</figcaption>
</figure>

Attackers didn't wait for the disclosure. AWS saw exploit attempts four days before it, and within a week CISA had confirmed both flaws were being exploited. The official advice was sound: the NSA asked organisations to inventory everything running PHP, patch, add logging, replace end-of-life versions, and go offline only if they couldn't patch. But look at what that advice assumes. Most organisations had to build the inventory in the middle of the emergency, and for many the only real plan was to wait for the patch, and switch off if they couldn't apply it.

The patch closed the hole, but it didn't clean up behind it. A server compromised before the fix keeps whatever backdoors, accounts or stolen credentials the attacker left. Now that the patch is out, it's tempting to treat the incident as over. It isn't, and getting through this one is not a strategy for the next.

Compare that with aviation. Because the consequences of a crash are so dire, every commercial aircraft must carry a black box: a flight data recorder and a cockpit voice recorder. After a crash, investigators recover it, work out what caused the failure, simulate it and change the aircraft, the procedures and the training to account for it. Aviation learns from tragedy, and gets safer with each one. Taleb uses this very example: every plane crash makes the next one less likely.

For most of us, the response to PHP2Shell looked like the response to every vulnerability before it: we patched and moved on. There was no black box: no record of how our systems behaved under the threat, how long our teams took to respond, or where they got stuck. The patch fixed the bug. Nothing fixed the system that was so unprepared for it.

<figure class="post-figure">
<img src="/images/posts/antifragile/fig4-aviation-vs-software.svg" alt="Aviation closes the loop; software stops at the patch">
<figcaption>Learning from failure · aviation vs software</figcaption>
</figure>

## The problem is access

PHP2Shell was found by defenders using frontier models from the big labs, under controlled disclosure. It's tempting to conclude the danger sits with those labs and their safeguards. It doesn't. Open-weights models now compete with the frontier, and modified copies with their safeguards removed tend to circulate soon after a release. The closed models get jailbroken too.

Which model is open or closed matters less than the fact that anyone can get one. Wiz pointed out that AI helps attackers adapt exploit code to different PHP versions, server configurations and memory layouts. That cuts the expertise an attack used to require. The skills that once limited who could weaponise a bug like this are now available on demand.

So we will be handed more vulnerabilities than we know how to cut hotfix branches for. Robustness is still the goal, but a robust system only holds its shape under the attacks we planned for. The same access cuts both ways, though. The models that found PHP2Shell are available to defenders too, and pointing them at our own code before someone else does is exactly the kind of stress an anti-fragile system should go looking for.

## Anti-fragile in practice

This is why I believe anti-fragile software matters more now than ever. Like any good theory, though, it only counts if we practise it, and what we practise on is the whole system: the software, the engineers and the way they work together.

<figure class="post-figure">
<img src="/images/posts/antifragile/fig5-loop.svg" alt="Loop diagram: every lap of the loop leaves the system stronger">
</figure>

Each practice below sits on one stage of this loop, and the black box records all of them.

In practice that means:

- **Game days.** Pull the plug on purpose, in working hours, the way we'd cut a call-centre site before the grid does.
- **Fault injection in production.** Small slices of traffic, a control group, latency and errors added on purpose.
- **Attack yourself first.** Point the same AI models that found PHP2Shell at your own code and dependencies, and run red-team exercises on what they find. Every bug you find is one an attacker doesn't.
- **Rehearsed emergency patching.** Pick a dependency, pretend an advisory just landed, and time how long it takes to get a fix into production. Then shorten it.
- **Have a stopgap ready.** Know how to put a firewall rule in front of a service, isolate it or degrade it gracefully, so switching it off isn't your only option while you wait for a fix.
- **Assume the patch came late.** After an emergency fix, rotate the credentials exposed servers could reach and hunt for backdoors. A patch closes the hole; it doesn't tell you who came through it.
- **Know your dependencies.** Know which runtimes and libraries you run, and which of your "independent" pieces fail together. Build the inventory before the emergency, not during it.
- **Keep a black box.** Record how your systems and your people behave during every incident, real or staged: what broke, what held, how long the response took and where it stalled.
- **Blameless postmortems that change something.** Read the black box afterwards. Every incident should leave the system different.

None of this works if people are afraid. A black box is only useful if someone is willing to say what it recorded. In an organisation that punishes failure, engineers hide their mistakes, near misses go unreported and the same bug ships twice.

Aviation understood this too. Since 1976, US pilots have been able to report their own errors and near misses to NASA's Aviation Safety Reporting System, largely protected from penalty for doing so. Mistakes that would otherwise stay hidden become lessons for every crew.

We need to run our organisations the same way. When an engineer can say "I pushed the config that broke production" in the first five minutes rather than the fifth hour, we fix it faster and learn more. Blame teaches people to hide the next failure. Curiosity teaches them to bring it to you. If we want systems that gain from stress, we need people who feel safe admitting where they broke under it.

So ask yourself the uncomfortable questions. If there's an exploit tomorrow in a version of Node, or in a core Python library, how will your system respond? How will your engineers respond? Will the challenge be daunting, or are they in a position to learn from it? If you want somewhere to start, run one patch drill this quarter and write down how long it took. That number is your first black-box recording.

In April 1970, an oxygen tank exploded on Apollo 13, more than halfway to the Moon. Jack Swigert's actual words were "Houston, we've had a problem," and the calm in them was earned. Mission Control had spent years running crews and controllers through simulated failures. When the real one came, they worked the problem step by step until the crew came home.

"Houston, we have a problem" is something you only get to say calmly if you've practised for it.

## Sources

- [Al Jazeera: World leaders warn of security flaws found in PHP](https://aljazeera.com/news/2026/10/22/world-leaders-warn-against-security-flaw-found-in-php-computer-programming)
- [The Hill: NSA warns of PHP security flaws](https://thehill.com/policy/technology/6163568-nsa-warns-php-security-flaws/amp/)
- [Digital Today: PHP flaws trigger alerts across Europe](https://www.digitaltoday.co.kr/en/view/118173/major-php-flaws-trigger-cybersecurity-alerts-websites-blocked-across-europe)
- [The Daily Record: Government websites go dark](https://thedailyrecord.com/2026/10/21/government-websites-go-dark-after-ai-discovered-flaw-sparks-security-scramble/)
- [SBS News: PHP security flaw triggers hacking alert](https://news.sbs.co.kr/english/endPagePrintPopup.do?news_id=N1008809366)
- [DEV Community: PHP got hacked by AI](https://dev.to/bytebantz/php-got-hacked-by-ai-1ema)
- [ProPakistani: NSA tells website owners to update or shut down](https://propakistani.pk/2026/10/23/nsa-tells-website-owners-to-update-immediately-or-shut-down-their-sites/)
- [Basiri et al.: A Platform for Automating Chaos Experiments (2016)](https://arxiv.org/abs/1702.05849)
- [The Next Platform: Creating chaos to save the datacenter](https://www.nextplatform.com/2017/12/12/creating-chaos-save-datacenter/)
- [The Register: CISA confirms PHP2Shell exploitation](https://www.theregister.com/a/5305681)
- [Intelligence Community News: NSA recommends PHP patching](https://intelligencecommunitynews.com/?p=45876)
- [SecureWorld: Patch PHP now or take it offline, NSA warns](https://www.secureworld.io/industry-news/patch-php-now-php2shell)
- [ClearanceJobs: patching is not proof systems are clean](https://news.clearancejobs.com/?p=1166726)
