const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = process.env.PORT || 10001;
const BUILD_DIR = path.join(__dirname, 'dist', 'h5');

console.log('🚀 社区互助小程序预览服务器启动中...');
console.log('📁 构建目录:', BUILD_DIR);

function checkBuild() {
  if (!fs.existsSync(BUILD_DIR)) {
    console.log('⚠️  未找到构建目录，正在尝试构建...');
    try {
      console.log('🔨 正在执行 H5 构建...');
      execSync('npm run build:h5', { stdio: 'inherit', cwd: __dirname });
      console.log('✅ 构建完成！');
    } catch (error) {
      console.error('❌ 构建失败:', error.message);
      console.log('💡 请确保依赖已安装完成: npm install --legacy-peer-deps');
      return false;
    }
  }
  return true;
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'application/font-woff',
  '.woff2': 'application/font-woff2',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(BUILD_DIR, req.url === '/' ? 'index.html' : req.url);
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        fs.readFile(path.join(BUILD_DIR, 'index.html'), (err, htmlContent) => {
          if (err) {
            res.writeHead(500);
            res.end('Server Error: ' + err.code);
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(htmlContent, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

if (checkBuild()) {
  server.listen(PORT, () => {
    console.log('\n🎉 预览服务器已启动！');
    console.log(`🌐 访问地址: http://localhost:${PORT}`);
    console.log(`📱 支持多端预览: H5、微信小程序、支付宝小程序等`);
    console.log('\n📋 项目功能概览:');
    console.log('  • 广场 - 浏览闲置物品和代办需求');
    console.log('  • 发布 - 发布可交换物品、需求或代办');
    console.log('  • 预约 - 管理预约订单');
    console.log('  • 消息 - 查看系统通知和预约消息');
    console.log('  • 我的 - 个人中心、互助榜、评价等');
    console.log('\n💡 如需重新构建，请运行: npm run build:h5');
  });
} else {
  console.log('\n⚠️  无法启动预览服务器');
  console.log('💡 请先安装依赖并构建项目:');
  console.log('   1. npm install --legacy-peer-deps');
  console.log('   2. npm run build:h5');
  console.log('   3. node preview-server.js');
}
