---
tags:
  - PL
title: Call-by-Need
---
以下假定语言 pure，不妨在 Call-by-name PCF 中讨论。

一般考虑实现 lazyness，我们会先想到 call-by-name (CBN)。但是对于同一个名字的多次使用会触发多次求值，因而我们会考虑“缓存”求值结果，或者说目标就是保证**求值至多发生一次**。这是 call-by-need 的核心保证，可以说 call-by-need = call-by-name + memoization。尽管概念听起来如此简单，保证求值安全运作还是需要引入更多的机制：

考虑在语言中引入一个 heap，其中存储了许多 once-cell 来缓存求值结果。但是当我们引入 **heap** 的同时，同时也产生了**时间**上的依赖：在求值完成前如果我们尝试使用这次求值本身的结果，整个过程该如何继续下去？

为了解决这个问题，我们在求值 dynamics 中引入 **Blackhole**，并展示为什么这样的 call-by-need lazy evaluation 恰是为语言中的项归约到 weak head normal form (WHNF) 的**有效**机制。

# Call-by-Need 的自指问题与 Weak Head Normal Form

在 pure, 无状态, call-by-name 的语言中，`fix` 可以轻易创造类似 `fix(x. x + 1)` 这样的发散项。尽管不停机，由于我们用的是 by-name 的替换，整个 evaluation 过程并不会遇到什么问题。

但是 call-by-need 语义规定我们的求值还要高效（**至多求值一次**）：我们必须缓存求值结果。为了实现结果的缓存，我们不得不放弃 substitution，而采用带 heap 状态的求值语义：
- 为了求 `fix(x.e)`，给 $e$ 分配一个 memory cell $a$；
- 求值 $e arrow.double.b v$，结果填入 $a$。
这带来了潜在的危险：**Causality Violation**。对于 `e = x + 1`，为了填充 memory cell $a$，我们必须计算 $+$；因而必须要 $a$ 的值来完成计算（这时还不存在）。与 call-by-name 不同的是，我们没法再次替换了——这直接违反求值至多一次的假设。因此我们必须**检测出这样不良构的递归计算，并直接以一个 stuck 的状态停机**。
## Guarded Recursion

在解决这个问题之前，我们先来思考：相比于“检测出这样不良构的计算”，有没有取巧的方法？

实际上 Call-by-value $"PCF"_v$ 在语言设计上就直接避免了这个问题：删去了 `fix`，而是只引入显式的递归函数 `fun(f; x.e)`。但是这样做对于 laziness 来说太极端了——我们失去了直接构造无限数据结构（`fix(xs. cons(1. xs))`）的能力，而这也是 laziness 为我们带来的重要能力。

那么回到 `fun(f; x.e)` 本身：为什么这是安全的？**因为函数定义本身就是一个值 (Value)。**

当我们定义 `val f = fn x => ...` 时，机器并不需要执行函数体内的代码，它只需要创建一个闭包对象（Closure）放在内存里就可以了。换句话说，**计算在遇到 λ-abstraction 时会立刻停下来**。我们不需要知道 $f$ 的具体计算结果就能把 $f$ 的壳子造出来。

我们可以把这种“遇到壳子就停”的特权，从函数推广到一般的数据结构上。在惰性语义中，我们将 **Constructors**（如 `cons`, `succ`, `pair`）以及 **Lambda** 统称为 **Introduction Forms**。它们的共同点在于**它们都是求值的终点（Value）**。

与之对立的是，为什么 `fix(x. x + 1)` 是不良的计算？答案在于，$+$ （以及 pattern matching, if）都是对应数据的 **Elimination Form**，且只有它们需要且必须使用数据。在惰性求值里，这意味着我们必须开始求这个值了（force）。基于这样的观察，我们便有了判断递归计算是否良构的方法：**Guarded Recursion**。

> [!definition] Guarded Recursion
> 
> 如果一个递归变量的所有出现都被包裹在 **Introduction Forms** 内部，那么这个递归就是 **Guarded** 的，也是安全的。
> - `fix(x. cons(1, x))`, `fun(f; x. ...f) = fix(f. fn x => ...f)` 都是安全的，其中 $x$ 被 `cons` 保护，$f$ 被 λ 保护。
> - `fix(x. x + 1)`, `fix(x. f x)` 都被排除掉，因为它们一直到最外层都直接暴露在 elimination form 下。

## 求值目标：Weak Head Normal Form

Guarded Recursion 之所以能保证安全，是因为 Call-by-Need 机器极其容易满足 (Lazy)，它并不试图把一个表达式完全求值（Fully Normalized），它的目标仅仅是 **Weak Head Normal Form (WHNF)**。

上文提到 Introduction Forms 是“求值的终点”，这正说明我们的求值目标就应该是 WHNF ：机器只关心表达式 **最外层 (Head)** 是什么构造。只要确定了它是 `cons`，或者是 `succ/zero`，或者是 `lambda`，机器就认为求值停止。这恰好够 Elimination Form 根据最外层判断应该采用哪个分支。

## Blackhole

实际上我们并不需要在静态语义里面就限制 `fix` 一定做 guarded recursion，在求值规则中引入运行时的 memory cell “锁”即可发现这条求值 trace 是否会有非良构的 `fix`。这就是 **Blackhole ($bullet$)**。 
- 每个 cell 有三种状态：指向一个未计算的表达式（Thunk）；锁：正在求值中，还没写回结果；值。

# Call-by-Need 语义的实现
## 抽象机记号
在 Call-by-Name 中，我们只需要处理表达式 $e$。但在 Call-by-Need 中，我们需要引入 **堆 (Heap)** 来存储那些“推迟计算”或“已经计算完”的结果。考虑采用 Modernized Algol 中的 heap machine 的变体：

> [!definition] 求值状态 $nu Sigma {mu || e}$
> 
> - $Sigma = a_1 tilde tau_1, ...$ 是 heap typing context
> - $mu = a arrow.hook e times.circle ...$ 是内存映射。地址 $a$ 可以指向：
> 	- $e$ (Thunk)：未计算的表达式；
> 	- $bullet$ (Blackhole)：正在计算中（锁）；
> 	- $v "val"$ (Value)：已经计算的结果 (WHNF)；
> - 初始状态 $nu emptyset {emptyset || e}$，终止状态 $nu Sigma {mu || v}$ 中 $v "val"$

Expression 中引入新的形式 $e ::= ... | @a$ （$@a$ 不是值）。
## Dynamics

### Lazy Allocation: Let, Fix
不难发现在语言中引入 `let(e; x. e')` 后，任何和 $x.e$ 这种 abstraction 有关的形式都可以用 `let` 重写。因此我们先考虑 `let`，这也是第一次遇到 lazy 语义的地方：当我们遇到 `let` 绑定时，我们并不立即计算，而是将代码“归档”：
$$
nu Sigma {mu || mono("let")(e\; x. e')} |-> nu Sigma, a tilde tau {mu times.circle a arrow.hook e || [@a slash x] e'}
$$
同样具有 lazy 语义的还有 `fix`：
$$
nu Sigma {mu || mono("fix")(x. e)} |-> nu Sigma, a tilde tau {mu times.circle a arrow.hook [@a slash x] e || @a}
$$

### Force: Elimination Forms

Elimination Forms 会强制触发计算（这里仅以 `ifz(e; e0; x. e1)`）为例：
$$
nu Sigma {mu || e} |-> nu Sigma' {mu' || e'} => nu Sigma {mu || mono("ifz")(e\; e_0\; x.e_1)} |-> nu Sigma' {mu' || mono("ifz")(e'\; e_0\; x.e_1)}
$$

计算到 WHNF，elimination form 根据最外层来确定应用哪一个分支：
$$
nu Sigma {mu || mono("ifz")(mono("zero")\; e_0\; x.e_1)} |-> nu Sigma {mu || e_0} \
nu Sigma, a tilde mono("nat") {mu times.circle a arrow.hook e || mono("ifz")(mono("succ")(@a)\; e_0\; x.e_1)} |-> nu Sigma, a tilde mono("nat") {mu || [@a slash x] e_1}
$$

### Value: Introduction Forms

Introduction Forms 是值：$lambda x. e "val"$, $mono("zero") "val"$, $mono("succ")(@a) "val"$。

前提是里面包含的计算要先存在 memory cell 里：
$$
nu Sigma {mu || mono("succ")(e)} |-> nu Sigma, a tilde mono("nat") {mu times.circle a arrow.hook e || mono("succ")(@a)}
$$

### Memoize

Call-by-need 要求我们记住计算结果：
$$
v "val" => nu Sigma, a tilde tau {mu times.circle a arrow.hook v || @a} |-> nu Sigma, a tilde tau {mu times.circle a arrow.hook v || v}
$$

如果 cache miss，触发一次计算，并使用 blackhole 来上锁：
$$
& nu Sigma, a tilde tau {mu times.circle a arrow.hook bullet || e} |-> nu Sigma, a tilde tau {mu times.circle a arrow.hook bullet || e'} \
=> & nu Sigma, a tilde tau {mu times.circle a arrow.hook e || @a} |-> nu Sigma, a tilde tau {mu times.circle a arrow.hook e' || @a}
$$

