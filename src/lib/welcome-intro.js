(() => {
    const intro = document.getElementById('welcome-intro')
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    try {
      if (motion.matches || sessionStorage.getItem('kashaf:intro-seen')) return
      sessionStorage.setItem('kashaf:intro-seen', '1')
    } catch {
      return // Blocked storage: don't replay an introduction on every navigation.
    }
    intro.showModal()
    const finish = () => intro.close()
    const timer = setTimeout(finish, 3200)
    intro.querySelector('button').addEventListener('click', finish)
    intro.addEventListener('close', () => {
      clearTimeout(timer)
      motion.removeEventListener('change', finish)
      removeEventListener('pagehide', finish)
    }, { once: true })
    motion.addEventListener('change', finish)
    addEventListener('pagehide', finish, { once: true })
  })()
