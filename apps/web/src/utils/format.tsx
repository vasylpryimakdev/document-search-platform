export function renderHighlight(highlight: string) {
  return highlight.split(/(<em>|<\/em>)/).map((part, index, parts) => {
    if (part === '<em>' || part === '</em>') {
      return null
    }

    const isHighlighted = parts[index - 1] === '<em>' && parts[index + 1] === '</em>'

    return isHighlighted ? <mark key={index}>{part}</mark> : part
  })
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
