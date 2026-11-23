export function enableFormationDrag<T>(
  source: HTMLElement,
  read: () => T | undefined,
  icon: (item: T) => HTMLElement,
  targetAt: (item: T, x: number, y: number) => HTMLElement | undefined,
  drop: (item: T, target: HTMLElement) => void,
) {
  let active: { id: number; x: number; y: number; item: T } | undefined
  let ghost: HTMLElement | undefined
  let target: HTMLElement | undefined
  let suppressClick = false

  function clear() {
    active = undefined
    ghost?.remove()
    ghost = undefined
    target?.classList.remove('drop-target')
    target = undefined
    source.classList.remove('drag-source')
  }

  source.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return
    suppressClick = false
    const item = read()
    if (item === undefined) return
    active = { id: event.pointerId, x: event.clientX, y: event.clientY, item }
    source.setPointerCapture(event.pointerId)
  })
  source.addEventListener('pointermove', event => {
    if (active?.id !== event.pointerId) return
    const { item, x, y } = active
    if (!ghost) {
      if (Math.hypot(event.clientX - x, event.clientY - y) < 6) return
      suppressClick = true
      ghost = icon(item)
      ghost.classList.add('drag-icon')
      document.body.append(ghost)
      source.classList.add('drag-source')
    }
    ghost.style.left = `${event.clientX}px`
    ghost.style.top = `${event.clientY}px`
    target?.classList.remove('drop-target')
    target = targetAt(item, event.clientX, event.clientY)
    target?.classList.add('drop-target')
  })
  source.addEventListener('pointerup', event => {
    if (active?.id !== event.pointerId) return
    const { item } = active
    const destination = ghost && targetAt(item, event.clientX, event.clientY)
    clear()
    if (destination) drop(item, destination)
  })
  source.addEventListener('pointercancel', clear)
  source.addEventListener('lostpointercapture', clear)
  source.addEventListener('click', event => {
    if (!suppressClick || !event.detail) return
    event.stopImmediatePropagation()
    suppressClick = false
  }, true)
}
