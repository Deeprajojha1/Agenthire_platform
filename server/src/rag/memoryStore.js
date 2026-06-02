const documents = [];

export async function upsertDocument(doc) {
  documents.push(doc);
  return { stored: true, backend: "memory" };
}

export async function searchDocuments(query, policy) {
  const terms = query.toLowerCase().split(/\W+/).filter(Boolean);
  return documents
    .map((doc) => {
      const text = JSON.stringify(doc).toLowerCase();
      const hits = terms.filter((term) => text.includes(term)).length;
      return { ...doc, score: terms.length ? hits / terms.length : 0 };
    })
    .filter((doc) => doc.score >= policy.minimum_similarity)
    .slice(0, policy.top_k);
}
