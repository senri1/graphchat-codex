# 5 Relationships between Structures

Suppose that we have a (first-order) language \(\mathcal{L}\). As emphasized in Chapter 4, the elements of \(\operatorname{Form}_{\mathcal{L}}\) are just syntactic sequences of symbols, and we only attach meaning to these formulas once we provide an \(\mathcal{L}\)-structure together with a variable assignment. The fundamental separation between syntactic formulas and semantic structures is incredibly important, because it opens up an interesting way to find both commonalities and differences across structures. That is, given two structures with variable assignments \((\mathcal{M}_1,s_1)\) and \((\mathcal{M}_2,s_2)\), we can compare the two sets \(\{\varphi \in \operatorname{Form}_{\mathcal{L}} : (\mathcal{M}_1,s_1) \vDash \varphi\}\) and \(\{\varphi \in \operatorname{Form}_{\mathcal{L}} : (\mathcal{M}_2,s_2) \vDash \varphi\}\). Although the two structures and variable assignments likely live in different worlds, these two sets both live inside the same set \(\operatorname{Form}_{\mathcal{L}}\). In other words, the syntactic nature of the formulas provides a shared substrate where we can perform comparisons.

When we restrict down to the set \(\operatorname{Sent}_{\mathcal{L}} \subseteq \operatorname{Form}_{\mathcal{L}}\), we do not even need to carry around variable assignments, and so we can directly compare the structures via the sentences that they satisfy. We already started down this road when we introduced the concept of when two structures are *elementarily equivalent* in Definition 4.2.9. We will certainly explore that definition in this chapter (and much more in the chapters to come), but we will also introduce other notions. For example, we might only care about whether two structures agree on certain special sentences. We will also generalize the algebraic concepts of homomorphisms and isomorphisms to all structures and determine how these functions interact with the truth of formulas between the underlying structures.

## 5.1 Elementary Classes

As emphasized in Section 4.2, if we have a language \(\mathcal{L}\), then an \(\mathcal{L}\)-structure can be any nonempty set \(M\) together with any interpretation of the symbols. In particular, although we might only have certain structures in mind when we describe a language, the structures themselves need not respect our desires. We can impose some restrictions on the \(\mathcal{L}\)-structures by trimming down to the ones that make certain formulas true.

**Definition 5.1.1.** Let \(\mathcal{L}\) be a language and let \(\Gamma \subseteq \operatorname{Form}_{\mathcal{L}}\). A *model* of \(\Gamma\) is a pair \((\mathcal{M},s)\), where \(\mathcal{M}\) is an \(\mathcal{L}\)-structure and \(s : \operatorname{Var} \to M\) is a variable assignment, such that \((\mathcal{M},s) \vDash \gamma\) for all \(\gamma \in \Gamma\).

If we are in the important special case where we have a set of sentences \(\Sigma \subseteq \operatorname{Sent}_{\mathcal{L}}\), then the variable assignment \(s\) in the definition of a model is irrelevant by Proposition 4.2.7. Thus, a model of \(\Sigma\) can be viewed as just the structure (i.e. we do not need a variable assignment). In other words, we can instead describe a model in the following way.

**Definition 5.1.2.** Let \(\mathcal{L}\) be a language and let \(\Sigma \subseteq \operatorname{Sent}_{\mathcal{L}}\). A *model* of \(\Sigma\) is an \(\mathcal{L}\)-structure \(\mathcal{M}\) such that \(\mathcal{M} \vDash \sigma\) for all \(\sigma \in \Sigma\).

Technically, the previous two definitions conflict with each other, but the context (i.e. whether we have any formulas with free variables) will make it clear which definition we are using. We will typically work with sets of sentences, and that will be the sole focus of this section. Given a set \(\Sigma \subseteq \operatorname{Sent}_{\mathcal{L}}\), we can restrict down to those \(\mathcal{L}\)-structures that are models of \(\Sigma\). In the next definition, we use the word *class* rather than *set* for important technical reasons (see Section 8.7), but it is fine to ignore these issues until we discuss set theory.

**Definition 5.1.3.** Let \(\mathcal{L}\) be a language, and let \(\Sigma \subseteq \operatorname{Sent}_{\mathcal{L}}\). We let \(\operatorname{Mod}(\Sigma)\) be the class of all models of \(\Sigma\), that is, \(\operatorname{Mod}(\Sigma)\) is the collection of \(\mathcal{L}\)-structures \(\mathcal{M}\) such that \(\mathcal{M} \vDash \sigma\) for all \(\sigma \in \Sigma\).

For example, suppose that we are working in the language \(\mathcal{L} = \{R\}\), where \(R\) is a binary relation symbol. An \(\mathcal{L}\)-structure is just a set together with a binary relation, and this binary relation need not have any interesting properties. Now \(\operatorname{Mod}(\{\forall x\,Rxx\})\) only includes some of those \(\mathcal{L}\)-structures; it is the class of all \(\mathcal{L}\)-structures where the interpretation of the relation is reflexive. We give the collections of \(\mathcal{L}\)-structures that can be carved out in such a way (i.e. via a set of sentences) a special name.

**Definition 5.1.4.** Let \(\mathcal{L}\) be a language, and let \(\mathcal{K}\) be a class of \(\mathcal{L}\)-structures.

- We say that \(\mathcal{K}\) is an *elementary class* if there exists \(\Sigma \subseteq \operatorname{Sent}_{\mathcal{L}}\) such that \(\mathcal{K} = \operatorname{Mod}(\Sigma)\).

- We say that \(\mathcal{K}\) is a *strong elementary class* if there exists a finite set \(\Sigma \subseteq \operatorname{Sent}_{\mathcal{L}}\) such that \(\mathcal{K} = \operatorname{Mod}(\Sigma)\).

For example, if we let \(\mathcal{L} = \{e,{\cdot}\}\) be the language of monoids, then the class of groups is a strong elementary class, as we saw in Chapter 1, because we can let \(\Sigma\) be the following collection of sentences:

(a) \(\forall x\forall y\forall z((x \cdot y) \cdot z = x \cdot (y \cdot z))\).  
(b) \(\forall x((x \cdot e = x) \wedge (e \cdot x = x))\).  
(c) \(\forall x\exists y((x \cdot y = e) \wedge (y \cdot x = e))\).

If we instead use the language \(\mathcal{L} = \{e,{\cdot},i\}\) of groups, then the class of groups is a strong elementary class by letting \(\Sigma\) be the following collection of sentences:

(a) \(\forall x\forall y\forall z((x \cdot y) \cdot z = x \cdot (y \cdot z))\).  
(b) \(\forall x((x \cdot e = x) \wedge (e \cdot x = x))\).  
(c) \(\forall x((x \cdot i(x) = e) \wedge (i(x) \cdot x = e))\).

Moving on to another language, consider \(\mathcal{L} = \{R\}\), where \(R\) is a binary relation symbol. We can form several important strong elementary classes in this language:

1. The class of partial orderings is a strong elementary class, as we saw in Chapter 1, because we can let \(\Sigma\) be the following collection of sentences:

   (a) \(\forall x\neg Rxx\).  
   (b) \(\forall x\forall y\forall z((Rxy \wedge Ryz) \to Rxz)\).

2. The class of equivalence relations is a strong elementary class by letting \(\Sigma\) be the following collection of sentences:

   (a) \(\forall x\,Rxx\).  
   (b) \(\forall x\forall y(Rxy \to Ryx)\).  
   (c) \(\forall x\forall y\forall z((Rxy \wedge Ryz) \to Rxz)\).

3. A (loopless) simple graph is typically defined to be a nonempty set \(V\) of vertices together with a set \(E\) of edges, where each edge is a subset of \(V\) of size 2. If we use the language \(\mathcal{L} = \{R\}\), where \(R\) is a binary relation symbol, then we can code such graphs as the structures \(\mathcal{M}\) where \(R^{\mathcal{M}}\) is both irreflexive and symmetric. That is, since \(R^{\mathcal{M}}\) is a set of ordered pairs from \(M\), we handle the unordered nature of endpoints of an edge by putting *both* ordered pairs into \(R^{\mathcal{M}}\). From this perspective, the class of (loopless) simple graphs is a strong elementary class by letting \(\Sigma\) be the following collection of sentences:

   (a) \(\forall x(\neg Rxx)\).  
   (b) \(\forall x\forall y(Rxy \to Ryx)\).

For another example, let \(\mathcal{L} = \{0,1,+,{\cdot},-\}\) be the language of rings (recall that \(+\) and \(\cdot\) are binary, and that \(-\) is unary):

1. The class of (possibly noncommutative) rings with identity is a strong elementary class by letting \(\Sigma\) be the following collection of sentences:

   (a) \(\forall x\forall y\forall z(x + (y + z) = (x + y) + z)\).  
   (b) \(\forall x((x + 0 = x) \wedge (0 + x = x))\).  
   (c) \(\forall x((x + (-x) = 0) \wedge ((-x) + x = 0))\).  
   (d) \(\forall x\forall y(x + y = y + x)\).  
   (e) \(\forall x((x \cdot 1 = x) \wedge (1 \cdot x = x))\).  
   (f) \(\forall x\forall y\forall z(x \cdot (y \cdot z) = (x \cdot y) \cdot z)\).  
   (g) \(\forall x\forall y\forall z(x \cdot (y + z) = (x \cdot y) + (x \cdot z)) \wedge \forall x\forall y\forall z((x + y) \cdot z = (x \cdot z) + (y \cdot z))\).

2. The class of fields is a strong elementary class by letting \(\Sigma\) be the above sentences together with:

   (h) \(\neg(0 = 1)\).  
   (i) \(\forall x\forall y(x \cdot y = y \cdot x)\).  
   (j) \(\forall x(\neg(x = 0) \to \exists y(x \cdot y = 1))\).

3. For each prime \(p > 0\), the class of fields of characteristic \(p\) is a strong elementary class. To see this, fix a prime \(p > 0\), and let \(\Sigma_p\) be the above sentences together with the sentence

   \[
   1 + 1 + \cdots + 1 = 0,
   \]

   where there are \(p\) many 1's in the sum, associated in any way (say, to the right).

All of the examples so far have been strong elementary classes. We now describe three elementary classes where the natural set \(\Sigma\) is infinite:

1. In the language of rings \(\mathcal{L} = \{0,1,+,{\cdot},-\}\), the class of all fields of characteristic 0 is an elementary class. To see this, for each \(n \in \mathbb{N}^{+}\), let \(\tau_n\) be the sentence \(\neg(1 + 1 + \cdots + 1 = 0)\), where there are \(n\) many 1's in the sum. Now let \(\Sigma\) be the collection of field axioms (written above) together with \(\{\tau_n : n \in \mathbb{N}^{+}\}\).

2. In the language of groups \(\mathcal{L} = \{e,{\cdot},i\}\), the class of all torsion-free groups, that is, groups for which every nonidentity element has infinite order, is an elementary class. For each \(n \in \mathbb{N}^{+}\), let \(\tau_n\) be the sentence \(\forall x(x \cdot x \cdots x = e \to x = e)\), where there are \(n\) many \(x\)'s in the product. Now let \(\Sigma\) be the set of group axioms (listed above) together with \(\{\tau_n : n \in \mathbb{N}^{+}\}\).

3. In the language of rings \(\mathcal{L} = \{0,1,+,{\cdot},-\}\), the class of all algebraically closed fields is an elementary class. For each \(n \in \mathbb{N}^{+}\), let \(\tau_n\) be the sentence

   \[
   \forall a_0\forall a_1 \cdots \forall a_n\bigl(\neg(a_n = 0) \to \exists x(a_n \cdot x^n + \cdots + a_1x + a_0 = 0)\bigr),
   \]

   where each \(x^k\) is shorthand for the term \(x \cdot x \cdots x\) that has \(k\) many \(x\)'s. Let \(\Sigma\) be the field axioms together with \(\{\tau_n : n \in \mathbb{N}^{+}\}\).

We now consider an example of an area of mathematics where the natural first-order language has infinitely many symbols. Suppose that we want to develop a language for vector spaces. A vector space has two different types of elements: the scalars (that come from a field) and the vectors (which form an abelian group). If we want to develop a language that will work for vector spaces across different choices for the field (i.e. we want to allow different sets of scalars across our structures), then our setup does not work particularly well. No matter what language \(\mathcal{L}\) we pick, an \(\mathcal{L}\)-structure consists of *one* set of elements, together with interpretations for the symbols. One way to enforce these two different types of elements within that set (such as scalars and vectors) is to include two unary relation symbols \(S\) and \(V\) for the scalars and vectors, respectively. But now the issue is that if we include a binary function symbol \(+\) for addition, then an \(\mathcal{L}\)-structure must provide an interpretation for *all* pairs of elements, and so must tell us how to add a scalar and a vector. Of course, we can simply ignore the interpretations here, or enforce (via some sentences) that the sum is some default element, like the zero vector, but these options are certainly inelegant. A better way to handle the general situation where we have objects of different types is to use something called *many-sorted* first-order logic, where the underlying universe is naturally divided into pieces, called *sorts*. In this context, the constant, relation, and function symbols come equipped with additional information about which sorts they apply to. We will not pursue that topic here, but essentially all of our results carry over to the many-sorted setting.

Suppose instead that we fix a field \(F\) and want to talk about the collection of vector spaces over that one field. We now define the natural language for this setting.

**Definition 5.1.5.** Let \(F\) be a field. The language \(\mathcal{L}_F = \{0,+\} \cup \{h_\alpha : \alpha \in F\}\), where 0 is a constant symbol, \(+\) is binary function symbol, and each \(h_\alpha\) is a unary function symbol, is called the *language of vector spaces over \(F\)*.

The idea is to use \(h_\alpha\) to code scalar multiplication by \(\alpha\). The class of vector spaces over \(F\) is an elementary class in the language \(\mathcal{L}_F\), as witnessed by letting \(\Sigma\) be the following collection of sentences:

(a) \(\forall x\forall y\forall z(x + (y + z) = (x + y) + z)\).  
(b) \(\forall x((x + 0 = x) \wedge (0 + x = x))\).  
(c) \(\forall x\exists y((x + y = 0) \wedge (y + x = 0))\).  
(d) \(\forall x\forall y(x + y = y + x)\).  
(e) \(\forall x\forall y(h_\alpha(x + y) = h_\alpha(x) + h_\alpha(y))\) for each \(\alpha \in F\).  
(f) \(\forall x(h_{\alpha+\beta}(x) = (h_\alpha(x) + h_\beta(x)))\) for each \(\alpha,\beta \in F\).  
(g) \(\forall x(h_{\alpha \cdot \beta}(x) = h_\alpha(h_\beta(x)))\) for each \(\alpha,\beta \in F\).  
(h) \(\forall x(h_1(x) = x)\).

Notice that if \(F\) is infinite, then we really do have infinitely many formulas here, because three of the sentences are parametrized by elements of \(F\).

Finally, given *any* language \(\mathcal{L}\) and any \(n \in \mathbb{N}^{+}\), the class of \(\mathcal{L}\)-structures of cardinality at least \(n\) is a strong elementary class, as witnessed by the following sentence \(\sigma_n\):

\[
\exists x_1 \cdots \exists x_n\left(\bigwedge_{1 \leq i < j \leq n}\neg(x_i = x_j)\right).
\]

Furthermore, the class of \(\mathcal{L}\)-structures of cardinality equal to \(n\) is a strong elementary class, because we can just use the sentence \(\sigma_n \wedge (\neg\sigma_{n+1})\).

At this point, it is often clear how to show that a certain class of structures is a (strong) elementary class: simply exhibit a correct set of sentences. However, it is unclear how one could show that a class is *not* a (strong) elementary class. For example, is the class of fields of characteristic 0 a strong elementary class? Is the class of finite fields even an elementary class? How about the class of torsion groups (i.e. groups in which every element has finite order). There are no obvious ways to answer these questions affirmatively. We will be able to resolve all of these questions in Section 6.4 once we establish the Compactness Theorem for first-order logic.

Another interesting case is the class of Dedekind-complete ordered fields. Now the ordered field axioms are easily written down in the language of ordered rings. In contrast, the Dedekind-completeness axiom, which says that every nonempty subset that is bounded above has a least upper bound, cannot be directly translated into a sentence, as it involves quantifying over subsets instead of elements. But we cannot use this apparent obstacle to immediately conclude that the class of Dedekind-complete ordered fields is not an elementary class. Perhaps there is an alternative approach that captures these structures in a different way by finding a clever equivalent first-order sentence that is equivalent to Dedekind-completeness. We will resolve this question negatively in Section 5.5.

As we will see, the fundamental idea behind showing that a certain class of structures \(\mathcal{K}\) is not an elementary class is to show that all elementary classes have a certain property, but \(\mathcal{K}\) does not. We now give our first simple result in this direction.

**Proposition 5.1.6.** *If \(\mathcal{K}\) is an elementary class of structures, then \(\mathcal{K}\) is closed under elementary equivalence. That is, whenever \(\mathcal{M}\) and \(\mathcal{N}\) are \(\mathcal{L}\)-structures, and we have both \(\mathcal{M} \in \mathcal{K}\) and \(\mathcal{M} \equiv \mathcal{N}\), then \(\mathcal{N} \in \mathcal{K}\).*

*Proof.* Let \(\mathcal{K}\) be an elementary class of structures. By definition, we can fix \(\Sigma \subseteq \operatorname{Sent}_{\mathcal{L}}\) with \(\mathcal{K} = \operatorname{Mod}(\Sigma)\). Let \(\mathcal{M} \in \mathcal{K}\) and let \(\mathcal{N}\) be an arbitrary \(\mathcal{L}\)-structure with \(\mathcal{M} \equiv \mathcal{N}\). For any \(\sigma \in \Sigma\), we have \(\mathcal{M} \vDash \sigma\), so we can use the fact that \(\mathcal{M} \equiv \mathcal{N}\) to conclude that \(\mathcal{N} \vDash \sigma\). Thus, \(\mathcal{N}\) is a model of \(\Sigma\), and hence \(\mathcal{N} \in \operatorname{Mod}(\Sigma) = \mathcal{K}\). \(\square\)

Thus, one way to show that a class of structures \(\mathcal{K}\) is not an elementary class is to show that there exist two elementarily equivalent structures such that one is in \(\mathcal{K}\) and one is not. We need to develop ways to show that two structures are elementarily equivalent, and we develop our first such technique in the next section.

## 5.2 Substructures and Homomorphisms

One of the basic ways to obtain new algebraic structures (whether vector spaces, groups, or rings) is to find them *inside* already established ones. For example, when working in the vector space of all functions \(f : \mathbb{R} \to \mathbb{R}\) under the usual pointwise operations, we can form the subspace of continuous functions, or the subspace of differentiable functions. Within the symmetric groups \(S_n\), one naturally defines the alternating groups \(A_n\) and the dihedral groups \(D_n\). These ideas also arise in combinatorial structures, such as when examining subgraphs of a given graph or viewing a partial ordering as a piece of a larger one. The general unifying concept here is that of a substructure.

**Definition 5.2.1.** Let \(\mathcal{L}\) be a language and let \(\mathcal{M}\) and \(\mathcal{A}\) be \(\mathcal{L}\)-structures. We say that \(\mathcal{A}\) is a *substructure* of \(\mathcal{M}\) if the following conditions hold:

1. \(A \subseteq M\), where \(A\) and \(M\) are the underlying sets of \(\mathcal{A}\) and \(\mathcal{M}\), respectively.

2. \(c^{\mathcal{A}} = c^{\mathcal{M}}\) for all \(c \in \operatorname{ConSym}\).

3. \(R^{\mathcal{A}} = R^{\mathcal{M}} \cap A^k\) for all \(R \in \operatorname{RelSym}_k\).

4. \(f^{\mathcal{A}} = f^{\mathcal{M}} \mathbin{\upharpoonright} A^k\) for all \(f \in \operatorname{FuncSym}_k\).
