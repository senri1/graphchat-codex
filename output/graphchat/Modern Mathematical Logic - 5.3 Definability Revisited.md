# 5.3 Definability Revisited

In the previous section, we showed how we can use embeddings and isomorphisms to relate the truth of certain formulas across structures. In fact, we showed that isomorphisms preserve the truth of all formulas between the two structures. We can use that result in the special case where we have an isomorphism of a structure with itself in order to compare truth across the various elements of that structure. In particular, we can use Theorem 5.2.7 to argue that any definable set must be invariant under *automorphisms*.

**Definition 5.3.1** Let \(\mathcal{M}\) be an \(\mathcal{L}\)-structure. An isomorphism \(h : M \to M\) is called an *automorphism*.

**Proposition 5.3.2** *Suppose that \(\mathcal{M}\) is an \(\mathcal{L}\)-structure and \(k \in \mathbb{N}^+\). Suppose also that \(X \subseteq M^k\) is definable in \(\mathcal{M}\) and that \(h : M \to M\) is an automorphism. For every \(a_1,\ldots,a_k \in M\), we have \((a_1,\ldots,a_k) \in X\) if and only if \((h(a_1),\ldots,h(a_k)) \in X\).*

*Proof.* Let \(X \subseteq M^k\) be definable in \(\mathcal{M}\), and let \(h : M \to M\) be an automorphism. Fix \(\varphi(x_1,\ldots,x_k) \in \mathrm{Form}_{\mathcal{L}}\) with

\[
X
= \{(a_1,\ldots,a_k) \in M^k : (\mathcal{M},a_1,\ldots,a_k) \models \varphi\}.
\]

By part (4) of Theorem 5.2.7, we know that for all \(a_1,\ldots,a_k \in M\), we have \((\mathcal{M},a_1,\ldots,a_k) \models \varphi\) if and only if \((\mathcal{M},h(a_1),\ldots,h(a_k)) \models \varphi\). Therefore, for all \(a_1,\ldots,a_k \in M\), we have \((a_1,\ldots,a_k) \in X\) if and only if \((h(a_1),\ldots,h(a_k)) \in X\). \(\square\)

We can use this result to prove negative results about definability. That is, one way to show that given set \(X\) is not definable is to find an automorphism of the structure that moves an element between \(X\) and its complement.

**Corollary 5.3.3** *Let \(\mathcal{M}\) be an \(\mathcal{L}\)-structure, let \(k \in \mathbb{N}^+\), and let \(X \subseteq M^k\). Suppose that there exists an automorphism \(h : M \to M\) of \(\mathcal{M}\) together with \(a_1,\ldots,a_k \in M\) such that exactly one of the following holds:*

- *\((a_1,\ldots,a_k) \in X\).*
- *\((h(a_1),\ldots,h(a_k)) \in X\).*

*We then have that \(X\) is not definable in \(\mathcal{M}\).*

For example, consider the structure \((\mathbb{C},0,1,+,-,\mathord{\cdot})\) in the language \(\mathcal{L} = \{0,1,+,-,\mathord{\cdot}\}\) of rings. We claim that \(\{i\} \subseteq \mathbb{C}\) is not definable in this structure. To show this, it suffices to find an automorphism \(f : \mathbb{C} \to \mathbb{C}\) such that \(f(i) \notin \{i\}\). In this case, the complex conjugation function \(f : \mathbb{C} \to \mathbb{C}\) defined by \(f(a+bi)=a-bi\) can be shown to be an automorphism of the structure, and \(f(i)=-i \notin \{i\}\).

Now work in the language of groups, and consider the structure given by the symmetric group \(S_3\) of all permutations of \(\{1,2,3\}\). We claim that the set of the two transpositions \(\{(1\ 2),(1\ 3)\}\) is not definable in \(S_3\). Letting \(f : S_3 \to S_3\) be the function given by conjugation by the element \((1\ 2)\), that is,

\[
f(\sigma)
= (1\ 2) \circ \sigma \circ (1\ 2)^{-1}
= (1\ 2) \circ \sigma \circ (1\ 2),
\]

we have that \(f\) is an automorphism of \(S_3\) and \(f((1\ 3))=(2\ 3) \notin \{(1\ 2),(1\ 3)\}\). In general, if we have a group \(G\), then conjugation by a fixed element of \(G\) is always an automorphism of the group, so every definable \(X \subseteq G\) must be closed under conjugation (i.e. must be a union of conjugacy classes). It follows that every definable subgroup of a group \(G\) must be a normal subgroup of \(G\).

Let's classify all definable subsets of \(M\) for a simple structure \(\mathcal{M}\). Let \(\mathcal{L}=\{<\}\) be the language of orderings, and consider the structure \((\mathbb{Z},<)\). We claim that a set \(X \subseteq \mathbb{Z}\) is definable in \((\mathbb{Z},<)\) if and only if either \(X=\varnothing\) or \(X=\mathbb{Z}\).

- First notice that \(\varnothing\) is definable as witnessed by \(\neg(x=x)\), and that \(\mathbb{Z}\) itself is definable as witnessed by \(x=x\).
- To show that these are the only two definable subsets of \(\mathbb{Z}\), we will show that for all \(a,b \in \mathbb{Z}\), there exists an automorphism \(f : \mathbb{Z} \to \mathbb{Z}\) of \((\mathbb{Z},<)\) such that \(f(a)=b\). Using Proposition 5.3.2, it then follows that if \(X \subseteq \mathbb{Z}\) is definable and nonempty, then we must have \(X=\mathbb{Z}\).

So let \(a,b \in \mathbb{Z}\) be arbitrary, and define \(f : \mathbb{Z} \to \mathbb{Z}\) by letting \(f(x)=x+(b-a)\) for all \(c \in \mathbb{Z}\). Now \(f\) is an automorphism of \((\mathbb{Z},<)\) because it is bijective (the map \(g(x)=x-(b-a)\) is clearly an inverse) and for any \(x,y \in \mathbb{Z}\), we have

\[
\begin{aligned}
x<y
&\iff x+(b-a)<y+(b-a) \\
&\iff f(x)<f(y).
\end{aligned}
\]

Finally, notice that \(f(a)=a+(b-a)=b\), completing the proof.

Although there are only two definable subsets of \(\mathbb{Z}\) in the structure \((\mathbb{Z},<)\), there are many definable subsets of \(\mathbb{Z}^2\) in this structure. Of course, the set \(\{(a,b) \in \mathbb{Z}^2 : a<b\}\) is definable via the formula \(x<y\), and the set \(\{(a,b) \in \mathbb{Z}^2 : a=b\}\) is definable via the formula \(x=y\). A more interesting example is the set \(\{(a,b) \in \mathbb{Z}^2 : b=a+1\}\), which is definable via the formula

\[
(x<y) \land \neg\exists z(x<z \land z<y).
\]

Suppose that we instead consider the structure \((\mathbb{Q},<)\) in the language of orderings. In this situation, we still have that the only definable subsets of \(\mathbb{Q}\) are \(\varnothing\) and \(\mathbb{Q}\), because it is still true that for any \(a,b \in \mathbb{Q}\), there exists an automorphism \(f : \mathbb{Q} \to \mathbb{Q}\) with \(f(a)=b\). As in the structure \((\mathbb{Z},<)\), given any \(a,b \in \mathbb{Q}\), the function \(f(x)=x+(b-a)\) is an automorphism of \((\mathbb{Q},<)\) with \(f(a)=b\). However, when we move up a dimension to \(\mathbb{Q}^2\), there are many fewer definable sets than there are in the structure \((\mathbb{Z},<)\). While \((x<y) \land \neg\exists z(x<z \land z<y)\) defines an interesting subset of \(\mathbb{Z}^2\) in \((\mathbb{Z},<)\), when we move to the structure \((\mathbb{Q},<)\), the same formula now defines \(\varnothing\). As we search around for definable subsets of \(\mathbb{Q}^2\), we encounter the following three sets, each of which is definable by an atomic formula:

- \(X_1=\{(a,b) \in \mathbb{Q}^2 : a<b\}\) via \(x<y\).
- \(X_2=\{(a,b) \in \mathbb{Q}^2 : a=b\}\) via \(x=y\).
- \(X_3=\{(a,b) \in \mathbb{Q}^2 : b<a\}\) via \(y<x\).

After including \(\varnothing\) and taking unions (which corresponds to using \(\lor\) on the various formulas), we obtain eight definable subsets of \(\mathbb{Q}^2\), which correspond to making three binary choices about whether to include each of the preceding three sets in the union. In fact, these eight sets are the *only* definable subsets of \(\mathbb{Q}^2\). We can prove this fact using a more elaborate version of the automorphism argument in dimension 1. One can show (see Exercise 15) that for any \((a,b),(c,d) \in X_1\), there exists an automorphism \(f : \mathbb{Q} \to \mathbb{Q}\) with \(f(a)=c\) and \(f(b)=d\). From here, it follows that if \(Y \subseteq \mathbb{Q}^2\) is definable, and \(Y \cap X_1 \ne \varnothing\), then \(X_1 \subseteq Y\). A similar argument works for \(X_3\), and the corresponding argument for \(X_2\) reduces to the statement that for all \(a,b \in \mathbb{Q}\), there exists an automorphism \(f : \mathbb{Q} \to \mathbb{Q}\) with \(f(a)=b\), which is what we proved in dimension 1. Since \(X_1 \cup X_2 \cup X_3=\mathbb{Q}^2\), any definable subset of \(\mathbb{Q}^2\) must be a union of some collection of these sets, and hence must be one of the eight sets just described.

We can also expand the concept of definability so that we are permitted to use *names* of specific elements of our structure. In Section 4.3, we saw that each singleton set \(\{n\}\) was definable in \((\mathbb{N},<)\), but in most structures we do not have "access" to individual elements in a definable way. For example, we saw that such singleton sets are not definable in either \((\mathbb{Z},<)\) or \((\mathbb{Q},<)\). If we want to permit the use of individual elements, we can use formulas with extra free variables and then fix the interpretations of those variables within our variable assignments. If we follow this path, we arrive at the following definition.

**Definition 5.3.4** Let \(\mathcal{M}\) be an \(\mathcal{L}\)-structure, let \(k \in \mathbb{N}^+\), and let \(X \subseteq M^k\). We say that \(X\) is *definable with parameters* in \(\mathcal{M}\) if there exists \(\varphi(x_1,\ldots,x_k,y_1,\ldots,y_n) \in \mathrm{Form}_{\mathcal{L}}\) together with \(b_1,\ldots,b_n \in M\) such that

\[
X
= \{(a_1,\ldots,a_k) \in M^k : (\mathcal{M},a_1,\ldots,a_k,b_1,\ldots,b_n) \models \varphi\}.
\]

For example, we claim that for each \(n \in \mathbb{Z}\), the singleton set \(\{n\}\) is definable with parameters in the structure \(\mathcal{M}=(\mathbb{Z},<)\). Consider the formula \(\varphi(x,y)\) equal to \(x=y\). Now take any \(n \in \mathbb{Z}\) and treat it as fixed. Given any \(a \in \mathbb{Z}\), we have that \((\mathcal{M},a,n) \models \varphi[x,y]\) if and only if \(a=n\), so we have shown that \(\{n\}\) is definable with parameters. In fact, given *any* structure \(\mathcal{M}\), the same argument shows that the set \(\{m\}\) is definable with parameters in \(\mathcal{M}\). In particular, if we go back to the structure \((\mathbb{C},0,1,+,-,\mathord{\cdot})\) in the language \(\mathcal{L}=\{0,1,+,-,\mathord{\cdot}\}\) of rings, then \(\{i\} \subseteq \mathbb{C}\) is definable with parameters.

We can typically find many other subsets of \(M^k\) when we elevate from definable to definable with parameters. Consider the structure \(\mathcal{M}=(\mathbb{Q},<)\) in the language of orderings. We have seen that the only definable subsets of \(\mathbb{Q}\) in this structure are \(\varnothing\) and \(\mathbb{Q}\). But there are many other subsets of \(\mathbb{Q}\) that are definable with parameters. For example, let \(X=\{q \in \mathbb{Q} : 0<q<1\}\). Consider the formula \(\varphi(x,y,z)\) that is equal to \(y<x \land x<z\). Now for any \(q \in \mathbb{Q}\), we have that \((\mathcal{M},q,0,1) \models \varphi[x,y,z]\) if and only if \(q \in X\), so \(X\) is definable with parameters in \((\mathbb{Q},<)\). We can easily generalize this argument to show that any open interval in \(\mathbb{Q}\) is definable with parameters.

To reiterate, given a structure \(\mathcal{M}\) and a set \(X \subseteq M^k\), the set \(X\) is definable with parameters in \(\mathcal{M}\) if we can *augment* our usual definability criterion with the additional power of being able to use names for the elements. From this perspective, we can obtain another, more natural interpretation of the concept of definability with parameters by changing the language to add constant symbols that name the elements of \(M\). We now pursue that idea.

**Definition 5.3.5** Let \(\mathcal{L}\) be a language and let \(\mathcal{M}\) be an \(\mathcal{L}\)-structure.

- For each \(a \in M\), introduce a new constant symbol \(\underline{a}\) distinct from each symbol in \(\mathcal{L}\), and distinct from each other.
- Let \(\mathcal{L}_{\exp}^{\mathcal{M}}\) be the language \(\mathcal{L}\), together with the addition of \(\{\underline{a} : a \in M\}\) to the set of constant symbols.
- Let \(\mathcal{M}_{\exp}\) be the \(\mathcal{L}_{\exp}^{\mathcal{M}}\)-structure that is obtained by expanding (see Definition 4.2.10) \(\mathcal{M}\) by letting \(\underline{a}^{\mathcal{M}_{\exp}}=a\) for each \(a \in M\).

We now use the results of Section 4.4 to show that we can reduce our new concept of definability with parameters to (basic) definability within the expanded structure. The fundamental idea is quite intuitive. In the structure \(\mathcal{M}=(\mathbb{Q},<)\) in the language of orderings, we used the formula \(y<x \land x<z\) with parameters \(0\) for \(y\) and \(1\) for \(z\) to show that \(\{q \in \mathbb{Q} : 0<q<1\}\) was definable with parameters. But in the structure \(\mathcal{M}_{\exp}\) in the language \(\mathcal{L}_{\exp}^{\mathcal{M}}\), we can simply use the formula \(\underline{0}<x \land x<\underline{1}\) that uses the constant symbols \(\underline{0}\) and \(\underline{1}\) rather than free variables that are interpreted as the parameters.

**Proposition 5.3.6** *Let \(\mathcal{M}\) be an \(\mathcal{L}\)-structure, let \(k \in \mathbb{N}^+\), and let \(X \subseteq M^k\). The following are equivalent:*

1. *\(X\) is definable with parameters in \(\mathcal{M}\).*
2. *\(X\) is definable in \(\mathcal{M}_{\exp}\).*

*Proof.* Assume first that \(X\) is definable with parameters in \(\mathcal{M}\). Fix \(\varphi(x_1,\ldots,x_k,y_1,\ldots,y_n) \in \mathrm{Form}_{\mathcal{L}}\) together with \(b_1,\ldots,b_n \in M\) such that

\[
X
= \{(a_1,\ldots,a_k) \in M^k : (\mathcal{M},a_1,\ldots,a_k,b_1,\ldots,b_n) \models \varphi\}.
\]

By Proposition 4.2.11, we have

\[
X
= \{(a_1,\ldots,a_k) \in M^k : (\mathcal{M}_{\exp},a_1,\ldots,a_k,b_1,\ldots,b_n) \models \varphi\}.
\]

By Corollary 4.4.19, together with the fact that \(\underline{b_i}^{\mathcal{M}_{\exp}}=b_i\) for all \(i\), it follows that

\[
X
= \{(a_1,\ldots,a_k) \in M^k : (\mathcal{M}_{\exp},a_1,\ldots,a_k) \models \varphi[x_1,\ldots,x_k,\underline{b_1},\ldots,\underline{b_n}]\}.
\]

Therefore, \(X\) is definable in \(\mathcal{M}_{\exp}\) via the formula \(\varphi[x_1,\ldots,x_k,\underline{b_1},\ldots,\underline{b_n}] \in \mathrm{Form}_{\mathcal{L}_{\exp}^{\mathcal{M}}}\).

Conversely, assume that \(X\) is definable in \(\mathcal{M}_{\exp}\). Fix \(\varphi(x_1,\ldots,x_k) \in \mathrm{Form}_{\mathcal{L}_{\exp}^{\mathcal{M}}}\) such that

\[
X
= \{(a_1,\ldots,a_k) \in M^k : (\mathcal{M}_{\exp},a_1,\ldots,a_k) \models \varphi\}.
\]

By Proposition 4.4.21, we can fix \(\psi(x_1,\ldots,x_k,y_1,\ldots,y_n) \in \mathrm{Form}_{\mathcal{L}}\) and constant symbols \(\underline{b_1},\ldots,\underline{b_n} \in \mathcal{L}_{\exp}^{\mathcal{M}} \setminus \mathcal{L}\) such that \(\varphi\) is equal to \(\psi[x_1,\ldots,x_k,\underline{b_1},\ldots,\underline{b_n}]\). By Corollary 4.4.19, together with the fact that \(\underline{b_i}^{\mathcal{M}_{\exp}}=b_i\) for all \(i\), it follows that

\[
X
= \{(a_1,\ldots,a_k) \in M^k : (\mathcal{M}_{\exp},a_1,\ldots,a_k,b_1,\ldots,b_n) \models \psi\}.
\]

Since \(\psi \in \mathrm{Form}_{\mathcal{L}}\), we can use Proposition 4.2.11 to conclude that

\[
X
= \{(a_1,\ldots,a_k) \in M^k : (\mathcal{M},a_1,\ldots,a_k,b_1,\ldots,b_n) \models \psi\}.
\]

Therefore, \(X\) is definable with parameters in \(\mathcal{M}\). \(\square\)

Let's return to the structure \(\mathcal{M}=(\mathbb{C},0,1,+,-,\mathord{\cdot})\) in the language \(\mathcal{L}=\{0,1,+,-,\mathord{\cdot}\}\) of rings. In Section 4.3, we argued that a subset of \(\mathbb{C}\) is definable by an atomic formula exactly when it is the set of roots of a polynomial with integer coefficients. When we move to definability with parameters, we can use Proposition 5.3.6 to think about definability in the structure \(\mathcal{M}_{\exp}\). We now have a constant symbol for each complex number, and we can use those constant symbols as coefficients for our polynomials. Moreover, following the same logic from that section, a subset of \(\mathbb{C}\) is definable by parameters via an atomic formula exactly when it is the set of roots of a polynomial with *complex* coefficients. And when we expand to the collection all formulas, it turns out that a subset of \(\mathbb{C}\) is definable with parameters exactly when it is either finite or cofinite (see Section 7.5).

In the structure \(\mathcal{M}=(\mathbb{Q},<)\), we have more interesting sets that are definable with parameters. As mentioned above, every open interval is definable with parameters, including the option of unbounded open intervals. We also know that every singleton point is definable with parameters. Since we take unions using \(\lor\) on the corresponding formulas (see Exercise 30 in Chapter 4 for why we can assume that the formulas use the same free variables), it follows that if \(X \subseteq \mathbb{Q}\) is a finite union of open intervals and points, then \(X\) is definable with parameters. In fact, we can prove that the converse is true as well using automorphisms. At first, the idea of using automorphisms might sound hopeless, as the only automorphism of \(\mathcal{M}_{\exp}\) is the identity (since each \(q \in \mathbb{Q}\) is named by a constant, it must be fixed by an automorphism \(f\), since \(f(q)=f(\underline{q}^{\mathcal{M}_{\exp}})=\underline{q}^{\mathcal{M}_{\exp}}=q\)). However, we can use our original definition of definable with parameters, together with the fact that any formula has only finitely many free variables. So suppose that \(X \subseteq \mathbb{Q}\) is definable with parameters, and fix a formula \(\varphi(x,y_1,\ldots,y_n)\) together with \(b_1,\ldots,b_n \in \mathbb{Q}\) such that

\[
X
= \{a \in \mathbb{Q} : (\mathcal{M},a,b_1,\ldots,b_n) \models \varphi\}.
\]

We can assume that we have ordered the free variables so that \(b_1<\cdots<b_n\). We claim that if \(X\) contains any point in the open interval \(\{q \in \mathbb{Q} : b_i<q<b_{i+1}\}\), then we must have \(\{q \in \mathbb{Q} : b_i<q<b_{i+1}\} \subseteq X\). The key insight is that given any \(c,d \in \{q \in \mathbb{Q} : b_i<q<b_{i+1}\}\), there exists an automorphism of \((\mathbb{Q},<)\) that fixes all points outside of the interval \(\{q \in \mathbb{Q} : b_i<q<b_{i+1}\}\), and that sends \(c\) to \(d\). See Exercise 16.
