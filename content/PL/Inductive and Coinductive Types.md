---
title: Inductive and Coinductive Types
tags:
  - "#PL/types"
---
[[Recursive Types]] 描述了一种支持几乎无限制的类型自引用范式，这为我们的语言引入了 non-termination。但实际上很多递归都是结构化的，每次递归调用都减少结构规模时我们实际上有更强的终止性保证——这对应了数学意义上的“归纳”。利用归纳类型 (Inductive Types)，我们可以形式化地限制“结构化”这一要求，并在程序的计算中严格实现数学意义上的归纳。

与此同时，归纳类型的对偶 coinductive types 给出了另一类可表示潜在无限的数据结构，允许程序*逐步观察*一个潜在无限的对象（productivity）。

# 形式化定义及其背后的直觉
## F-Algebra
[[Recursive Types#类型方程与不动点]]中，我们用 type operator $F$ 描述了构造子的结构。考虑我们要定义的类型的值集合为 $A$，实际上 $F$ 描述的正是其上可以进行的操作的“签名”：

> [!example] 自然数上的 "algebra"
> 考虑函子 $F$ s.t. $F(X) = bold(1) + X$. 按 sum type 拆开，实际上它描述了两件事：
> - 我需要一个 $mono("zero") : bold(1) -> mono("nat")$ —— 如何解释 $mono("nat")$ 中的 $mono("zero")$？
> - 我需要一个 $mono("succ") : mono("nat") -> mono("nat")$ —— 如何解释 $mono("nat")$ 中的后继操作？
> 
> 它们合起来时，我们便找到了 $F$：
> $$
> alpha : F(mono("nat")) equiv bold(1) + mono("nat") -> mono("nat")
> $$
> 注意这里左边的形式！其意义正是：$F$ 说我们需要一个 $alpha$ 来解释自然数上的操作的意义，其中一个零元的为 zero，还有一个一元的 succ。

将上述讨论抽象为一个 carrier set $A$ 以及一个相关的 $alpha : F(A) -> A$ 解释 $A$ 上操作，我们就得到了一个代数（algebra）。在范畴论中，限制 $F$ 为 functor 时，我们便可以讨论 algebra 之间的态射：

> [!info] Definition. F-Algebra
> 给定一个 endofunctor $F: cal(C) -> cal(C)$，一个 **$F$-algebra** 是一个 pair $(A, alpha)$，其中
> - $A$ 是范畴 $cal(C)$ 中的对象（在编程语境中，可理解为“类型”），
> - $alpha: F(A) -> A$ 是一个态射，被称为该 algebra 的 **structure map**。
> 
> 直观地说，$alpha$ 告诉我们：如何将一层 $F$-结构（即由构造子描述的一层数据）“折叠”成一个 $A$ 的值。

如下交换图中的彩色箭头定义了 $F$-algebra 之间的态射：
```typst_svg
#import "@preview/fletcher:0.5.8" as fletcher: diagram, node, edge

#let tint(c) = (stroke: c, fill: rgb(..c.components().slice(0, 3), 5%), inset: 10pt)

#diagram(
  spacing: (3.5em, 2em),
  node-inset: 8pt,
  node-corner-radius: 4pt,

  node((0, 0), $F(A)$),
  node((0, 2), $A$),
  node((2, 0), $F(B)$),
  node((2, 2), $B$),
  edge((0, 0), (0, 2), "->", $alpha$),
  edge((0, 0), (2, 0), "->", $F(f)$),
  edge((2, 0), (2, 2), "->", $beta$),
  edge((0, 2), (2, 2), "->", $f$),
  
  node(enclose: ((0,0), (0,2)), ..tint(orange), name: <A>),
  node(enclose: ((2,0), (2,2)), ..tint(yellow), name: <B>),

  edge(<A>, <B>, "=>", stroke: color.mix(orange, yellow) + .75pt),
)
```

## Initial Algebra 与归纳原理
在集合论或类型论中，我们早已熟悉自然数的**归纳原理**：
若要证明某性质 $P(n)$ 对所有 $n : mono("nat")$ 都成立，只需证明：
- (1) $P(0)$ 成立 $-> a_0 = P("zero") : "Prop"$；
- (2) 若 $P(n)$ 成立，则 $P(op("succ")(n))$ 也成立 $-> g: P(n) -> P(mono("succ")(n))$。

则可推出：对所有 $n: mono("nat")$，$P(n)$ 成立。从命题-类型同构的角度看，其实这说的正是：
> （结构递归）要定义函数 $P: mono("nat") -> rho$，我们只需给出 base case $a_0$ 以及递推规则 $P(mono("succ")(n)) := g(P(n))$。这样，$P$ 便**唯一确定**。

画成交换图，我们找到了熟悉的模式！
```typst_svg
#import "@preview/fletcher:0.5.8" as fletcher: diagram, node, edge

#let tint(c) = (stroke: c, fill: rgb(..c.components().slice(0, 3), 5%), inset: 10pt)

#diagram(
  spacing: (3.5em, 2em),
  node-inset: 8pt,
  node-corner-radius: 4pt,

  node((0, 0), $bold(1) + NN$),
  node((2, 0), $NN$),
  node((0, 2), $bold(1) + rho$),
  node((2, 2), $rho$),
  edge((0, 0), (2, 0), "->", $[mono("zero"), mono("succ")]$),
  edge((0, 0), (0, 2), "->", $bold(1) + P$),
  edge((0, 2), (2, 2), "->", $[a_0, g]$),
  edge((2, 0), (2, 2), "->", $P$),

  node(enclose: ((0, 0), (2, 0)), ..tint(orange), name: <A>),
  node(enclose: ((0, 2), (2, 2)), ..tint(yellow), name: <B>),

  edge(<A>, <B>, "=>", stroke: color.mix(orange, yellow) + .75pt),
)
```

我们看到 $P$ 之所以存在并且唯一，正是因为 $F$-algebra $(mono("nat"), [mono("zero"), mono("succ")])$ 拥有一种**初始性**：它是“一切形如 $(rho, [a_0, g] : bold(1) + rho -> rho)$” 的结构中的最初对象——任何别的同类型结构都只能由它**唯一地**折叠（fold）得。

推广至一般的 $F$-algebra，我们可以把熟悉的数学归纳原理，理解为对某个范畴论事实的特例说明：
```typst_svg
#import "@preview/fletcher:0.5.8" as fletcher: diagram, node, edge

#let tint(c) = (stroke: c, fill: rgb(..c.components().slice(0, 3), 5%), inset: 10pt)

#diagram(
  spacing: (3.5em, 2em),
  node-inset: 8pt,
  node-corner-radius: 4pt,

  node((0, 0), $F(mu F)$),
  node((0, 2), $mu F$),
  node((2, 0), $F(rho)$),
  node((2, 2), $rho$),
  edge((0, 0), (0, 2), "->", $mono("fold")$),
  edge((0, 0), (2, 0), "->", $F(mono("rec"))$),
  edge((2, 0), (2, 2), "->", text(size: 10pt, $mono("comp")$), label-side: left),
  edge((0, 2), (2, 2), "-->", $exists ! mono("rec")$),
  
  node(enclose: ((0,0), (0,2)), ..tint(teal), name: <muF>),
  node(enclose: ((2,0), (2,2)), ..tint(green), name: <rho>),

  edge(<muF>, <rho>, "=>", stroke: color.mix(teal, green) + .75pt),
)
```


> [!info] Definition. Initial F-Algebra
> 我们说一个F-Algebra $(mu F, mono("fold"): F(mu F) -> mu F)$ 是 initial algebra 当且仅当其满足：
> 
> 对于任意代数 $(rho, mono("comp"))$, 存在唯一的归纳原理
> $$
> "rec" : (mono("comp") : F(rho) -> rho) -> mu F -> rho
> $$
> 使上述图表交换。
> 
> 熟悉范畴论的读者可能会发现，这其实就是在说 $(mu F, mono("fold"): F(mu F) -> mu F)$ 是范畴 $bold("Alg")_F$ 中的 initial object。

至此，我们最终可以形式化定义 inductive type 了——An inductive type is just a initial object in the category of F-algebra, what's the problem? [\(Iry, J. (2009). _A Brief, Incomplete, and Mostly Wrong History of Programming Languages_\)](https://james-iry.blogspot.com/2009/05/brief-incomplete-and-mostly-wrong.html)

### 何意味？
在最后的交换图表中，可以发现我们已经悄悄将态射的记号换成了在编程语言中会出现的名字。实际上，用类似[[Recursive Types]]的视角，说 inductive type 是 initial algebra 就是意味着我们有如下两个操作：
- 用 $mono("fold")$ 构造：对于子结构 $x: mu F$ 应用一层构造子得到 $x' : F(mu F)$，然后将其“折叠”回原类型；
- 有唯一的 $mono("rec")$ 计算：这是唯一允许的操作 inductively defined 对象的方法，也即结构递归。

### “带限制的 recursive type“
- TODO: covariant functor $F$ 构造 `self` type


## Final Algebra and Co-induction

# (Co)inductive Types 的现实理解


