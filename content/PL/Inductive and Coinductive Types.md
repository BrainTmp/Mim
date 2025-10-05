---
title: Inductive and Coinductive Types
tags:
  - "#PL/types"
---
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