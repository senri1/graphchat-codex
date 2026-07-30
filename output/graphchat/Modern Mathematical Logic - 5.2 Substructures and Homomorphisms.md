# 5.2 Substructures and Homomorphisms

One of the basic ways to obtain new algebraic structures (whether vector spaces, groups, or rings) is to find them *inside* already established ones. For example, when working in the vector space of all functions \(f : \mathbb{R} \to \mathbb{R}\) under the usual pointwise operations, we can form the subspace of continuous functions, or the subspace of differentiable functions. Within the symmetric groups \(S_n\), one naturally defines the alternating groups \(A_n\) and the dihedral groups \(D_n\). These ideas also arise in combinatorial structures, such as when examining subgraphs of a given graph or viewing a partial ordering as a piece of a larger one. The general unifying concept here is that of a substructure.

**Definition 5.2.1** Let \(\mathcal{L}\) be a language and let \(\mathcal{M}\) and \(\mathcal{A}\) be \(\mathcal{L}\)-structures. We say that \(\mathcal{A}\) is a *substructure* of \(\mathcal{M}\) if the following conditions hold:

1. \(A \subseteq M\), where \(A\) and \(M\) are the underlying sets of \(\mathcal{A}\) and \(\mathcal{M}\), respectively.
2. \(c^{\mathcal{A}} = c^{\mathcal{M}}\) for all \(c \in \mathrm{ConSym}\).
3. \(R^{\mathcal{A}} = R^{\mathcal{M}} \cap A^k\) for all \(R \in \mathrm{RelSym}_k\).
4. \(f^{\mathcal{A}} = f^{\mathcal{M}} \mathbin{\upharpoonright} A^k\) for all \(f \in \mathrm{FuncSym}_k\).

In other words, a structure \(\mathcal{A}\) is a substructure of \(\mathcal{M}\) if we might have thrown away some of the elements of the set \(M\), but on the remaining set \(A\) we have faithfully maintained the interpretation of every symbol. The second and fourth conditions imply a few simple closure properties about our set \(A \subseteq M\). We now prove that these closure properties are necessary and sufficient conditions for \(A\) to be the universe (i.e. the underlying set) of a substructure of \(\mathcal{M}\).

**Proposition 5.2.2** *Let \(\mathcal{M}\) be an \(\mathcal{L}\)-structure, and let \(A \subseteq M\) be nonempty. The following are equivalent:*

1. *\(A\) is the universe of a substructure of \(\mathcal{M}\), that is, there is a substructure \(\mathcal{A}\) of \(\mathcal{M}\) with \(A\) as the underlying set.*
2. *Every element of \(M\) that is named by a constant appears in \(A\), and \(A\) is closed under the functions \(f^{\mathcal{M}}\) for each \(f \in \mathrm{FuncSym}\). More formally, we have \(\{c^{\mathcal{M}} : c \in \mathrm{ConSym}\} \subseteq A\) and \(f^{\mathcal{M}}(a_1,\ldots,a_k) \in A\) for all \(f \in \mathrm{FuncSym}_k\) and all \(a_1,\ldots,a_k \in A\).*

*Proof.* We first prove that (1) \(\Rightarrow\) (2). Let \(\mathcal{A}\) be a substructure of \(\mathcal{M}\) with underlying set \(A\). For any \(c \in \mathrm{ConSym}\), we have \(c^{\mathcal{A}} \in A\) by definition of a structure, and \(c^{\mathcal{A}} = c^{\mathcal{M}}\) by definition of a substructure, so we conclude that \(c^{\mathcal{M}} \in A\). Now let \(f \in \mathrm{FuncSym}_k\) and \(a_1,\ldots,a_k \in A\) be arbitrary. We have \(f^{\mathcal{A}}(a_1,\ldots,a_k) \in A\) by definition of a structure, so since \(f^{\mathcal{A}} = f^{\mathcal{M}} \mathbin{\upharpoonright} A^k\), we conclude that

\[
f^{\mathcal{M}}(a_1,\ldots,a_k)
= f^{\mathcal{A}}(a_1,\ldots,a_k)
\in A.
\]

We now prove that (2) \(\Rightarrow\) (1). Assume then that \(\{c^{\mathcal{M}} : c \in \mathrm{ConSym}\} \subseteq A\) and that \(f^{\mathcal{M}}(a_1,\ldots,a_k) \in A\) for all \(f \in \mathrm{FuncSym}_k\) and all \(a_1,\ldots,a_k \in A\). We can then define each \(c^{\mathcal{A}}\), \(R^{\mathcal{A}}\), and \(f^{\mathcal{A}}\) as in Definition 5.2.1, and notice that these definitions make sense by our assumptions (i.e. we have each \(c^{\mathcal{A}} \in A\) and each \(f^{\mathcal{A}}\) is actually a function from \(A^k\) to \(A\)). Therefore, \(A\) is the universe of a substructure of \(\mathcal{A}\). \(\square\)

For example, suppose that we are working in the language \(\mathcal{L} = \{\mathsf{e},\mathsf{f}\}\) of monoids, and we let \(\mathcal{M} = (\mathbb{Z},0,+)\), that is, \(\mathcal{M}\) is the \(\mathcal{L}\)-structure with universe \(\mathbb{Z}\), \(\mathsf{e}^{\mathcal{M}} = 0\), and \(\mathsf{f}^{\mathcal{M}}\) equal to the usual addition. Letting \(A = \mathbb{N}\), we have that \(A\) contains \(0 = \mathsf{e}^{\mathcal{M}}\) and is closed under \(\mathsf{f}^{\mathcal{M}}\). In other words, we can view \(A\) as the universe of a substructure \(\mathcal{A}\) of \(\mathcal{M}\). However, \(\mathcal{A}\) is *not* a subgroup of \(\mathcal{M}\), because it is not closed under inverses. The problem here is that the inverse function is not the interpretation of any of the function symbols, so a substructure need not be closed under it. However, if we use the language of groups rather than the language of monoids, then a substructure of a group is precisely the same thing as a subgroup. In other words, our choice of language affects what our substructures are. The fact that substructures correspond to subgroups in the latter language is the primary reason why we call it the *language of groups*.

A similar situation happens with the choice of a language of rings. If we work with the language \(\mathcal{L} = \{0,1,+,\mathord{\cdot}\}\) of semirings, and we have an \(\mathcal{L}\)-structure \(\mathcal{M}\) that is a ring, then a substructure would necessarily contain both the additive and multiplicative identities and be closed under both addition and multiplication. However, these conditions do not force a substructure to be closed under additive inverses (again consider \(\mathbb{N}\) as a subset of the ring \(\mathbb{Z}\)), and so substructures do not correspond to subrings. Thus, if we want substructures of rings to be subrings, then we should include a unary function symbol \(-\) for additive inverses (or, alternatively, a binary function \(-\) for subtraction). Notice that because we include the constant symbol \(1\), every substructure of a ring will be a subring with the *same* multiplicative identity, which contrasts with the way a few (unenlightened) sources define subrings. Finally, even if our \(\mathcal{L}\)-structure happened to be a field, then a substructure need not be a subfield, but merely a subring. Again, these issues help explain the choice of names for the various languages.

Our discussion shows that we can often change the language in order to make substructures correspond to the usual definition of *subobject* in a given area of mathematics. However, there are some contexts where there is some conflict. In the definition of substructure, an element of \(A^k\) is an element of \(R^{\mathcal{A}}\) if and only if it is an element of \(R^{\mathcal{M}}\), and this condition does not always match up with standard definitions of subobjects. For example, suppose we are working in the language \(\mathcal{L} = \{\mathsf{R}\}\), where \(\mathsf{R}\) is a binary relation symbol. Let \(\mathcal{M}\) be an \(\mathcal{L}\)-structure that is a graph, that is, such that \(\mathcal{M} \models \forall x \forall y(\mathsf{R}xy \to \mathsf{R}yx)\). Typically, a subgraph of a given graph is a subset where we are allowed to omit some vertices and edges, including the possibility of removing an edge despite keeping its endpoints. For example, if \(M = \{1,2,3,4\}\) and

\[
\mathsf{R}^{\mathcal{M}}
= \{(1,2),(2,1),(1,3),(3,1),(2,3),(3,2),(3,4),(4,3)\},
\]

then the graph with \(A = \{1,2,3\}\) and

\[
\mathsf{R}^{\mathcal{A}}
= \{(1,2),(2,1),(1,3),(3,1)\}
\]

is a subgraph under the standard definition. Notice, however, that the corresponding \(\mathcal{A}\) is *not* a substructure of \(\mathcal{M}\), because

\[
\mathsf{R}^{\mathcal{M}} \mathbin{\upharpoonright} A^2
= \{(1,2),(2,1),(1,3),(3,1),(2,3),(3,2)\}.
\]

In this context, the definition of a substructure matches up with the concept of an *induced* subgraph. In order to handle situations like general subgraphs, some sources define the concept of a *weak substructure* by leaving conditions (1), (3), and (4) of Definition 5.2.1 alone, but changing condition (2) to be \(R^{\mathcal{A}} \subseteq R^{\mathcal{M}} \cap A^k\) for all \(R \in \mathrm{RelSym}_k\).

Suppose that we have a structure \(\mathcal{M}\), and we have some set \(B \subseteq M\). How can we obtain a substructure \(\mathcal{A}\) of \(\mathcal{M}\) such that \(B \subseteq A\)? By Proposition 5.2.2, we need to ensure that \(A\) contains both \(B\) and the interpretation of the constants, and is closed under the functions \(f^{\mathcal{M}}\). Thus, we can build a substructure (in fact, the smallest substructure containing \(B\)) by starting with \(B\) and the various \(c^{\mathcal{M}}\), and then generating new elements, which leads to the following result. Notice that we need to assume that either \(B \ne \varnothing\) or \(\mathrm{ConSym} \ne \varnothing\) so that we start with a nonempty set, since we require that \(A \ne \varnothing\) (as the underlying set of any structure must be nonempty by definition).

**Corollary 5.2.3** *Let \(\mathcal{M}\) be an \(\mathcal{L}\)-structure, and let \(B \subseteq M\) be an arbitrary set. Suppose either that \(B \ne \varnothing\) or \(\mathrm{ConSym} \ne \varnothing\). If we let*

\[
A
= G\bigl(M, B \cup \{c^{\mathcal{M}} : c \in \mathrm{ConSym}\},
\{f^{\mathcal{M}} : f \in \mathrm{FuncSym}\}\bigr),
\]

*then \(A\) is the universe of a substructure of \(\mathcal{M}\). Moreover, if \(\mathcal{N}\) is any substructure of \(\mathcal{M}\) with \(B \subseteq N\), then \(A \subseteq N\).*

We now seek to generalize the concept of a homomorphism from its algebraic roots to more general structures. In group theory, a homomorphism is a function that preserves the binary operation. In this setting, it is straightforward to check that a group homomorphism automatically sends the identity to the identity and sends the inverse of an element to the inverse of the image of that element. For rings with identity, it is possible to have a function that preserves both addition and multiplication, but not the multiplicative identity. As in the definition of substructure, we require that the interpretation of each of the first-order symbols from \(\mathcal{L}\) is preserved. As a result, if we choose to include a constant symbol for the multiplicative identity in our language, then the multiplicative identity of the first ring must be sent to the multiplicative identity of the second (as most sources enforce in the definition of a ring homomorphism). Thus, as with substructures, our choice of language will affect which functions we call homomorphisms.

**Definition 5.2.4** Let \(\mathcal{L}\) be a language, and let \(\mathcal{M}\) and \(\mathcal{N}\) be \(\mathcal{L}\)-structures.

1. A function \(h : M \to N\) is called a *homomorphism* if it satisfies the following conditions:

   (a) For all \(c \in \mathrm{ConSym}\), we have \(h(c^{\mathcal{M}}) = c^{\mathcal{N}}\).

   (b) For all \(R \in \mathrm{RelSym}_k\) and all \(a_1,\ldots,a_k \in M\), we have \((a_1,\ldots,a_k) \in R^{\mathcal{M}}\) if and only if \((h(a_1),\ldots,h(a_k)) \in R^{\mathcal{N}}\).

   (c) For all \(f \in \mathrm{FuncSym}_k\) and all \(a_1,\ldots,a_k \in M\), we have

      \[
      h\bigl(f^{\mathcal{M}}(a_1,\ldots,a_k)\bigr)
      = f^{\mathcal{N}}\bigl(h(a_1),\ldots,h(a_k)\bigr).
      \]

2. A function \(h : M \to N\) is called an *embedding* if it is an injective homomorphism.
3. A function \(h : M \to N\) is called an *isomorphism* if it is a bijective homomorphism.

**Definition 5.2.5** Let \(\mathcal{L}\) be a language, and let \(\mathcal{M}\) and \(\mathcal{N}\) be \(\mathcal{L}\)-structures. We say that \(\mathcal{M}\) and \(\mathcal{N}\) are *isomorphic* if there exists an isomorphism \(h : M \to N\). In this case, we write \(\mathcal{M} \cong \mathcal{N}\).

We pause again to note that this definition occasionally differs from the usual mathematical definition of a homomorphism in languages with relation symbols. For instance, a graph homomorphism is often defined as a function with the property that if \((a,b)\) is an edge in the first graph, then \((h(a),h(b))\) is an edge in the second. Note that this definition corresponds to only one direction of (1b), rather than an equivalence. Some logic sources do indeed change (1b) in the definition of homomorphism to the weaker condition that whenever \((a_1,\ldots,a_k) \in R^{\mathcal{M}}\), we have \((h(a_1),\ldots,h(a_k)) \in R^{\mathcal{N}}\). Such sources often use the terminology *strong homomorphism* for what we are simply calling a homomorphism, while sources that use our definition of homomorphism sometimes refer to the weaker notion as a *positive homomorphism*. In either case, embeddings and isomorphisms are always assumed to satisfy the equivalence described in part (1b), so there is no ambiguity when using these terms. Since we will almost exclusively work with embeddings and isomorphisms (rather than just homomorphisms), we choose to adopt the above version of the definition of homomorphism for simplicity.

Our next result says that we can translate between the concepts of substructures and embeddings. Of course, if we have an embedding \(h : M \to N\) of a structure \(\mathcal{M}\) into a structure \(\mathcal{N}\), then \(\mathcal{M}\) is likely not an actual substructure of \(\mathcal{N}\), as the universes \(M\) and \(N\) might be very different. However, \(\mathcal{M}\) will be isomorphic to a substructure of \(\mathcal{N}\).

**Proposition 5.2.6** *Let \(\mathcal{L}\) be a language, and let \(\mathcal{M}\) be an \(\mathcal{L}\)-structure.*

1. *Let \(\mathcal{A}\) be an \(\mathcal{L}\)-structure with \(A \subseteq M\). We then have that \(\mathcal{A}\) is a substructure of \(\mathcal{M}\) if and only if the inclusion function \(i : A \to M\) given by \(i(a)=a\) is an embedding.*
2. *Let \(\mathcal{N}\) be an \(\mathcal{L}\)-structure, and let \(h : M \to N\) be an embedding. Let \(B = \operatorname{range}(h) \subseteq N\). Then \(B\) is the universe of a substructure \(\mathcal{B}\) of \(\mathcal{N}\), and \(\mathcal{M} \cong \mathcal{B}\).*

*Proof.* See Exercise 6. \(\square\)

We now jump into our primary theorem about how embeddings and isomorphisms interact with the formulas of our language. The last part of the theorem gives one precise way to say that all “reasonable” properties are preserved by an isomorphism. It is not at all clear how to make this intuition precise in algebra, but we now have a formal language that allows us to codify (at least some) “reasonable” properties. Since first-order formulas are generated from atomic formulas using simple rules, we can prove by induction that all properties expressible by first-order formulas are preserved.

**Theorem 5.2.7** *Let \(\mathcal{L}\) be a language, and let \(\mathcal{M}\) and \(\mathcal{N}\) be \(\mathcal{L}\)-structures. Suppose that \(h : M \to N\) is a homomorphism, and suppose that \(s : \mathrm{Var} \to M\) is a variable assignment. We have the following:*

1. *The function \(h \circ s\) is a variable assignment on \(\mathcal{N}\).*
2. *For any \(t \in \mathrm{Term}_{\mathcal{L}}\), we have \(h\bigl(\overline{s}(t)\bigr) = \overline{h \circ s}(t)\).*
3. *If \(h\) is an embedding, then for every quantifier-free \(\varphi \in \mathrm{Form}_{\mathcal{L}}\), we have \((\mathcal{M},s) \models \varphi\) if and only if \((\mathcal{N},h \circ s) \models \varphi\).*
4. *If \(h\) is an isomorphism, then for every \(\varphi \in \mathrm{Form}_{\mathcal{L}}\), we have \((\mathcal{M},s) \models \varphi\) if and only if \((\mathcal{N},h \circ s) \models \varphi\).*

*Proof.*

1. Immediate from the fact that \(s : \mathrm{Var} \to M\) and \(h : M \to N\), so \(h \circ s : \mathrm{Var} \to N\).

2. The proof is by induction on \(t\). We have two base cases. For any \(c \in \mathrm{ConSym}\), we have

   \[
   \begin{aligned}
   h\bigl(\overline{s}(c)\bigr)
   &= h(c^{\mathcal{M}}) \\
   &= c^{\mathcal{N}}
   && \text{(since } h \text{ is a homomorphism)} \\
   &= \overline{h \circ s}(c).
   \end{aligned}
   \]

   Also, for any \(x \in \mathrm{Var}\), we have

   \[
   \begin{aligned}
   h\bigl(\overline{s}(x)\bigr)
   &= h\bigl(s(x)\bigr) \\
   &= (h \circ s)(x) \\
   &= \overline{h \circ s}(x).
   \end{aligned}
   \]

   For the inductive step, let \(f \in \mathrm{FuncSym}_k\) and let \(t_1,\ldots,t_k \in \mathrm{Term}_{\mathcal{L}}\) be such that the statement is true for each \(t_i\). We then have

   \[
   \begin{aligned}
   h\bigl(\overline{s}(ft_1\cdots t_k)\bigr)
   &= h\bigl(f^{\mathcal{M}}(\overline{s}(t_1),\ldots,\overline{s}(t_k))\bigr)
   && \text{(by definition of } \overline{s} \text{)} \\
   &= f^{\mathcal{N}}\bigl(h(\overline{s}(t_1)),\ldots,h(\overline{s}(t_k))\bigr)
   && \text{(since } h \text{ is a homomorphism)} \\
   &= f^{\mathcal{N}}\bigl(\overline{h \circ s}(t_1),\ldots,\overline{h \circ s}(t_k)\bigr)
   && \text{(by induction)} \\
   &= \overline{h \circ s}(ft_1\cdots t_k)
   && \text{(by definition of } \overline{h \circ s} \text{).}
   \end{aligned}
   \]

   Hence, the statement is true for \(ft_1\cdots t_k\), which completes the induction.

3. The proof is by induction on \(\varphi\) and is trivial for \(\top\) and \(\bot\). For any \(R \in \mathrm{RelSym}_k\) and any \(t_1,\ldots,t_k \in \mathrm{Term}_{\mathcal{L}}\), we have

   \[
   \begin{aligned}
   (\mathcal{M},s) \models Rt_1\cdots t_k
   &\iff \bigl(\overline{s}(t_1),\ldots,\overline{s}(t_k)\bigr) \in R^{\mathcal{M}} \\
   &\iff \bigl(h(\overline{s}(t_1)),\ldots,h(\overline{s}(t_k))\bigr) \in R^{\mathcal{N}}
   && \text{(since } h \text{ is a homomorphism)} \\
   &\iff \bigl(\overline{h \circ s}(t_1),\ldots,\overline{h \circ s}(t_k)\bigr) \in R^{\mathcal{N}}
   && \text{(by part (2))} \\
   &\iff (\mathcal{N},h \circ s) \models Rt_1\cdots t_k.
   \end{aligned}
   \]

   Also, for any \(t_1,t_2 \in \mathrm{Term}_{\mathcal{L}}\), we have

   \[
   \begin{aligned}
   (\mathcal{M},s) \models t_1=t_2
   &\iff \overline{s}(t_1)=\overline{s}(t_2) \\
   &\iff h(\overline{s}(t_1))=h(\overline{s}(t_2))
   && \text{(since } h \text{ is injective)} \\
   &\iff \overline{h \circ s}(t_1)=\overline{h \circ s}(t_2)
   && \text{(by part (2))} \\
   &\iff (\mathcal{N},h \circ s) \models t_1=t_2.
   \end{aligned}
   \]

   Now if the statement is true for \(\varphi\), then we have

   \[
   \begin{aligned}
   (\mathcal{M},s) \models \neg\varphi
   &\iff (\mathcal{M},s) \not\models \varphi \\
   &\iff (\mathcal{N},h \circ s) \not\models \varphi
   && \text{(by induction)} \\
   &\iff (\mathcal{N},h \circ s) \models \neg\varphi,
   \end{aligned}
   \]

   so the statement is true for \(\neg\varphi\). Also, if the statement is true for \(\varphi\) and \(\psi\), then

   \[
   \begin{aligned}
   (\mathcal{M},s) \models \varphi \land \psi
   &\iff (\mathcal{M},s) \models \varphi
   \text{ and }(\mathcal{M},s) \models \psi \\
   &\iff (\mathcal{N},h \circ s) \models \varphi
   \text{ and }(\mathcal{N},h \circ s) \models \varphi
   && \text{(by induction)} \\
   &\iff (\mathcal{N},h \circ s) \models \varphi \land \psi,
   \end{aligned}
   \]

   so the statement is true for \(\varphi \land \psi\). The connectives \(\lor\) and \(\to\) follow similarly, completing the induction.

4. In light of the proof of (3), we need only handle the inductive steps involving quantifiers. Suppose that the statement is true for \(\varphi\) and that \(x \in \mathrm{Var}\). We have

   \[
   \begin{aligned}
   (\mathcal{M},s) \models \exists x\varphi
   &\iff \text{There exists } a \in M \text{ with }
   (\mathcal{M},s[x \rightsquigarrow a]) \models \varphi \\
   &\iff \text{There exists } a \in M \text{ with }
   (\mathcal{N},h \circ (s[x \rightsquigarrow a])) \models \varphi
   && \text{(by induction)} \\
   &\iff \text{There exists } a \in M \text{ with }
   (\mathcal{N},(h \circ s)[x \rightsquigarrow h(a)]) \models \varphi \\
   &\iff \text{There exists } b \in N \text{ with }
   (\mathcal{N},(h \circ s)[x \rightsquigarrow b]) \models \varphi
   && \text{(since } h \text{ is surjective)} \\
   &\iff (\mathcal{N},h \circ s) \models \exists x\varphi,
   \end{aligned}
   \]

   and also

   \[
   \begin{aligned}
   (\mathcal{M},s) \models \forall x\varphi
   &\iff \text{For all } a \in M \text{, we have }
   (\mathcal{M},s[x \rightsquigarrow a]) \models \varphi \\
   &\iff \text{For all } a \in M \text{, we have }
   (\mathcal{N},h \circ (s[x \rightsquigarrow a])) \models \varphi
   && \text{(by induction)} \\
   &\iff \text{For all } a \in M \text{, we have }
   (\mathcal{N},(h \circ s)[x \rightsquigarrow h(a)]) \models \varphi \\
   &\iff \text{For all } b \in N \text{, we have }
   (\mathcal{N},(h \circ s)[x \rightsquigarrow b]) \models \varphi
   && \text{(since } h \text{ is surjective)} \\
   &\iff (\mathcal{N},h \circ s) \models \forall x\varphi.
   \end{aligned}
   \]

   \(\square\)

**Corollary 5.2.8** *Let \(\mathcal{L}\) be a language, and let \(\mathcal{M}\) and \(\mathcal{N}\) be \(\mathcal{L}\)-structures. If \(\mathcal{M} \cong \mathcal{N}\), then \(\mathcal{M} \equiv \mathcal{N}\).*

*Proof.* Let \(\mathcal{M}\) and \(\mathcal{N}\) be \(\mathcal{L}\)-structures, and assume that \(\mathcal{M} \cong \mathcal{N}\). Fix an isomorphism \(h : M \to N\). Let \(\sigma \in \mathrm{Sent}_{\mathcal{L}}\) be arbitrary. Fix some (any) variable assignment on \(M\). By Theorem 5.2.7, we have \((\mathcal{M},s) \models \sigma\) if and only if \((\mathcal{N},h \circ s) \models \sigma\). Now since \(\sigma\) has no free variables, the variable assignments do not matter (see Notation 4.2.8), so we conclude that \(\mathcal{M} \models \sigma\) if and only if \(\mathcal{N} \models \sigma\). Since \(\sigma \in \mathrm{Sent}_{\mathcal{L}}\) was arbitrary, it follows that \(\mathcal{M} \equiv \mathcal{N}\). \(\square\)

Somewhat surprisingly, the converse of Corollary 5.2.8 is *not* true. In other words, there are elementarily equivalent structures that are not isomorphic. In fact, not only do such examples exist, but we will see that for *every* infinite structure \(\mathcal{M}\), there exists a structure \(\mathcal{N}\) with \(\mathcal{M} \equiv \mathcal{N}\) but \(\mathcal{M} \not\cong \mathcal{N}\). Beyond how intrinsically amazing this result is, it also turns out to be incredibly useful. If we want to show that \(\mathcal{M} \models \sigma\) for a given \(\sigma \in \mathrm{Sent}_{\mathcal{L}}\), we can think about going to an elementarily equivalent structure \(\mathcal{N}\) that is easier to work with or understand, and show that \(\mathcal{N} \models \sigma\). We will eventually see some extraordinary examples of arguments in this style (see Chapter 7).

Returning to substructures, notice that if \(\mathcal{A}\) is a substructure of \(\mathcal{M}\), then we typically have \(\mathcal{A} \not\equiv \mathcal{M}\). For instance, it is possible that a subgroup of a nonabelian group is abelian. More concretely, if \(\mathcal{M}\) is the symmetric group \(S_3\), and \(\mathcal{A}\) is the substructure of \(\mathcal{M}\) with underlying set \(\{\mathit{id},(1\ 2)\}\) (where \(\mathit{id}\) is the identity function), then we have \(\mathcal{M} \not\models \forall x \forall y(x \mathbin{\cdot} y = y \mathbin{\cdot} x)\), but \(\mathcal{A} \models \forall x \forall y(x \mathbin{\cdot} y = y \mathbin{\cdot} x)\). Nonetheless, there are a few important relationships between truth in \(\mathcal{A}\) and truth in \(\mathcal{M}\) for some restricted types of formulas. We start with the following fundamental fact.

**Corollary 5.2.9** *Suppose that \(\mathcal{A}\) is a substructure of \(\mathcal{M}\). For any quantifier-free formula \(\varphi\) and any \(s : \mathrm{Var} \to A\), we have \((\mathcal{A},s) \models \varphi\) if and only if \((\mathcal{M},s) \models \varphi\).*

*Proof.* The inclusion function \(i : A \to M\) is an embedding by Proposition 5.2.6, so the result is immediate from part (3) of Theorem 5.2.7, and the fact that \(i \circ s = s\) for all variable assignments \(s : \mathrm{Var} \to A\). \(\square\)

We can push a bit further if we only allow a very limited version of quantification in our formulas.

**Definition 5.2.10** Let \(\mathcal{L}\) be a language.

1. An *existential formula* is a formula of the form \(\exists x_1 \cdots \exists x_n\varphi\), where \(\varphi\) is quantifier-free. More formally, an existential formula is a formula that can be obtained by starting with the quantifier-free formulas, and generating using \(\{h_{\exists,x} : x \in \mathrm{Var}\}\).
2. A *universal formula* is a formula of the form \(\forall x_1 \cdots \forall x_n\varphi\), where \(\varphi\) is quantifier-free. More formally, a universal formula is a formula that can be obtained by starting with the quantifier-free formulas, and generating using \(\{h_{\forall,x} : x \in \mathrm{Var}\}\).

For example, \(\exists x(x \mathbin{\cdot} x = 1+1)\) is an existential formula in the language of semirings and \(\forall x \forall y(x \mathbin{\cdot} y = y \mathbin{\cdot} x)\) is a universal formula in the language of monoids. We state our next result for general embeddings and derive the corresponding corollary for substructures.

**Proposition 5.2.11** *Let \(\mathcal{L}\) be a language, let \(\mathcal{M}\) and \(\mathcal{N}\) be \(\mathcal{L}\)-structures, and let \(h : M \to N\) be an embedding.*

1. *For any existential formula \(\varphi\) and any variable assignment \(s : \mathrm{Var} \to M\), if \((\mathcal{M},s) \models \varphi\), then \((\mathcal{N},h \circ s) \models \varphi\).*
2. *For any universal formula \(\varphi\) and any variable assignment \(s : \mathrm{Var} \to M\), if \((\mathcal{N},h \circ s) \models \varphi\), then \((\mathcal{M},s) \models \varphi\).*

*Proof.*

1. The proof is by induction (either on the generating system for existential formulas, or the number of existential quantifiers). For the base case, note that if \(\varphi\) is quantifier-free, then the statement follows from Theorem 5.2.7. Suppose that we know that the statement is true for \(\varphi\), and assume that \((\mathcal{M},s) \models \exists x\varphi\). By definition, we can fix \(a \in M\) such that \((\mathcal{M},s[x \rightsquigarrow a]) \models \varphi\). By induction, we know that \((\mathcal{N},h \circ (s[x \rightsquigarrow a])) \models \varphi\). Since \(h \circ (s[x \rightsquigarrow a]) = (h \circ s)[x \rightsquigarrow h(a)]\), it follows that \((\mathcal{N},(h \circ s)[x \rightsquigarrow h(a)]) \models \varphi\). Therefore, \((\mathcal{N},h \circ s) \models \exists x\varphi\).

2. As in part (1), the proof is by induction. For the base case, note that if \(\varphi\) is quantifier-free, then the statement follows from Theorem 5.2.7. Suppose that we know that the statement is true for \(\varphi\), and assume that \((\mathcal{N},h \circ s) \models \forall x\varphi\). We need to show that \((\mathcal{M},s) \models \forall x\varphi\). Let \(a \in M\) be arbitrary. Since \(h(a) \in N\), and \((\mathcal{N},h \circ s) \models \forall x\varphi\), we know that \((\mathcal{N},(h \circ s)[x \rightsquigarrow h(a)]) \models \varphi\). Since \((h \circ s)[x \rightsquigarrow h(a)] = h \circ (s[x \rightsquigarrow a])\), we conclude that \((\mathcal{N},h \circ (s[x \rightsquigarrow a])) \models \varphi\). By induction, it follows that \((\mathcal{M},s[x \rightsquigarrow a]) \models \varphi\). Since \(a \in M\) was arbitrary, we conclude that \((\mathcal{M},s) \models \forall x\varphi\). \(\square\)

**Corollary 5.2.12** *Suppose that \(\mathcal{A}\) is a substructure of \(\mathcal{M}\).*

1. *For any existential formula \(\varphi\) and any \(s : \mathrm{Var} \to A\), if \((\mathcal{A},s) \models \varphi\), then \((\mathcal{M},s) \models \varphi\).*
2. *For any universal formula \(\varphi\) and any \(s : \mathrm{Var} \to A\), if \((\mathcal{M},s) \models \varphi\), then \((\mathcal{A},s) \models \varphi\).*

*Proof.* Immediate from Proposition 5.2.11 and Proposition 5.2.6. \(\square\)

For example, the sentence \(\sigma\) equal to \(\forall x \forall y(x \mathbin{\cdot} y = y \mathbin{\cdot} x)\) is a universal formula in the language of groups. If \(\mathcal{M}\) is a structure with \(\mathcal{M} \models \sigma\), then whenever \(\mathcal{A}\) is a substructure of \(\mathcal{M}\), we have that \(\mathcal{A} \models \sigma\). In particular, every subgroup of an abelian group is abelian. As we have mentioned, the converse does not hold, which explains why we only have one direction in Corollary 5.2.12 in the case of existential and universal formulas.

For more complicated formulas, we may not be able to go in either direction. For example, consider the language \(\mathcal{L} = \{0,1,+,-,\mathord{\cdot}\}\) of rings. Let \(\sigma\) be the sentence

\[
\forall x\bigl(\neg(x=0) \to \exists y(x \mathbin{\cdot} y=1)\bigr),
\]

which says that every nonzero element has a multiplicative inverse. Notice that \(\sigma\) is neither an existential formula nor a universal formula. If we consider the \(\mathcal{L}\)-structure \(\mathcal{M}\) consisting of the rational field and let \(\mathcal{A}\) be the substructure consisting of the integers, then \(\mathcal{M} \models \sigma\) but \(\mathcal{A} \not\models \sigma\). In contrast, if we consider the \(\mathcal{L}\)-structure \(\mathcal{M}\) consisting of the polynomial ring \(\mathbb{R}[x]\), and let \(\mathcal{A}\) be the substructure consisting of the real numbers (i.e. constant polynomials), then \(\mathcal{M} \not\models \sigma\) but \(\mathcal{A} \models \sigma\). In other words, if a formula is neither existential nor universal, it is possible that the truth of the formula in a structure has no relationship to its truth in a substructure.
