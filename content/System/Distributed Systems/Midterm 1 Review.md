---
tags:
  - "#sys/distributed"
title: CMU 15-440 Midterm 1 Cheatsheet
---
## Networking

- *OSI Layers*: Physical (1), Data Link (2), Network (3), Transport (4), Session (5), Presentation (6), Application (7), interoperability
- *Forwarding data*: direct physical conn ($O(N^2)$) doesn't scale well
- *Circuit switching*: dedicated path, forwarding node maintains conn state
  - (+) Fast, predicatable, performance (-) resource inefficient, setup delay
- *Packet switching*: self-contained packet, store-and-forward, independent
  - (+) general, robust sharing (-) lack of isolation (congestion, var delay)
  - *Statistical multiplexing*: phys link shared among flows, buffer queue
    - burstiness averages out, higher utilization
- *End-to-end argument*: _functions should be at end hosts unless perf gain_
- *(De)multiplexing*: demux field in IP header, send to correct protocol
- *Addressing*: flat (MAC, plug-n-play but not scalable), hier (IP, with net + host components, scalable but trickier assignment and management)
 - Class-based: A (0, 0-8 bits net), B (10, 16 bits net), C (110, 24 bits net)
 - CIDR: var-len prefix, slash for bits in net part, supernetting
- *Route aggr*: same next-hop, contiguous, common prefix (1b shorter)
- *Longest prefix match*: most specific route, longest prefix
- *TCP*: _reliable, in-order, 2-way byte stream_, with flow/err/congestion ctrl
  - flow ctrl: sender limited by advertised recv window
  - cong ctrl: sender adapts to network capacity, control window size
  - *sliding win*: max outstanding unacked bytes = min(cwnd, rwnd), cannot advance beyond earliest unacked as recv need in-order buffering

## Concurrency (Go-style)

- *chan cap 0*: rendezvous, sync send/recv; *1* pass token; *N* bounded FIFO


## Time Synchronization

- Synchronous net (delay $<= D$) $=>$ set $T+D/2$, error $<= D/2$
- *Cristian's*: client-server - recv time $t$ from server, set time to $t + "RTT"/2$, err $plus.minus ("RTT"/2 - "min one way delay")$ *(-)* single point of failure, *(+)* simple
- *Berkeley's*: internal group sync, great with random grouping
  - Master polls workers for clock values (+RTT esti), computes average (excluding outliers above RTT and with faulty clocks).
  - Sends offset to workers (no RTT dependence).
- *NTP*: sync to UTC; hierarchical (only get from upper and own stratum)
  - Multiple one-way messages rather than immediate RTT
  - $"RTT" = "cli_wait" - "ser_proc", "Off" = t_2 - t_3 + "RTT"/2$
  - \* estimating reliability from variation (select peers), take min delay
- *Lamport*: logical, "happens-before" $->$: (program, message, transitive)
  - Incr on event, piggyback on send, max on recv
  - (-) don't capture causality, only $e -> e' => L(e) < L(e')$
  - Total order: tie-breaker $L(e) = M * L_i (e) + i$, starting from $i=0$
- *Vector Clocks*: $c_i$ for \# of events in $i$ that causally precede $e$

## Distributed Mutual Exclusion (no failure/msg drop)

- *Scale up* (vertical): resource to single node, *scale out*: more nodes
- *Mutex req*: correctness/safety: at most one in CS
  - *Fairness*: eventual - not excluded forever; bounded - wait bounded
- *Centralized*: acq/rel to central server, queue requests
  - Corr: safe, fairness depending on queueing policy
- *Bully Leader Election*: notice leader down, elect new one
  + P sends an ELECTION message to all processes with higher numbers.
  + If no one responds, P wins the election and becomes coordinator.
  + If one of the higher-ups answers, it takes over. P’s job is done.
- *Decentralized*: want to minimize distributed state, $n$ coordinators
  - Need majority $m >n/2$ to enter CS, coordinator reply GRANT/DENY
  - Not enough $->$ backoff and retry, (-) potential starvation
  - Corr: saftey (by majority), fairness on random chance
  - Node failure potentially forget vote on reboot
- *Totally-Ordered Multicast*: operation, all nodes see msgs in same order
  + Sender timestamps message with TO Lamport clock.
  + Multicast to all (including self).
  + Each process: (Prio)queues message by timestamp; ACKs everyone; Delivers message only if *it’s head of queue & ACKed by all*.
  - Getting ACK $->$ must recv all prior msgs, queue order ensures corr
  - Ensures all nodes deliver in same order → consistent global order.
- *Lamport Mutex*: optimizes ACKs for TO multicast
  - *Request Phase*: ACK only requestor (ready to commit)
  - *Release Phase*: multicast RELEASE to all, remove from queue
- *R&A*: Lamport but fewer msgs; deferred replies as implicit RELEASE
  - *Rule for recv*: idle $->$ ACK; in CS $->$ queue; requesting $->$ compare ts, smaller $->$ ACK, larger $->$ queue
  - *Safety*: (1) B recv A REQ before sending, then $T_a < T_b =>$ A wouldn't ACK B until after CS; (2) both sent before recv, then TO gives order
  - *Deadlock-free*: wait relation is exactly ts order, no cycle
  - *Starvation-free*: finite cs time, finite req rate $->$ eventually smallest ts
- *Token Ring*: logical ring, only holder can enter CS, exit by passing token
  - Corr: safety (single token), fairness (token circulates)
== RPC
- definition: A type of client/server communication, Attempts to make remote procedure calls look like local ones
- goal: nicer abstraction than programming on the network, make distribution (mostly) transparent
- transparency: Less complexity, Looks like a single centralized server, Lots of abstractions
- Stubs: Code that handles de/serializing RPC arguments； client stub: Marshals args into machine-independent format, sends to server, un- result
- how to (un)marshall: IDL (interface definition lang) for function signatures
- challenges: memory access, failure, latency
- semantics: exactly once, at least once (idempotent), at most once

## Concurrency
- Transaction properties: ACID
  - atomicity: either entirely complete or aborted (no effect on global state)
  - consistency: preserves a set of invariants about global state
  - isolation: each transaction executes as if it were the only one with the ability to read/write shared global state
  - durability: Once a transaction has been completed, or “committed”, its effects will persist, even in the presence of failures.
- 2PL (2 phase locking) goal: serializability / strong isolation
  - Phase 1: Acquire locks as transaction
  - Phase 2: Release locks in phase 2, no locks acquired
  - Commit: Update changes, release locks
  - Abort: Throw away changes, release locks
- Deadlock can occur: Transaction may not know all needed locks AOT
- deadlock handle: wait-for graph find cycle / set timeouts
- *2PC*: Why not 1PC? Participant may not be able to commit; Assumes:
  - Reliable, in-order communication
  - Async network (msgs eventually arrive but can be arbitrarily delayed)
  - Fail-recover with stable storage: all nodes write state to storage about action before sending any message
  
== Logging and Recovery
  - fault tolerance: Dealing successfully with partial failure within a DS
- Chandy-Lamport snapshotting
  - Assumption: stable, persistent storage
  - consistency: $e$ recorded, then all events before $e$ also recorded
  - Simple Algorithm: Independent checkpointing: easy to implement, Difficult to recover consistently, might cause cascaded rollbacks
- Tradeoffs of using frequent checkpoints 
  - Pros: Less roll back (and hence wasted work)
  - Cons: Overhead during normal operation
- Write-ahead logging (WAL): log op to durable storage before performing
- Replication
  - read-only: pros of replication
    1. Get to use multiple servers to handle the load
    2. Locality: direct client to nearest replica
    3. Can easily switch to another copy in case of failure
  - write: needs consistency: preserve ordering of ops across multi processors
    - Strict consistency: writes instantaneously visible to everyone
    - Sequential consistency: All nodes see all operations in some single valid global sequential order
    - Causal consistency: all nodes see potentially causally related writes in same order (if write 1 causes write 2, read 1 should be before read 2)

== Replication
- State machine replication (SMR)\'s goal: replica in sync with each other
- Fischer-Lynch-Paterson: No deterministic 1-crash-robust consensus algo exists with async communication (every message arrives eventually)
- Paxos properties:
  - Correctness (safety):
    1. Only a single value may be chosen (Agreement)
    2. The chosen value X must have been proposed by some node (Validity)
  - Liveness (termination): Some proposed value is eventually chosen, If a value is chosen, servers eventually learn about it
  -  Fault-tolerance: If $<=f$ out of $n$ fail, the rest eventual consensus w.h.p.
- Liveness is not guaranteed, sacrificed in favor of correctness
- Correctness: $2f + 1$ nodes, $f + 1$ quorum size
  - At least 1 acceptor common to two distinct quorums
  - Restrict that an acceptor only ever accepts a single proposal

== File Systems
- Simple Approach: Forward Everything
  - pro: as if both programs were running on the same local filesystem!
  - con: Latency, bad performance
- Caching Granularity: AFS file, NFS 4kb
- Cache Coherence Problem: Update Visibility & Cache Validation
- (Ideal) One-copy Semantics: From the user’s perspective, there is a single copy of the file that everyone is editing
- Parts of design: Cache, Consistency, Naming, Security
- Strategies
  1. Broadcast Invalidations to all clients; Gain: Simple & consistent
     - Loss: Network Traffic Explosion, Wasted Messages, fail to scale
  2. Check-on-Use; Gain: Simple & consistent
     - Loss: Every read triggers net round-trip (even if cache valid), Server bombarded with validation reqs, Eliminates most (+) of caching
  3. *NFS v2*: Attribute Caching with Timeouts. "Close enough" consistency for better performance
    - Client Caching: caches both clean and dirty file data and file attributes, *In memory – not as a file on disk*. File data is checked against the modified-time in file attributes (which could be a cached copy)
    - NFS's Failure Handling
      – Stateless Server: Server exports files without creating extra state
      - Operations are *idempotent*; *Write-through caching*: When file is closed, all modified blocks are sent to the server.
    - Naming: Local Integration. Each client constructs its own view
      - Mount remote filesystems at arbitrary points
      - Different clients see different namespaces
      - Simple but inconsistent, Users cannot share paths
  4. *AFS*: Callbacks, Server promises to notify the client if the file changes.
     - Gain: Read-heavy workloads require minimal server interaction, No periodic validation traffic
     - Loss: Server crash loses callback state, Client crash requires revalidation of all cached files, Network partitions challenge consistency 
     - Naming: Single global namespace. `/afs` visible identically everywhere; Complex but consistent
  5. Leases: A lease grants a client the right to cache data for a specified time period. The server promises not to allow modifications without notification during the lease period. (multi read-lease, one write-lease)
     - Gain: Bounded inconsistency, Automatic cleanup, Predictable server state, Failure resilience
     - Clock synchronization Not necessary: absolute time not relevant, But clock tick rate matters (server and client should have close rates)
- Can't max both consistency and performance. Choose the weakest consistency model that application can tolerate to achieve the best possible perf.
- Both AFS and NFS consciously violate UNIX semantics for performance
  - AFS: Changes visible to other clients only at session boundaries (open/close)
    Last Writer Wins (LWW) in AFS
  - Block Mixing in NFS: Individual 4KB blocks flush
- *Naming and Caching*
  - AFS Naming: /afs/\[cell\]/\[volume\]/\[path\]. 
    - Cell = Administrative Domain, Each cell runs its own AFS servers
    - Volume = Management Unit, Volume Location DB (VLDB) tracks loc
    - Pros: Same path works from any AFS client worldwide, Natural administrative boundaries
    - Cons: Requires global coordination and infrastructure
  - Directory Entry Caching (NFS, AFS): Caching name to inode mappings
  - Volume Location Caching (AFS): Caching volume to server mappings
  - Name resolution can dominate metadata-heavy workloads
- *Security*
  - adoption of Kerberos in both systems
  - AFS uses Kerberos which relies on Key Distribution Center (KDC) to establish shared symmetric keys: User proves to KDC who he is; KDC generates shared secret between client and file server