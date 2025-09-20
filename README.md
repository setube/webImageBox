# WebImageBox

_AKA 通用网页图片灯箱 — 让你的网页图片瞬间炫酷起来_

[![GitHub stars](https://img.shields.io/github/stars/setube/WebImageBox?style=social)](https://github.com/setube/WebImageBox/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/setube/WebImageBox?style=social)](https://github.com/setube/WebImageBox/network/members)
[![License](https://img.shields.io/github/license/setube/WebImageBox)](https://github.com/setube/WebImageBox/blob/main/LICENSE)
[![Issues](https://img.shields.io/github/issues/setube/WebImageBox)](https://github.com/setube/WebImageBox/issues)

---

## 简介

你是不是也遇到过这种情况？

- 浏览网页，想看大图，可是图片小得像蚂蚁？
- 想旋转看看，却发现网页压根没提供这个功能？
- 下载图片？单张还好，批量下载？笑话吧…

别担心，**WebImageBox**来了！

> 它是一款通用、强大、且自带幽默感的网页图片灯箱插件。  
> 支持旋转、缩放、拖拽、切换、单张下载、批量下载……就差帮你泡杯咖啡了。

---

## 插件预览

![桌面端预览](https://github.com/setube/webImageBox/raw/main/image_1.png)
![移动端预览](https://github.com/setube/webImageBox/raw/main/image_2.png)

## 功能亮点

- **旋转任性**：左旋右旋，90° 180° 360°，只要你想，没有它不敢转的角度
- **缩放随心**：拖拽、滚轮、双击，放大缩小随意，不用担心眼睛近视
- **切换顺滑**：前后图片切换丝滑得像滑板鞋上的轮子
- **下载无压力**：单张下载或批量打包成 ZIP，保证你一次性拿够
- **缩略图预览**：不想迷路？看缩略图，点哪看哪
- **浏览器友好**：CSP？我不怕，我自带忍者技能

---

## 环境需求

- **网页必须有 `<img>` 标签**（WebImageBox 不会帮你画图画）
- **CSP 封闭网站**：部分严格网站可能无法直接下载图片，需要开启 CORS 或在控制台允许脚本

---

## 浏览器需求

- **现代浏览器**：Chrome / Edge / Firefox / Safari（基本覆盖主流）
- **扩展支持**：Tampermonkey / Violentmonkey / Greasemonkey
- **JavaScript 必须启用**（WebImageBox 不会在你关掉 JS 时自动变魔术）

---

## 安装方式

1. 安装 **Tampermonkey** / **Violentmonkey** / **Greasemonkey**
2. 新建脚本，把 `WebImageBox.user.js` 贴进去
3. 打开任意网页，看到图片？点它！灯箱立刻出现

---

## 使用教程

1. **打开图片灯箱**  
   点击网页上的任意图片 → **灯箱开启**

2. **缩放图片**

   - 右上角按钮 → 放大/缩小
   - 滚轮向上/向下 → 放大/缩小
   - 双击图片 → 放大

3. **拖拽图片**

   - 空格+鼠标左键 → 拖动图片位置

4. **旋转图片**

   - 右上角按钮 → 左旋 / 右旋

5. **切换图片**

   - 左右箭头按钮 → 前一张 / 下一张
   - 键盘 ← / → → 前一张 / 下一张

6. **下载图片**

   - 单张下载 → 右上角下载按钮
   - 批量下载 → 右上角 “下载所有” 按钮（会打包成 ZIP）

7. **关闭灯箱**
   - 右上角关闭按钮
   - 点击遮罩背景
   - ESC 键

---

## 项目愿景

未来，WebImageBox 想做到的事情很简单：  
“让全网的图片都乖乖听你的指挥”，甚至有一天…能帮你自动分类收藏。

---

## 鸣谢

- [fflate](https://github.com/101arrowz/fflate) —— 感谢帮我们把图片高效地打包成 ZIP，性能比 JSZip 更快  
- [Qmsg](https://github.com/WhiteSevs/Qmsg) —— 感谢帮我们提供优雅的消息提示组件，让交互更友好  
- [Tampermonkey](https://www.tampermonkey.net) —— 感谢油猴脚本运行环境，让我们能突破浏览器的限制

- 感谢全世界爱看图、爱折腾的你们 ❤️
