\(\mathrm{Sent}_{\mathcal L}\) and will determine whether or not \(\mathcal M\models\sigma\)? We can express many interesting number-theoretic statements using such sentences, such as the twin prime conjecture (see Exercise 7) and the statement that Fermat's Last Theorem holds for a given fixed exponent \(n\). Thus, if we had such a method, we could task a computer to determine the truth of various interesting problems (some of which are unsolved), and then just sit back and publish a paper when the computer finishes. Of course, there are some efficiency concerns (will the computer stop in a reasonable amount of time?), but in principle we would have reduced a great deal of number theory to a purely mechanistic process. And we can handle many other areas of mathematics by simply changing the language and the structure.

Fortunately (for the job prospects of mathematicians), we will eventually prove that there is no such algorithm for the structure \(\mathcal M=(\mathbb N,0,1,+,\cdot)\). Perhaps surprisingly, there are many important structures where such algorithms do exist, such as \((\mathbb R,0,1,+,\cdot)\) and \((\mathbb C,0,1,+,\cdot)\). We will address such questions in Chapter 12, but an important dividing line here is related to the concept of *definability*.

## 4.3 Introduction to Definability

A wonderful side effect of developing a formal language is the ability to talk about which subsets of a given structure can be described using only the symbols from that language.

**Definition 4.3.1** &nbsp; Let \(\mathcal M\) be an \(\mathcal L\)-structure, let \(k\in\mathbb N^+\), and let \(X\subseteq M^k\). We say that \(X\) is *definable* in \(\mathcal M\) if there exists \(\varphi(x_1,\ldots,x_k)\in\mathrm{Form}_{\mathcal L}\) such that

\[
X=\{(a_1,\ldots,a_k)\in M^k:(\mathcal M,a_1,\ldots,a_k)\models\varphi\}.
\]

In other words, a set \(X\subseteq M^k\) is definable in \(\mathcal M\) if we can find a formula \(\varphi\) with \(k\) free variables such that the formula is true in \(\mathcal M\) when we interpret the free variables as a \(k\)-tuple in \(X\), and is false when the \(k\)-tuple is not in \(X\). We consider several examples in the language \(\mathcal L=\{0,1,+,\cdot\}\) of semirings:

- The set \(X=\{1,-1\}\) is definable in the structure \((\mathbb Z,0,1,+,\cdot)\) as witnessed by the formula \(\varphi(x)\) given by \(x\cdot x=1\). Alternatively, we can use the formula \(\psi(x)\) given by \((x=1)\vee(x+1=0)\).
- The set \(X=\{n\in\mathbb N:n\text{ is prime}\}\) is definable in the structure \((\mathbb N,0,1,+,\cdot)\) as witnessed by the formula \(\varphi(x)\):

  \[
  \neg(x=1)\wedge\forall y\forall z(x=y\cdot z\to(y=1\vee z=1)).
  \]

- The set \(X=\{r\in\mathbb R:r\geq 0\}\) is definable in the structure \((\mathbb R,0,1,+,\cdot)\) as witnessed by the formula \(\varphi(x)\) given by \(\exists y(y\cdot y=x)\).
- The set \(X=\{(m,n)\in\mathbb N^2:m<n\}\) is definable in the structure \((\mathbb N,0,1,+,\cdot)\) as witnessed by the formula \(\varphi(x,y)\) given by \(\exists z(\neg(z=0)\wedge(x+z=y))\).

Let's consider another language. Let \(\mathcal L=\{<\}\) be the language of orderings. For every \(n\in\mathbb N\), the set \(\{n\}\) is definable in \((\mathbb N,<)\). To see this, for each \(n\in\mathbb N^+\), let \(\varphi_n(x)\) be the formula

\[
\exists y_1\cdots\exists y_n
\left(
\bigwedge_{1\leq i<j\leq n}\neg(y_i=y_j)
\wedge
\bigwedge_{i=1}^{n}(y_i<x)
\right).
\]

For each \(n\in\mathbb N^+\), the formula \(\varphi_n(x)\) defines the set \(\{k\in\mathbb N:n\leq k\}\). Now notice that \(\{0\}\) is definable as witnessed by the formula \(\neg\exists y(y<x)\), and for each \(n\in\mathbb N^+\), the set \(\{n\}\) is definable as witnessed by the formula \(\psi(x)\) that is equal to \(\varphi_n\wedge\neg\varphi_{n+1}\).

We can even say some general statements about definability across a collection of structures. Let \(\mathcal L=\{e,f\}\) be the language of monoids. Given a group \((G,e,\cdot)\), interpreted as an \(\mathcal L\)-structure, the center of \(G\) is always definable in \((G,e,\cdot)\) as witnessed by the formula \(\varphi(x)\) given by \(\forall y(f(x,y)=f(y,x))\).

Occasionally, there is no obvious way to directly translate the description of a set into a formula, but some cleverness and/or nontrivial mathematics can come to the rescue. In each of the examples below, we work in the language \(\mathcal L=\{0,1,+,\cdot\}\) of semirings:

1. The set \(\mathbb N\subseteq\mathbb Z\) is definable in \((\mathbb Z,0,1,+,\cdot)\) as witnessed by the formula

   \[
   \exists y_1\exists y_2\exists y_3\exists y_4
   (x=y_1\cdot y_1+y_2\cdot y_2+y_3\cdot y_3+y_4\cdot y_4).
   \]

   Certainly every element of \(\mathbb Z\) that is a sum of squares must be an element of \(\mathbb N\). The fact that every element of \(\mathbb N\) is a sum of four squares is Lagrange's Theorem, an important result in number theory.

2. Let \((R,0,1,+,\cdot)\) be a commutative ring. The Jacobson radical of \(R\), denoted \(\mathrm{Jac}(R)\) is the intersection of all maximal ideals of \(R\). As stated, it is not clear that this is definable in \((R,0,1,+,\cdot)\) because it appears to quantify over subsets. However, a basic result in commutative algebra says that

   \[
   \begin{aligned}
   a\in\mathrm{Jac}(R)
   &\iff ab-1\text{ is a unit for all }b\in R\\
   &\iff \text{For all }b\in R,\text{ there exists }c\in R\text{ with }(ab-1)c=1.
   \end{aligned}
   \]

   Thus, \(\mathrm{Jac}(R)\) is definable in \((R,0,1,+,\cdot)\) as witnessed by the formula \(\forall y\exists z((x\cdot y)\cdot z=z+1)\).

3. The set \(\mathbb Z\) is definable in \((\mathbb Q,0,1,+,\cdot)\). This is a deep result of Julia Robinson using some nontrivial number theory.

4. The set \(X=\{(k,m,n)\in\mathbb N^3:k^m=n\}\) is definable in \((\mathbb N,0,1,+,\cdot)\), as is the set

   \[
   \{(m,n)\in\mathbb N^2:m\text{ is the }n\text{th digit in the decimal expansion of }\pi\}.
   \]

   In fact, every set \(C\subseteq\mathbb N^k\) that is *computable*, that is, for which it is possible to write a computer program that outputs *yes* on elements of \(C\) and *no* on elements of \(\mathbb N^k\setminus C\), is definable in \((\mathbb N,0,1,+,\cdot)\). We will prove this challenging, but fundamental, result in Corollary 12.2.4.

While these examples demonstrate that some unexpected sets can be definable, it is at least clear how one can show that a set is definable: just find a suitable formula. But how does one show that a certain set is *not* definable in a structure? Let's start by asking a simpler question. Is it possible that *every* subset of \(M^k\) is definable in a structure \(\mathcal M\)? If the structure is finite (i.e. if the underlying set is finite), then this situation can occur. But otherwise we can typically use a crude cardinality argument to argue that a non-definable set exists. For example, consider the language \(\mathcal L=\{0,1,+,\cdot\}\) of semirings and the structure \((\mathbb N,0,1,+,\cdot)\). Although there are many interesting definable subsets of \(\mathbb N\), there are only countably many definable subsets of \(\mathbb N\) because the set \(\mathrm{Form}_{\mathcal L}\) is countable (by Proposition 2.2.19). The set \(\mathcal P(\mathbb N)\) is not countable, and hence there must be a subset of \(\mathbb N\) that is not definable.

Of course, arguing that a non-definable set exists is not nearly as satisfying as arguing that a specific interesting set is not definable. We will encounter our first technique to accomplish this task in some relatively simple situations in Section 5.3. However, determining whether a given set is definable in a structure is typically a challenging task, and classifying the collection of all definable sets is one of the primary goals when seeking to fully "understand" a structure.

It is useful to take a step back and think about the closure properties of the collection of definable sets. Suppose then that \(\mathcal M\) is an \(\mathcal L\)-structure, and that \(k\in\mathbb N^+\). Let \(\mathcal D_k\) be the collection of subsets of \(M^k\) that are definable in \(\mathcal M\), that is, let

\[
\mathcal D_k=\{X\in\mathcal P(M^k):X\text{ is definable in }\mathcal M\}.
\]

Now \(\mathcal D_k\) is closed under finite unions, finite intersections, and complement because we can just use \(\vee\), \(\wedge\), and \(\neg\) on the corresponding formulas (we can assume that the various formulas have the same free variables using results of the next few sections - see Exercise 30). In other words, \(\mathcal D_k\) is a *field of sets*, or a *boolean subalgebra* of \(\mathcal P(M^k)\).

We can turn this idea around to help us understand certain simple definable sets. We start with the following definition.

**Definition 4.3.2** &nbsp; Let \(\mathcal L\) be a language. A formula \(\varphi\in\mathrm{Form}_{\mathcal L}\) is *quantifier-free* if it does not contain \(\forall\) or \(\exists\). More formally, \(\varphi\) is quantifier-free if it is a formula that appears by starting with atomic formulas together with \(\top\) and \(\bot\), and generating using just the propositional connectives.

It is often not too onerous to determine which subsets of \(M\) (or more generally \(M^k\)) are definable via quantifier-free formulas. The idea is to start by understanding the subsets that are definable by the atomic formulas, and then figure out what we can obtain by closing off under union, intersection, and complement (since quantifier-free formulas are generated from the atomic formulas using the propositional connectives, which correspond to simple boolean operations).

For example, suppose that we are working with the structure \((\mathbb C,0,1,+,-,\cdot)\) in the language \(\mathcal L=\{0,1,+,-,\cdot\}\) of rings. Let's think about the subsets of \(\mathbb C\) that are definable by an atomic formula. Some examples are \(\{1,-1,i,-i\}\) defined by \(x\cdot x\cdot x\cdot x=1\) and \(\{3+\sqrt 7,3-\sqrt 7\}\) defined by

\[
x\cdot x+(-(1+1+1+1+1+1))\cdot x+(1+1)=0.
\]

Generalizing these examples, given any \(f\in\mathbb Z[x]\), that is, any polynomial with coefficients in \(\mathbb Z\), the set of roots of \(f\) is a subset of \(\mathbb C\) that is definable by an atomic formula. In fact, the converse of this statement is also true. To see this without getting too bogged down in the formalism, consider an arbitrary atomic formula with (at most) one free variable, say \(x\). Since there are no quantifiers in our formula, \(x\) is the only possible occurring variable. Now a term is built up from the constant symbols and variables using the function symbols. If we think about what we can obtain from \(0\), \(1\), and \(x\) by repeatedly applying \(+\), \(-\), and \(\cdot\), we see that every term corresponds to an element in \(\mathbb Z[x]\), that is, to a polynomial over \(x\) with integer coefficients. Now the language does not have any relation symbols, so the only atomic formulas are the formulas \(t_1=t_2\) for some terms \(t_1\) and \(t_2\). Thus, the subsets of \(\mathbb C\) that are definable by atomic formulas are exactly the sets that can be written as \(\{z\in\mathbb C:f(z)=g(z)\}\) for some polynomials \(f,g\in\mathbb Z[x]\). By bringing one of the polynomials over to the other side, a subset of \(\mathbb C\) is definable by an atomic formula exactly when it is the set of roots of a polynomial with integer coefficients.

We know that every nonzero polynomial has finitely many roots, so every subset of \(\mathbb C\) that is definable by an atomic formula must be either finite or all of \(\mathbb C\) (the latter corresponds to the zero polynomial, or arises from the formula \(\top\)). Note that we are *not* claiming that all finite sets are definable in this way, and indeed this statement is not true. But we have established some important restrictions. From here, one can argue that every subset of \(\mathbb C\) that is definable by a quantifier-free formula must be either finite or cofinite (i.e. its complement in \(\mathbb C\) is finite), because the set \(\{X\in\mathbb C:X\text{ is finite or cofinite}\}\subseteq\mathcal P(\mathbb C)\) is closed under finite unions, finite intersections, and complements.

That was a nontrivial amount of work to determine the sets that are definable by quantifier-free formulas in the given structure, but the process illustrates a general technique that can be applied to many natural structures. However, everything becomes much more challenging when we start to consider quantifiers. Suppose that we have a formula \(\varphi(x)\) that starts with \(\exists y\) and then is followed by a quantifier-free formula \(\psi(x,y)\). Now \(\varphi(x)\) defines a subset of \(M\), but \(\psi(x,y)\) defines a subset of \(M^2\). Thus, to understand a definable subset of \(M\) we need to move up a dimension to understand a definable subset of \(M^2\), and then determine the *projection* of that subset onto \(M\) in order to determine what \(\varphi(x)\) defines. If we have multiple quantifiers, then there are multiple projections from higher-dimensional spaces, perhaps mixed in with unions, intersections, and complements (from the propositional symbols). We can simplify some of these intertwined operations using the results from Section 4.5, but the projections are still an issue that must be grappled with.

Eventually we will discuss *quantifier elimination* (see Section 7.4), which can resolve these issues in some structures. In particular, we will use that technique to show the surprising and mathematically useful result that every definable subset of \(\mathbb C\) in the structure \((\mathbb C,0,1,+,-,\cdot)\) is either finite or cofinite. Contrast this situation with the fact that many exotic subsets of \(\mathbb N\) are definable in \((\mathbb N,0,1,+,\cdot)\). The fact that \((\mathbb N,0,1,+,\cdot)\) has so many interesting definable subsets plays an essential role in the Incompleteness Theorems (see Chapter 12).

## 4.4 Substitution

In the previous section, we introduced definability and talked about its fundamental role in many things to come. With all of that tantalizing foreshadowing in place, we will spend the the rest of
