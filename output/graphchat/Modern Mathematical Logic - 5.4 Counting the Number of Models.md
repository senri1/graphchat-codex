# 5.4 Counting the Number of Models

A fundamental problem in group theory is to determine the number of groups of a given (finite) size up to isomorphism. More generally, given a set \(\Sigma \subseteq \operatorname{Sent}_{\mathcal{L}}\) and an \(n \in \mathbb{N}^+\), we might want to count the number of models of \(\Sigma\) of cardinality \(n\) up to isomorphism. There are some technical set-theoretic difficulties here that will be elaborated upon later (see Section 8.7), but the key fact that limits the number of the structures we need to consider is the following result. Fundamentally, it says that we can assume that the universe of our structure is any given set of the appropriate cardinality, so we might as well assume that it is \([n]\).

**Proposition 5.4.1** *Let \(\mathcal{L}\) be a language and let \(n \in \mathbb{N}^+\). For every \(\mathcal{L}\)-structure \(\mathcal{M}\) with \(|M|=n\), there exists an \(\mathcal{L}\)-structure \(\mathcal{N}\) with \(N=[n]\) such that \(\mathcal{M} \cong \mathcal{N}\).*

*Proof.* Let \(\mathcal{M}\) be an \(\mathcal{L}\)-structure with \(|M|=n\). Fix a bijection \(h:M\to[n]\). Let \(\mathcal{N}\) be the following \(\mathcal{L}\)-structure:

- \(N=[n]\).
- \(c^{\mathcal{N}}=h(c^{\mathcal{M}})\) for all \(c \in \operatorname{ConSym}\).
- \(R^{\mathcal{N}}=\{(b_1,\ldots,b_k) \in N^k : (h^{-1}(b_1),\ldots,h^{-1}(b_k)) \in R^{\mathcal{M}}\}\) for all \(R \in \operatorname{RelSym}_k\).
- \(f^{\mathcal{N}}\) is the function from \(N^k\) to \(N\) defined by

  \[
  f^{\mathcal{N}}(b_1,\ldots,b_k)
  =h\bigl(f^{\mathcal{M}}(h^{-1}(b_1),\ldots,h^{-1}(b_k))\bigr)
  \]

  for all \(f \in \operatorname{FuncSym}_k\).

It is then straightforward to check that \(h\) is an isomorphism from \(\mathcal{M}\) to \(\mathcal{N}\). \(\square\)

**Proposition 5.4.2** *If \(\mathcal{L}\) is finite and \(n \in \mathbb{N}^+\), then there are only finitely many \(\mathcal{L}\)-structures with universe \([n]\).*

*Proof.* Since \(\mathcal{L}\) is finite and we are working with the fixed universe \([n]\), there are only a finite number of choices for each \(c^{\mathcal{M}}\), each \(R^{\mathcal{M}}\), and each \(f^{\mathcal{M}}\). \(\square\)

**Definition 5.4.3** Let \(\mathcal{L}\) be a language and let \(\Sigma \subseteq \operatorname{Sent}_{\mathcal{L}}\). For each \(n \in \mathbb{N}^+\), let \(I(\Sigma,n)\) be the number of models of \(\Sigma\) of cardinality \(n\) up to isomorphism. Formally, we consider the set of all \(\mathcal{L}\)-structures with universe \([n]\) and count the number of equivalence classes under the equivalence relation of being isomorphic.

When \(\Sigma\) is the set of axioms of groups in the language of groups, then \(I(\Sigma,n)\) is a very interesting function that one studies in algebra. For example, we have that \(I(\Sigma,p)=1\) for all primes \(p\), that \(I(\Sigma,6)=2\), and that \(I(\Sigma,8)=5\). Let's consider some other examples:

- Let \(\mathcal{L}=\varnothing\). We claim that \(I(\varnothing,n)=1\) for all \(n \in \mathbb{N}^+\). Every structure is trivially a model of \(\varnothing\), so we just need to count the number of structures up to isomorphism. First notice that for each \(n \in \mathbb{N}^+\), there exists an \(\mathcal{L}\)-structure of cardinality \(n\) (just let \(M=[n]\)), so \(I(\Sigma,n) \geq 1\). Now notice that if \(\mathcal{M}\) and \(\mathcal{N}\) are two \(\mathcal{L}\)-structures of cardinality \(n\), then any bijection \(h:M\to N\) is an isomorphism (because \(\mathcal{L}=\varnothing\)), so \(I(\varnothing,n) \leq 1\). It follows that \(I(\varnothing,n)=1\) for all \(n \in \mathbb{N}^+\).

- Let \(\mathcal{L}=\{<\}\) be the language of orderings, and let \(\Sigma\) be the set of axioms of linear orderings. We claim that \(I(\Sigma,n)=1\) for all \(n \in \mathbb{N}^+\). First, for every \(n \in \mathbb{N}^+\), the \(\mathcal{L}\)-structure \(\mathcal{M}\) where \(M=[n]\) and \(<^{\mathcal{M}}=\{(k,\ell) \in [n]^2 : k<\ell\}\) is a model of \(\Sigma\) of cardinality \(n\), so \(I(\Sigma,n) \geq 1\). Next, we claim that any two linear orderings of cardinality \(n\) are isomorphic. Intuitively, this works as follows. Notice (by induction on the number of elements) that every finite linear ordering has a least element. Let \(\mathcal{M}\) and \(\mathcal{N}\) be two linear orderings of cardinality \(n\). Each must have a least element, so map the least element of \(\mathcal{M}\) to that of \(\mathcal{N}\). Remove these elements, then map the least element remaining in \(\mathcal{M}\) to the least element remaining in \(\mathcal{N}\), and continue. This gives an isomorphism. Formally, one can turn this into a proof by induction on \(n\).

- Let \(\mathcal{L}=\{f\}\) where \(f\) is a unary function symbol, and let \(\Sigma=\{\forall x(ffx=x)\}\). We claim that \(I(\Sigma,n)=\left\lfloor \frac{n}{2} \right\rfloor+1\) for all \(n \in \mathbb{N}^+\).

  Let's first analyze the finite models of \(\Sigma\). Suppose that \(\mathcal{M}\) is a model of \(\Sigma\) of cardinality \(n\). For every \(a \in M\), we have \(f^{\mathcal{M}}(f^{\mathcal{M}}(a))=a\). There are now two cases for each \(a \in M\): either \(f^{\mathcal{M}}(a)=a\), or \(f^{\mathcal{M}}(a)=b\neq a\) in which case \(f^{\mathcal{M}}(b)=a\). Let

  - \(\operatorname{Fix}_{\mathcal{M}}=\{a \in M : f^{\mathcal{M}}(a)=a\}\).
  - \(\operatorname{Move}_{\mathcal{M}}=\{a \in M : f^{\mathcal{M}}(a)\neq a\}\).

  From above, we then have that \(|\operatorname{Move}_{\mathcal{M}}|\) is even and that \(|\operatorname{Fix}_{\mathcal{M}}|+|\operatorname{Move}_{\mathcal{M}}|=n\). It is then straightforward to show that two models \(\mathcal{M}\) and \(\mathcal{N}\) of \(\Sigma\) of cardinality \(n\) are isomorphic exactly when they have the same number of fixed points, because then we can match up the fixed points and then match up the leftover pairings within \(\operatorname{Move}_{\mathcal{M}}\) to obtain an isomorphism.

  Thus we need only count how many possible values there are for \(|\operatorname{Fix}_{\mathcal{M}}|\). Let \(n \in \mathbb{N}^+\). Suppose first that \(n\) is even. Since \(|\operatorname{Move}_{\mathcal{M}}|\) must be even, it follows that \(|\operatorname{Fix}_{\mathcal{M}}|\) must be even. Thus, \(|\operatorname{Fix}_{\mathcal{M}}| \in \{0,2,4,\ldots,n\}\), so there are \(\frac{n}{2}+1\) many possibilities, and one can certainly construct models in which each of these possibilities occurs. Suppose now that \(n\) is odd. Since \(|\operatorname{Move}_{\mathcal{M}}|\) must be even, it follows that \(|\operatorname{Fix}_{\mathcal{M}}|\) must be odd. Thus, \(|\operatorname{Fix}_{\mathcal{M}}| \in \{1,3,5,\ldots,n\}\), so there are \(\frac{n-1}{2}+1\) many possibilities, and one can certainly construct models in which each of these possibilities occurs. Thus, in either case, we have \(I(T,n)=\left\lfloor \frac{n}{2} \right\rfloor+1\).

Instead of counting the number of models of a set \(\Sigma \subseteq \operatorname{Sent}_{\mathcal{L}}\) of various sizes up to isomorphism, a more basic question is determining the values of \(n \in \mathbb{N}^+\) for which a model exists. For example, if \(\Sigma\) is the set of field axioms in the language of rings, then there exists a model of \(\Sigma\) of size \(n\) if and only if \(n\) is a prime power.

**Definition 5.4.4** Let \(\mathcal{L}\) be a finite language and let \(\Sigma \subseteq \operatorname{Sent}_{\mathcal{L}}\). We define \(\operatorname{Spec}(\Sigma)=\{n \in \mathbb{N}^+ : I(\Sigma,n)>0\}\), that is, \(\operatorname{Spec}(\Sigma)\) is the set of natural numbers \(n\) such that \(\Sigma\) has a model of cardinality \(n\). The set \(\operatorname{Spec}(\Sigma)\) is called the *spectrum* of \(\Sigma\).

Of course, if we have a way to determine \(n\mapsto I(\Sigma,n)\) for a given set \(\Sigma\), then we can determine \(\operatorname{Spec}(\Sigma)\). A more interesting question is to go in the other direction. That is, given \(S \subseteq \mathbb{N}^+\), can we build a set \(\Sigma \subseteq \operatorname{Sent}_{\mathcal{L}}\) in a finite language \(\mathcal{L}\) with \(\operatorname{Spec}(\Sigma)=S\)? Let's consider a couple of examples:

- There exist a finite language \(\mathcal{L}\) and a finite set \(\Sigma \subseteq \operatorname{Sent}_{\mathcal{L}}\) such that \(\operatorname{Spec}(\Sigma)=\{2n:n \in \mathbb{N}^+\}\).

  We give two separate arguments. First, let \(\mathcal{L}\) be the language of groups. Let \(\Sigma\) be the set of group axioms, together with the sentence \(\exists x(\neg(x=e) \land x\mathbin{\cdot}x=e)\) expressing that there is an element of order 2. Now for every \(n \in \mathbb{N}^+\), the group \(\mathbb{Z}/(2n)\mathbb{Z}\) is a model of \(\Sigma\) of cardinality \(2n\) because (the equivalence class of) \(n\) is an element of order 2. Thus, \(\{2n:n \in \mathbb{N}^+\} \subseteq \operatorname{Spec}(\Sigma)\). Suppose now that \(k \in \operatorname{Spec}(\Sigma)\), and fix a model \(\mathcal{M}\) of \(\sigma\) with cardinality \(k\). We then have that \(\mathcal{M}\) is a group with an element of order 2, so by Lagrange's Theorem it follows that \(2 \mid k\), so \(k \in \{2n:n \in \mathbb{N}^+\}\). It follows that \(\operatorname{Spec}(\Sigma)=\{2n:n \in \mathbb{N}^+\}\).

  For a second example, let \(\mathcal{L}=\{R\}\), where \(R\) is a binary relation symbol. Let \(\Sigma\) be the set of the following sentences:

  - \(\forall xRxx\).
  - \(\forall x\forall y(Rxy \to Ryx)\).
  - \(\forall x\forall y\forall z((Rxy \land Ryz) \to Rxz)\).
  - \(\forall x\exists y(\neg(y=x) \land Rxy \land \forall z(Rxz \to (z=x \lor z=y)))\).

  Notice that a model of \(\Sigma\) is simply an equivalence relation in which every equivalence class has exactly two elements. It is now straightforward to show that \(\operatorname{Spec}(\Sigma)=\{2n:n \in \mathbb{N}^+\}\).

- There exists a finite language \(\mathcal{L}\) and a finite set \(\Sigma \subseteq \operatorname{Sent}_{\mathcal{L}}\) such that \(\operatorname{Spec}(\Sigma)=\{2^n:n \in \mathbb{N}^+\}\).

  Again, we give two separate arguments. First, let \(\mathcal{L}\) be the language of groups. Let \(\Sigma\) be the set of group axioms with the sentences \(\exists x\neg(x=e)\) and \(\forall x(x\mathbin{\cdot}x=e)\) expressing that the group is nontrivial and that there every nonidentity element has order 2. Now for every \(n \in \mathbb{N}^+\), the group \((\mathbb{Z}/2\mathbb{Z})^n\) is a model of \(\Sigma\) of cardinality \(2^n\). Thus, \(\{2^n:n \in \mathbb{N}^+\} \subseteq \operatorname{Spec}(\Sigma)\). Suppose now that \(k \in \operatorname{Spec}(\Sigma)\), and fix a model \(\mathcal{M}\) of \(\Sigma\) of cardinality \(k\). We then have that \(k>1\) and that \(\mathcal{M}\) is a group such that every nonidentity element has order 2. Now for any prime \(p\neq 2\), it is not the case that \(p\) divides \(k\) because otherwise \(\mathcal{M}\) would have to have an element of order \(p\) by Cauchy's Theorem. Thus, the only prime that divides \(k\) is 2, and so \(k \in \{2^n:n \in \mathbb{N}^+\}\). It follows that \(\operatorname{Spec}(\Sigma)=\{2^n:n \in \mathbb{N}^+\}\).

  For a second example, let \(\mathcal{L}\) be the language of rings. Let \(\Sigma\) be the set of field axioms together with \(1+1=0\). Thus, the models of \(\Sigma\) are exactly the fields of characteristic 2. By results in algebra, there is a finite field of characteristic 2 of cardinality \(k\) if and only if \(k\) is a power of 2.

As seen in these examples, it is often challenging to try to build a set \(\Sigma\) so that \(\operatorname{Spec}(\Sigma)\) is equal to a given subset of \(\mathbb{N}^+\). See Exercise 23 for some other examples, and (the aside after) Exercise 24 for some interesting connections with computational complexity.

We can extend the function \(n\mapsto I(\Sigma,n)\) from finite natural numbers \(n\) to infinite cardinalities. Most of this work will have to wait until Chapter 10, but we explore one important example now in the countably infinite case. Let \(\mathcal{L}=\{<\}\) be the language of orderings, and consider the class \(\mathcal{K}\) or all linear orderings. There are many countable linear orderings that are not isomorphic. For example, in the language \(\mathcal{L}=\{<\}\) of orderings, the structure \((\mathbb{N},<)\) and \((\mathbb{Z},<)\) and \((\mathbb{Q},<)\) are all countable linear orderings that are not elementarily equivalent (see the discussion after Definition 4.2.9), and hence not isomorphic. The ordering \((\mathbb{Q},<)\) has the property that it is dense (i.e., that whenever \(a<b\), we can find an element between \(a\) and \(b\)). The ordering \((\mathbb{Q}^{\geq 0},<)\) on the nonnegative rationals also has this property, but it is not isomorphic to \((\mathbb{Q},<)\) because it has a smallest element. In addition, we can find examples of dense linear orderings with a largest element, including ones with both a smallest and a largest element. But we can write down a handful of first-order sentences in the language of orderings that express both density and the fact that there is neither a least nor a greatest element.

**Definition 5.4.5** Let \(\mathcal{L}=\{<\}\) be the language of orderings, and let \(\Sigma\) be the set of the following six sentences:

- \(\forall x\neg(x<x)\).
- \(\forall x\forall y\forall z((x<y \land y<z) \to x<z)\).
- \(\forall x\forall y(x<y \lor x=y \lor y<x)\).
- \(\forall x\exists y(x<y)\).
- \(\forall x\exists y(y<x)\).
- \(\forall x\forall y(x<y \to \exists z(x<z \land z<y))\).

A model of \(\Sigma\) is called a *dense linear ordering without endpoints*.

Perhaps surprisingly, these sentences completely characterize the ordering \((\mathbb{Q},<)\) in the countably infinite case. In other words, any two countably infinite models of \(\Sigma\) are isomorphic. Before jumping into the careful argument, we first outline the core ideas within the proof. Suppose that we have two models \((A,<_{1})\) and \((Z,<_{2})\) of \(\Sigma\). We will use letters near the beginning of the alphabet to represent elements of \(A\), and letters near the end of the alphabet to represent elements of \(Z\). Instead of following the traditional path of showing that two objects are isomorphic (by just defining an explicit function outright and checking that it works), we are going to build our isomorphism across countably many stages. Since we are assuming that \(A\) and \(Z\) are countably infinite, we begin by listing their elements as \(a_0,a_1,a_2,\ldots\) and \(z_0,z_1,z_2,\ldots\), respectively. We start defining a function \(h:A\to Z\) by letting \(h(a_0)=z_0\). When we move on to \(a_1\), we have two possibilities to consider: it might be less than \(a_0\), or it might be greater than \(a_0\). If \(a_1<_{1}a_0\), then since \((Z,<_{2})\) does not have a least element, we can fix some \(y \in Z\) with \(y<_{2}z_0\) and define \(h(a_1)=y\). On the other hand, if \(a_0<_{1}a_1\), then since \((Z,<_{2})\) does not have a greatest element, we can fix some \(y \in Z\) with \(z_0<_{2}y\) and define \(h(a_1)=y\). When we move on to \(a_2\), we already have a function from \(\{a_0,a_1\}\) to \(Z\) that respects the ordering, and \(a_2\) will "slot into" one of three places: it will either be less than both of \(a_0\) and \(a_1\), greater than both of them, or between them. In all cases, since \((Z,<_{2})\) is a dense linear ordering without endpoints, we can define \(h(a_2)\) to be some element of \(Z\) so that the resulting function from \(\{a_0,a_1,a_2\}\) to \(Z\) still respects the ordering.

If we follow this outline through countably many stages, then we build an order-preserving injective function \(h:A\to Z\). However, there is no reason to believe that \(h\) will be surjective. Indeed, we never actually used the listing of the elements of \(Z\), or even that \(Z\) was countable. And we can actually use the preceding argument to show that any given countable dense linear ordering without endpoints \((A,<_{1})\) embeds into every dense linear ordering without endpoints, regardless of size. But what if we want to create an isomorphism? Instead of focusing on where to send the elements of \(A\), we should also occasionally give some attention to elements of \(Z\). After defining where to send \(a_1\) in the preceding outline, let's move over to the \(Z\) side and find something to send to \(z_1\). At this point, we have a function from \(\{a_0,a_1\}\) to \(Z\) that respects the ordering, and either \(z_1\) is already in the range or it slots into one of three positions relative to \(h(a_0)\) and \(h(a_1)\). If \(z_1\) is not in the range, then use the fact that \((A,<_{1})\) is a dense linear ordering without endpoints to find a way to extend \(h\) so that \(z_1\) will be in the new range. Now we can return attention to \(A\) in order to find a place to send \(a_2\), then go back to \(Z\) to find an input to hit \(z_2\), and so on. At each stage, we have an order-preserving bijection between a finite subset of \(A\) and a finite subset of \(Z\), and regardless of where a new element falls, we can use our assumptions about \((A,<_{1})\) and \((Z,<_{2})\) to extend our function.

We now lay out the details carefully. The elegant idea of bouncing between the domain and codomain in order to build up a bijection that preserves properties of interest is called a *back-and-forth* argument. We will see another example in Theorem 6.6.8.

**Theorem 5.4.6** *(Cantor) Any two countably infinite dense linear orderings without endpoints are isomorphic.*

*Proof.* Let \((A,<_{1})\) and \((Z,<_{2})\) be two countable infinite dense linear orderings without endpoints. Since \(A\) is countably infinite, we can list the elements of \(A\) without repetition as \(a_0,a_1,a_2,\ldots\). Similarly, we an list the elements of \(Z\) without repetition as \(z_0,z_1,z_2,\ldots\). We now define a sequence of *partial isomorphisms* \(h_k:A\to Z\), that is, each \(h_k\) will be a bijective function from some finite subset of \(A\) to some finite subset of \(Z\) that preserves the ordering. More formally, we will have the following for each \(k \in \mathbb{N}\):

- \(\operatorname{domain}(h_k)\) is a finite nonempty set.
- \(h_k\) is injective.
- For each \(\ell \in \mathbb{N}\), we have \(\{a_0,a_1,\ldots,a_\ell\} \subseteq \operatorname{domain}(h_{2\ell})\).
- For each \(\ell \in \mathbb{N}\), we have \(\{z_0,z_1,\ldots,z_\ell\} \subseteq \operatorname{range}(h_{2\ell+1})\).
- \(h_{k+1}\) extends the function \(h_k\), that is, whenever \(b \in \operatorname{domain}(h_k)\), we have \(b \in \operatorname{domain}(h_{k+1})\) and \(h_{k+1}(b)=h_k(b)\).
- Each \(h_k\) is a partial isomorphism, that is, for all \(b,c \in \operatorname{domain}(h_k)\), we have \(b<_{1}c\) if and only if \(h_k(b)<_{2}h_k(c)\).

We start by letting \(h_0\) be the function with domain \(\{a_0\}\) where \(h_0(a_0)=z_0\), and then we let \(h_1=h_0\) (since \(z_0\) is already in \(\operatorname{range}(h_0)\)). Suppose that \(k \in \mathbb{N}^+\) and we have defined \(h_k\). We have two cases:

- *Case 1:* Suppose that \(k\) is odd, and fix \(\ell \in \mathbb{N}\) with \(k=2\ell-1\). If \(a_\ell \in \operatorname{domain}(h_k)\), let \(h_{k+1}=h_k\). Suppose then that \(a_\ell \notin \operatorname{domain}(h_k)\). Notice that \(A_0=\operatorname{domain}(h_k)\cup\{a_\ell\}\) is a finite nonempty subset of \(A\), so when we restrict \(<_{1}\) to this finite set, we obtain a finite linear ordering. Similarly, we have that \(Z_0=\operatorname{range}(h_k)\) is a finite nonempty subset of \(Z\), so when we restrict \(<_{2}\) to this finite set, we obtain a finite linear ordering.

  - *Subcase 1:* Suppose \(a_\ell\) is the least element of the finite linear ordering \(A_0\). Since \(Z_0\) is a finite linear ordering, it has a least element, say \(w\). Since \(Z\) does not have a least element, we can fix \(y \in Z\) with \(y<_{2}w\). We now extend \(h_k\) to \(h_{k+1}\) by letting \(h_{k+1}(a_\ell)=y\).

  - *Subcase 2:* Suppose \(a_\ell\) is the greatest element of the finite linear ordering \(A\). Since \(Z_0\) is a finite linear ordering, it has a greatest element, say \(w\). Since \(Z\) does not have a greatest element, we can fix \(y \in B\) with \(w<_{2}y\). We now extend \(h_k\) to \(h_{k+1}\) by letting \(h_{k+1}(a_\ell)=y\).

  - *Subcase 3:* Otherwise, \(a_\ell\) has an immediate predecessor \(b\) and immediate successor \(c\) in the finite linear ordering \(A_0\). Since \(b<_{1}c\), we have \(h_k(b)<_{2}h_k(c)\). As \(Z\) is dense, we can fix \(y \in Z\) with \(h_k(c)<_{2}y<_{2}h_k(d)\). We now extend \(h_k\) to \(h_{k+1}\) by letting \(h_{k+1}(a_\ell)=y\).

- *Case 2:* Suppose that \(k\) is even, and fix \(\ell \in \mathbb{N}\) with \(k=2\ell\). If \(z_\ell \in \operatorname{range}(h_k)\), let \(h_{k+1}=h_k\). Suppose then that \(b_\ell \notin \operatorname{range}(h_k)\). Notice that \(A_0=\operatorname{domain}(h_k)\) is a finite nonempty subset of \(A\), so when we restrict \(<_{1}\) to this finite set, we obtain a finite linear ordering. Similarly, we have that \(Z_0=\operatorname{range}(h_k)\cup\{z_\ell\}\) is a finite nonempty subset of \(Z\), so when we restrict \(<_{2}\) to this finite set, we obtain a finite linear ordering.

  - *Subcase 1:* Suppose \(z_\ell\) is the least element of the finite linear ordering \(Z_0\). Since \(A_0\) is a finite linear ordering, it has a least element, say \(c\). Since \(A\) does not have a least element, we can fix \(b \in A\) with \(b<_{1}c\). We now extend \(h_k\) to \(h_{k+1}\) by letting \(h_{k+1}(b)=z_\ell\).

  - *Subcase 2:* Suppose \(z_\ell\) is the greatest element of the finite linear ordering \(Z_0\). Since \(A_0\) is a finite linear ordering, it has a greatest element, say \(c\). Since \(A\) does not have a greatest element, we can fix \(b \in A\) with \(c<_{1}b\). We now extend \(h_k\) to \(h_{k+1}\) by letting \(h_{k+1}(b)=z_\ell\).

  - *Subcase 3:* Otherwise, \(z_\ell\) has an immediate predecessor \(w\) and immediate successor \(y\) in the finite linear ordering \(Z_0\). Fix \(b,c \in A_0\) with \(h_k(b)=w\) and \(h_k(c)=y\). Since \(w<_{2}y\), we have \(b<_{1}c\). As \(A\) is dense, we can fix \(d \in A\) with \(b<_{1}d<_{1}c\). We now extend \(h_k\) to \(h_{k+1}\) by letting \(h_{k+1}(d)=z_\ell\).

It is straightforward to check that if \(h_k\) satisfies all of the above conditions, then \(h_{k+1}\) also satisfies all of the necessary conditions, regardless of which subcase we take.

Define \(h:A\to Z\) by letting \(h(a_\ell)=h_{2\ell}(a_\ell)\) for each \(\ell \in \mathbb{N}\). Using the second through fifth conditions on the \(h_k\), we conclude that \(h\) is a bijection. Now let \(b,c \in A\) be arbitrary. Fix \(k,\ell \in \mathbb{N}\) with \(b=a_k\) and \(c=a_\ell\). Let \(m=\max\{k,\ell\}\). Since \(b,c \in \operatorname{domain}(h_{2m})\), we have \(b<_{1}c\) if and only if \(h_{2m}(b)<_{2}h_{2m}(c)\), which by the fifth condition on the \(h_k\) is if and only if \(h(b)<_{2}h(c)\). Therefore, \(h\) is an isomorphism. \(\square\)
