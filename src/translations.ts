const TEXT_MAP: Record<string, string> = {
  // Header & Brand
  'Total Wireless — eSIM Quick Access': 'Total Wireless — eSIM 快速安装工具',
  'Total Wireless — eSIM Activation': 'Total Wireless — eSIM 激活',
  'Verizon 5G Network': 'Verizon 5G 网络支持',
  'TOTAL WIRELESS / QUICK ACCESS': 'TOTAL WIRELESS / 快速装卡工具',
  'TOTAL WIRELESS · AUTHORIZED RETAILER': 'TOTAL WIRELESS · 官方授权门店',
  'Total Wireless — Flushing': 'Total Wireless — 法拉盛授权店',
  '136-20 Roosevelt Ave Suite 119, Flushing, NY 11354': '136-20 Roosevelt Ave Suite 119, Flushing, NY 11354',
  'Call (347) 788-3838': '致电 (347) 788-3838',
  'Get Directions ↗': '导航到店 ↗',
  'Skip to content': '跳至主要内容',

  // Scanner Page (/)
  'eSIM Quick Access': 'eSIM 扫码生成工具',
  'Scan or enter an LPA QR code to generate a one-tap Total Wireless eSIM setup link.':
    '扫描或输入 eSIM LPA 二维码，生成 Total Wireless 一键激活链接与二维码。',
  'Scan LPA Code': '扫描 eSIM 二维码',
  'Point camera at an eSIM QR code or tap Start Camera.': '点击“打开相机”，对准 eSIM 二维码即可自动识别。',
  'Starting camera…': '正在打开相机…',
  'Camera active. Point at eSIM QR code.': '相机已开启，请对准 eSIM 二维码。',
  'QR code scanned — camera paused. Clear / Reset to scan again.':
    '已扫出二维码 — 相机已暂停，点“清空 / 重置”或刷新可继续扫。',
  'Camera unavailable. You can upload an image or enter manually below.':
    '无法打开相机，请上传二维码图片或在下方手动输入。',
  'Start Camera': '打开相机',
  'Stop Camera': '关闭相机',
  'Retry Camera': '重新打开相机',
  'Upload QR Image': '上传二维码图片',
  'Screen Cutout': '截屏识码',
  'Clear / Reset': '清空 / 重置',
  'or enter manually': '或者手动填写',
  'SM-DP+ Address': 'SM-DP+ 服务器地址',
  'e.g. sm-v4-004-a-gtm.pr.go-esim.com or paste full LPA:1$...':
    '例如 sm-v4-004-a-gtm.pr.go-esim.com 或直接粘贴完整 LPA:1$...',
  'Activation Code': '激活码',
  'e.g. G0LFC-8Z7IK-HYBGV-6CLG1': '例如 G0LFC-8Z7IK-HYBGV-6CLG1',
  'Confirmation Code (optional)': '确认码（选填）',
  'e.g. 1234': '例如 1234',
  'Phone Number (optional)': '手机号码（选填，将显示在激活页）',
  'e.g. (347) 788-3838': '例如 (347) 788-3838',
  'Generate Quick Link ↗': '生成激活链接 ↗',
  'Generated eSIM Link': '已生成 eSIM 激活链接',
  'Verified eSIM Profile': '已验证 eSIM 配置信息',
  'SM-DP+ Server': 'SM-DP+ 服务器',
  'Confirmation Code': '确认码',
  'Phone Number': '手机号码',
  'Quick Activation Link': '一键激活链接',
  'Copy Link': '复制链接',
  'Open Preview ↗': '打开预览 ↗',
  'Share to WeChat': '发到微信',
  'iOS Quick Link': 'iOS 一键激活码',
  'Direct LPA (Android / Camera)': '原始 LPA 码（安卓 / 设置直扫）',
  'Scan from iPhone camera to open Total Wireless activation page:':
    '使用 iPhone 相机扫码即可打开 Total Wireless 一键激活页面：',
  'Scan from Android eSIM settings or camera:': '使用安卓手机或系统“添加 eSIM”直接扫描此二维码：',
  'Copy QR Image': '复制二维码图片',
  'How to activate': '如何激活',
  'iOS 17.4+ quick link: copy or share the Quick Activation Link, or scan the iOS Quick Link QR code with the iPhone camera.':
    'iOS 17.4+ 一键安装：复制激活链接发给顾客，或用 iPhone 相机直接扫描上方二维码。',
  'Android or another phone: switch QR Mode to Direct LPA and scan from system eSIM settings.':
    '安卓或其他手机：切换到“原始 LPA 码”，在手机设置 → 添加 eSIM 中扫码安装。',
  'Scan Another Code': '再扫一张 eSIM',
  'Please enter both SM-DP+ Address and Activation Code.': '请填写 SM-DP+ 地址和激活码。',
  'Please enter valid SM-DP+ Address and Activation Code without spaces or $ characters.':
    '请输入有效的 SM-DP+ 地址和激活码（不能包含空格或 $ 符号）。',
  'Could not read a QR code from this image. Please ensure the code is clear and well-lit.':
    '未能从图片中识别出二维码，请确保二维码清晰完整。',
  'Failed to copy to clipboard.': '复制失败，请手动长按复制。',
  'Link copied to clipboard.': '激活链接已复制！',
  'Link copied. Open WeChat to paste and share.': '链接已复制，请打开微信粘贴发送。',
  'QR image copied to clipboard.': '二维码图片已复制到剪贴板。',
  'QR image downloaded.': '二维码图片已下载。',
  'Failed to copy QR image.': '复制二维码图片失败。',

  // Activation Page (/activate & /redirect)
  'Opened in WeChat? Tap ··· at top-right and choose Open in Safari.':
    '在微信中打开？请点击右上角 ··· 选择“在 Safari 中打开”。',
  'Ready to Install': '可以安装',
  'Link Unavailable': '链接不可用',
  'eSIM Activation': 'eSIM 激活',
  'Assigned Number': '手机号码',
  'Copy': '复制',
  'Copied': '已复制',
  'Copy phone number': '复制手机号码',
  'Phone number copied.': '手机号码已复制。',
  'Click to Activate': '点击激活',
  'Invalid or unsupported activation link. Ask the store for a fresh link.':
    '此激活链接无效或已过期，请联系门店获取最新激活链接。',
  'Activation Walkthrough': '激活步骤',
  'Activation steps': '激活步骤',
  'Pause': '暂停',
  'Play': '播放',
  'Allow': '允许',
  'Don’t Allow': '不允许',
  'Done': '完成',
  'Cancel': '取消',
  'Continue': '继续',
  'Activate New eSIM': '激活新 eSIM',
  'Allow this if you requested a new eSIM from your carrier.': '如果你已向运营商请求新 eSIM，请允许此操作。',
  'Activate eSIM': '激活 eSIM',
  'An eSIM is ready to be activated on this iPhone.': 'eSIM 已准备好在此 iPhone 上激活。',
  'Connecting to Network…': '正在连接网络…',
  'Cellular Setup Complete': '蜂窝网络设置完成',
  'Your eSIM is now active and ready to use.': '你的 eSIM 现已激活并可供使用。',
  'Tap “Click to Activate”': '点击上方“点击激活”',
  'Tap “Allow”': '弹窗点击“允许”',
  'Tap “Continue”': '点击“继续”并等待',
  'Tap “Done”': '出现信号后点“完成”',
  'Keep Wi-Fi connected during setup (~1 min).': '安装期间请保持连接 Wi-Fi（约 1 分钟）。'
};

export function translate(input: string): string {
  const lead = input.match(/^\s*/)?.[0] ?? '';
  const tail = input.match(/\s*$/)?.[0] ?? '';
  const core = input.trim().replace(/\s+/g, ' ');
  if (!core) return input;
  const hit = TEXT_MAP[core];
  return hit ? `${lead}${hit}${tail}` : input;
}
