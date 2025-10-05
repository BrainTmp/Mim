---
title: Mega Kernel
tags:
  - mlsys
---
## Existing Kernel-Per-Operator Approach
- No inter-layer pipelining: kernel barriers prevent inter-kernel pipelining, where 
	- Within a CUDA stream abstraction, kernels are strictly executed in parallel
- Load imbalance: the same stage may have different runtimes on different SMs
- Bubbles: when the number of CTAs cannot be evenly divided by the number of SMs