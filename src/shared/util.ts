export function trimSearch(search: string) {
  if (search) {
    return search.split('|')
      .map((orTerm) => orTerm.trim().split(' ')
        .map((andTerm) => andTerm.trim())
        .filter((andTerm) => andTerm)
        .join(' '))
      .filter((orTerm) => orTerm)
      .join('|');
  }
  return search;
}
