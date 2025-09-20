// ==UserScript==
// @name         通用网页图片灯箱(WebImageBox)
// @author       setube
// @namespace    https://github.com/setube/webImageBox
// @version      1.3
// @description  通用网页图片灯箱：旋转、缩放、切换、单张/批量下载，让你看图不再受限（甚至可能加咖啡按钮）
// @match        *://*/*
// @require      https://registry.npmmirror.com/jszip/3.10.1/files/dist/jszip.min.js
// @grant        none
// ==/UserScript==

;(function () {
  'use strict'

  // 内联 CSS
  const style = document.createElement('style')
  style.textContent = `
  #myLightboxOverlay {
    position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);
    display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:99999;
    overflow:hidden;
  }
  .lb-main-container { position:relative; width:90%; height:70%; overflow:hidden; display:flex; justify-content:center; align-items:center; }
  .lb-main { max-width:100%; max-height:100%; position:absolute; }
  .lb-buttons { position:absolute; top:20px; right:20px; display:flex; gap:8px; z-index:100001; }
  .lb-buttons button { background: rgba(0,0,0,0.5); color:#fff; border:none; padding:6px 10px; cursor:pointer; border-radius:4px; }
  .lb-nav-button, .lb-buttons button {
    background: rgba(0,0,0,0.6); color: #fff; border: none; width: 34px; height: 34px; display: flex;
    justify-content: center; align-items: center; cursor: pointer; border-radius: 50%; transition: background 0.3s, transform 0.2s;
  }
  .lb-nav-button:hover, .lb-buttons button:hover { background: rgba(255,255,255,0.2); }
  button svg { pointer-events: none; }
  .lb-prev { position: fixed; left:20px; top:50%; transform:translateY(-50%); }
  .lb-next { position: fixed; right:20px; top:50%; transform:translateY(-50%); }
  .lb-thumbs { display:flex; gap:5px; margin-top:10px; overflow-x:auto; max-width:90%; }
  .lb-thumbs::-webkit-scrollbar { display: none; }
  .lb-thumbs img { height:60px; cursor:pointer; opacity:0.5; transition:0.3s; flex-shrink:0; }
  .lb-thumbs img.active { opacity:1; border:2px solid #fff; }
  @media (max-width: 768px) {
    .lb-nav-button:hover, .lb-buttons button:hover { background: rgba(0,0,0,0.6); }
  }
  `
  document.head.appendChild(style)

  // 创建遮罩和主图片容器
  const overlay = document.createElement('div')
  overlay.id = 'myLightboxOverlay'
  overlay.style.display = 'none'

  const mainContainer = document.createElement('div')
  mainContainer.className = 'lb-main-container'

  const lbImg = document.createElement('img')
  lbImg.className = 'lb-main'
  mainContainer.appendChild(lbImg)
  overlay.appendChild(mainContainer)

  // 控制按钮（右上角）
  const controls = document.createElement('div')
  controls.className = 'lb-buttons'

  const btnConfig = [
    { title: '左旋转', svg: '<path d="M12 2v2a8 8 0 1 0 8 8h-2a6 6 0 1 1-6-6V2z"/>' },
    { title: '右旋转', svg: '<path d="M12 2v2a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z"/>' },
    { title: '放大', svg: '<path d="M15 11h-4V7h-2v4H5v2h4v4h2v-4h4z"/>' },
    { title: '缩小', svg: '<path d="M5 11v2h10v-2z"/>' },
    { title: '下载', svg: '<path d="M12 16l4-5h-3V4h-2v7H8z"/><path d="M5 18h14v2H5z"/>' },
    {
      title: '下载所有',
      svg: '<path d="M3 4a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H7l-4-4V4z"/><path d="M12 12v6m0 0l-3-3m3 3l3-3"/>'
    },
    { title: '关闭', svg: '<path d="M6 6l12 12M6 18L18 6"/>' }
  ]

  btnConfig.forEach(cfg => {
    const btn = document.createElement('button')
    btn.title = cfg.title
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" 
    fill="none" viewBox="0 0 24 24" 
    stroke="currentColor" stroke-width="2" 
    width="20" height="20">${cfg.svg}</svg>`
    controls.appendChild(btn)
  })
  overlay.appendChild(controls)

  // 左右切换按钮
  const prevBtn = document.createElement('button')
  prevBtn.className = 'lb-prev lb-nav-button'
  prevBtn.title = '上一张'
  prevBtn.setAttribute('aria-label', '上一张')
  prevBtn.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" 
    fill="none" viewBox="0 0 24 24" 
    stroke="currentColor" stroke-width="2" 
    width="20" height="20">
    <path d="M15 18L9 12l6-6"></path>
  </svg>`

  const nextBtn = document.createElement('button')
  nextBtn.className = 'lb-next lb-nav-button'
  nextBtn.title = '下一张'
  nextBtn.setAttribute('aria-label', '下一张')
  nextBtn.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" 
    fill="none" viewBox="0 0 24 24" 
    stroke="currentColor" stroke-width="2" 
    width="20" height="20">
    <path d="M9 6l6 6-6 6"></path>
  </svg>`

  overlay.appendChild(prevBtn)
  overlay.appendChild(nextBtn)

  // 缩略图列表
  const thumbBar = document.createElement('div')
  thumbBar.className = 'lb-thumbs'
  overlay.appendChild(thumbBar)

  document.body.appendChild(overlay)

  // 图片数组
  let imgs = []
  let currentIndex = 0
  let rotation = 0
  let scale = 1
  const imgStates = new Map() // key: 图片 src, value: { rotation, scale }

  // 图片切换动画参数
  let isAnimating = false

  const updateTransform = () => {
    lbImg.style.transform = `rotate(${rotation}deg) scale(${scale})`
  }

  // 缩略图居中
  const updateThumbs = () => {
    thumbBar.innerHTML = ''
    imgs.forEach((img, i) => {
      const thumb = document.createElement('img')
      thumb.src = img.src
      if (i === currentIndex) thumb.classList.add('active')
      thumb.addEventListener('click', () => showImage(i))
      thumbBar.appendChild(thumb)
    })

    // 缩略图滚动条，让当前图片居中
    const activeThumb = thumbBar.querySelector('img.active')
    if (activeThumb) {
      const offset = activeThumb.offsetLeft + activeThumb.offsetWidth / 2 - thumbBar.clientWidth / 2
      thumbBar.scrollTo({ left: offset, behavior: 'smooth' })
    }
  }

  // 打开灯箱
  const showImage = (index, direction = 0) => {
    if (imgs.length === 0 || isAnimating) return
    currentIndex = (index + imgs.length) % imgs.length
    // 获取该图片的状态，如果没有则初始化
    const state = imgStates.get(imgs[currentIndex].src) || { rotation: 0, scale: 1 }
    rotation = state.rotation
    scale = state.scale

    isAnimating = true
    const newSrc = imgs[currentIndex].src
    if (lbImg.src) {
      const tempImg = document.createElement('img')
      tempImg.src = newSrc
      tempImg.style.position = 'absolute'
      tempImg.style.maxWidth = '100%'
      tempImg.style.maxHeight = '100%'
      tempImg.style.left = direction >= 0 ? '100%' : '-100%'
      tempImg.style.top = 'auto'
      mainContainer.appendChild(tempImg)

      setTimeout(() => {
        tempImg.style.left = 'auto'
        lbImg.style.left = direction >= 0 ? '-100%' : '100%'
      }, 50)

      setTimeout(() => {
        lbImg.src = newSrc
        lbImg.style.left = 'auto'
        mainContainer.removeChild(tempImg)
        updateTransform()
        overlay.style.display = 'flex'
        updateThumbs()
        isAnimating = false
      }, 50)
    } else {
      lbImg.src = newSrc
      overlay.style.display = 'flex'
      updateThumbs()
      isAnimating = false
    }
  }

  // 设置图片，过滤重复（按 URL 或文件名）
  const setupImages = () => {
    const pageImgs = Array.from(document.querySelectorAll('img'))
    const uniqueSrc = new Set()
    const uniqueName = new Set()
    imgs = []

    pageImgs.forEach(img => {
      // 跳过灯箱内部的缩略图和主图
      if (img.closest('#myLightboxOverlay')) return
      const fileName = img.src.split('/').pop()
      if (!uniqueSrc.has(img.src) && !uniqueName.has(fileName)) {
        uniqueSrc.add(img.src)
        uniqueName.add(fileName)
        imgs.push(img)

        // 避免重复绑定
        if (!img.dataset.lb) {
          img.dataset.lb = 'true'
          img.style.cursor = 'zoom-in'

          // 绑定点击事件，打开灯箱
          img.addEventListener('click', e => {
            e.preventDefault()
            e.stopPropagation()
            const index = imgs.indexOf(img)
            openLightbox(index) // 调用 openLightbox
          })
        }
      }
    })
  }

  const openLightbox = index => {
    if (imgs.length === 0) return
    currentIndex = index
    rotation = 0
    scale = 1

    // 显示 overlay，初始化透明度和缩放
    overlay.style.display = 'flex'
    overlay.style.opacity = '0'
    lbImg.style.opacity = '0'
    lbImg.src = imgs[currentIndex].src

    // 强制浏览器渲染
    requestAnimationFrame(() => {
      overlay.style.transition = 'opacity 0.35s'
      overlay.style.opacity = '1'
      lbImg.style.transition = 'transform 0.35s, opacity 0.35s'
      lbImg.style.opacity = '1'
      overlay.style.transition = ''
      lbImg.style.transition = ''
    })

    updateThumbs()
    lockBodyScroll()
  }

  const closeLightbox = () => {
    // 淡出动画
    overlay.style.opacity = '0'
    lbImg.style.opacity = '0'
    setTimeout(() => {
      overlay.style.display = 'none'
      // 重置样式，确保下一次打开动画生效
      lbImg.style.transition = ''
      lbImg.style.opacity = '0'
    }, 350)
    unlockBodyScroll()
  }

  const lockBodyScroll = () => {
    // 保存当前滚动位置
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.dataset.scrollY = scrollY // 保存 scrollY 方便解锁
  }

  const unlockBodyScroll = () => {
    const scrollY = document.body.dataset.scrollY || 0
    document.body.style.position = ''
    document.body.style.top = ''
    window.scrollTo(0, scrollY)
  }

  const observer = new MutationObserver(setupImages)
  observer.observe(document.body, { childList: true, subtree: true })
  setupImages()

  // 控制按钮事件
  const [rotateL, rotateR, zoomIn, zoomOut, download, downloadAll, closeBtn] = controls.querySelectorAll('button')
  // 左旋转按钮
  rotateL.addEventListener('click', () => {
    rotation -= 90
    imgStates.set(lbImg.src, { rotation, scale })
    updateTransform()
  })
  // 右旋转按钮
  rotateR.addEventListener('click', () => {
    rotation += 90
    imgStates.set(lbImg.src, { rotation, scale })
    updateTransform()
  })
  // 放大按钮
  zoomIn.addEventListener('click', () => {
    scale *= 1.2
    imgStates.set(lbImg.src, { rotation, scale })
    updateTransform()
  })
  // 缩小按钮
  zoomOut.addEventListener('click', () => {
    scale /= 1.2
    imgStates.set(lbImg.src, { rotation, scale })
    updateTransform()
  })
  // 关闭按钮
  closeBtn.addEventListener('click', closeLightbox)
  // 单张下载
  download.addEventListener('click', async () => {
    try {
      let blob, filename
      const src = lbImg.src

      if (src.startsWith('data:')) {
        const [header, data] = src.split(',')
        const mimeMatch = header.match(/:(.*?)(;|$)/)
        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream'

        if (header.includes('base64')) {
          // base64 解码
          const bstr = atob(data)
          const n = bstr.length
          const u8arr = new Uint8Array(n)
          for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i)
          blob = new Blob([u8arr], { type: mime })
        } else {
          // URI 编码解码（如 SVG）
          blob = new Blob([decodeURIComponent(data)], { type: mime })
        }

        // 自动扩展名
        let ext = 'png'
        if (mime === 'image/png') ext = 'png'
        else if (mime === 'image/jpeg') ext = 'jpg'
        else if (mime === 'image/svg+xml') ext = 'svg'
        else if (mime.includes('/')) ext = mime.split('/')[1]
        filename = `image.${ext}`
      } else if (src.startsWith('blob:')) {
        const res = await fetch(src)
        blob = await res.blob()
        const mime = blob.type || 'image/png'
        let ext = mime.includes('/') ? mime.split('/')[1] : 'png'
        filename = `image.${ext}`
      } else {
        const cleanUrl = src.split('?')[0]
        try {
          const res = await fetch(cleanUrl, { mode: 'cors' })
          blob = await res.blob()
          const mime = blob.type || 'image/png'
          let ext = mime.includes('/') ? mime.split('/')[1] : 'png'
          filename = cleanUrl.split('/').pop() || `image.${ext}`
        } catch (err) {
          alert('无法下载 URL:' + cleanUrl)
          console.error('无法下载 URL:', cleanUrl, err)
          return // 直接退出，不触发下载
        }
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('下载失败')
      console.error('下载失败', err)
    }
  })

  const cleanImageUrl = url => {
    // 去掉 ? 参数
    let cleanUrl = url.split('?')[0]
    // 去掉最后文件名里的冒号后缀
    // 例如 media/G1DCi9XagAA7-1R.jpg:thumb -> media/G1DCi9XagAA7-1R.jpg
    cleanUrl = cleanUrl.replace(/\/([^\/]+):[^\/]+$/, '/$1')
    return cleanUrl
  }

  // 下载相册
  downloadAll.addEventListener('click', async () => {
    if (!window.JSZip) {
      alert('JSZip未加载，请稍等')
      return
    }
    const zip = new JSZip()
    const folder = zip.folder('album')

    let dataUrlCount = 1

    for (let img of imgs) {
      try {
        let blob, filename
        const src = img.src

        if (src.startsWith('data:')) {
          const [header, data] = src.split(',')
          const mimeMatch = header.match(/:(.*?)(;|$)/)
          const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream'

          if (header.includes('base64')) {
            const bstr = atob(data)
            const n = bstr.length
            const u8arr = new Uint8Array(n)
            for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i)
            blob = new Blob([u8arr], { type: mime })
          } else {
            blob = new Blob([decodeURIComponent(data)], { type: mime })
          }

          let ext = mime.split('/')[1] || 'bin'
          if (mime === 'image/svg+xml') ext = 'svg'

          filename = `image_${dataUrlCount}.${ext}`
          dataUrlCount++
        } else if (src.startsWith('blob:')) {
          const res = await fetch(src)
          blob = await res.blob()
          const mime = blob.type || 'image/png'
          let ext = mime.split('/')[1] || 'png'
          if (mime === 'image/svg+xml') ext = 'svg'
          filename = `image_${dataUrlCount}.${ext}`
          dataUrlCount++
        } else {
          const cleanUrl = cleanImageUrl(src)
          try {
            const res = await fetch(cleanUrl, { mode: 'cors' })
            blob = await res.blob()
            const mime = blob.type || 'image/png'
            let ext = mime.split('/')[1] || 'png'
            if (mime === 'image/svg+xml') ext = 'svg'

            const baseName = cleanUrl.split('/').pop()
            if (baseName.includes('.')) filename = baseName
            else filename = `image_${dataUrlCount}.${ext}`
            dataUrlCount++
          } catch (err) {
            console.warn('无法下载 URL:', cleanUrl, err)
            continue
          }
        }

        folder.file(filename, blob)
      } catch (err) {
        console.warn('下载失败:', img.src, err)
        continue
      }
    }

    const content = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(content)
    const a = document.createElement('a')
    a.href = url
    a.download = 'album.zip'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  })

  // 左右切换
  prevBtn.addEventListener('click', () => showImage(currentIndex - 1, -1))
  nextBtn.addEventListener('click', () => showImage(currentIndex + 1, 1))

  // 点击背景或 ESC 关闭
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeLightbox()
  })
  window.addEventListener('keydown', e => {
    // 灯箱没打开就不处理
    if (overlay.style.display !== 'flex') return
    if (e.key === 'Escape') closeLightbox()
    else if (e.key === 'ArrowLeft') showImage(currentIndex - 1, -1)
    else if (e.key === 'ArrowRight') showImage(currentIndex + 1, 1)
  })
  // 滚轮缩放
  window.addEventListener(
    'wheel',
    e => {
      // 只有灯箱打开时才缩放
      if (overlay.style.display === 'flex') {
        e.preventDefault() // 阻止页面滚动
        const delta = e.deltaY || e.detail || e.wheelDelta
        if (delta < 0) {
          scale *= 1.1 // 放大
        } else {
          scale /= 1.1 // 缩小
        }
        updateTransform()
      }
    },
    { passive: false }
  )

  // 双击图片放大 / 恢复
  lbImg.addEventListener('dblclick', () => {
    if (scale === 1) {
      scale = 2 // 双击放大
    } else {
      scale = 1 // 再次双击恢复
    }
    updateTransform()
  })
})()
