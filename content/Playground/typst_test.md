---
title: Test Typst
---
# Some random SVG from Typst
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
```typst_svg
#import "@preview/fletcher:0.5.8" as fletcher: diagram, node, edge

#let Ccat = math.cal($C$)
#let CSet = math.serif("Set")
#let Vect = math.serif("Vect")
#let opp = "op"
#let ev = math.op("ev")
#let Ob = math.op("Ob")
#let Yon = "よ"

#let Fct = math.op("Fct")
#let Hom = math.op("Hom")
#let Nat = math

#diagram(
  node((0, 0), $Yon(Y)$),
  node((1, 0), $Yon(X)$),
  node((1, 1), $A$),
  edge((0, 0), (1, 1), "->", $psi$),
  edge((0, 0), (1, 0), "->", $Yon(f)$),
  edge((1, 0), (1, 1), "<->", $phi$,),
)
```
# Some random math
Choose a parameter $u$ and denote $Y = X - EE[X]$. Follow the idea used in Chebyshev's inequality, we have:

$$
P(X-EE[X] >= lambda) &= P(Y+u >= lambda + u) \
&<= P((Y+u)^2 >= (lambda + u)^2) \
&<= EE[(Y+u)^2]/(lambda + u)^2 \
&= (sigma^2 + u^2) / (lambda + u)^2 \
&=^(u = sigma^2/lambda) sigma^2 / (sigma^2 + lambda^2).
$$

The choice of $u$ above minimizes the right-hand side of the inequality.
Equality holds when:
- $Pr[Y<= -lambda - 2u] = 0$,
- Markov's inequality: equality when $EE[X] = a P(X>=a) <=> EE[X - X dot bold(1)_{X>=a}] = 0$, and since $X, bold(1)_{X>=a} >= 0$, this means $X = X dot bold(1)_{X>=a}$ almost surely.
- Further, $Pr(X>a) !=0$ violates $EE[X] = a P(X>=a)$, so $Pr(X>a) = 0$.
- This means that $X$ follows a two-point distribution almost surely.
- In this case, $(Y+u)^2$ follows a two-point distribution as well, at $Y = -u$ and $Y = lambda or -lambda - 2u$. $-lambda - 2u$ is not possible since $Pr(Y<= -lambda - 2u) = 0$.
In simple terms, the equality holds when $X$ is a two-point distribution, where $Pr[X = EE[X]-sigma^2/lambda] = lambda^2/(lambda^2+sigma^2) space (1-"RHS")$ and $Pr[X = EE[X]+lambda] = sigma^2/(lambda^2+sigma^2) space ("RHS")$.