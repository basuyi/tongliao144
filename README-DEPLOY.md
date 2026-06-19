# 通辽144 棋牌游戏 - OSS 部署说明

## 📋 部署前准备

### 1. 获取阿里云 AccessKey

访问 [RAM 控制台](https://ram.console.aliyun.com/manage/ak) 创建或获取：
- **AccessKey ID**: 类似 `LTAI5t...` 的字符串
- **AccessKey Secret**: 一串字母数字组合

> ⚠️ **重要**: 请妥善保管你的 AccessKey，不要泄露给他人！

### 2. 确定 OSS 区域 (Endpoint)

根据你的地理位置选择最近的区域：
- 杭州: `oss-cn-hangzhou.aliyuncs.com`
- 上海: `oss-cn-shanghai.aliyuncs.com`
- 北京: `oss-cn-beijing.aliyuncs.com`
- 深圳: `oss-cn-shenzhen.aliyuncs.com`

## 🚀 快速部署（三种方式）

### 方式一：双击运行脚本（最简单）

1. 在文件资源管理器中找到 `deploy.ps1`
2. 右键 → "使用 PowerShell 运行"
3. 按照提示输入 AccessKey 信息
4. 等待部署完成

### 方式二：命令行部署

```powershell
cd C:\Users\杨大宝\.qoderwork\workspace\mq2epl8bo56qv19k
.\deploy.ps1
```

### 方式三：直接 Python 命令

```bash
python deploy_oss.py <AK_ID> <AK_SECRET> <endpoint> <bucket_name>
```

例如：
```bash
python deploy_oss.py YOUR_ACCESS_KEY YOUR_SECRET_KEY oss-cn-hangzhou.aliyuncs.com tongliao-144
```

## ✅ 部署成功后的输出

你会看到类似这样的信息：

```
==================================================
  Game URL:  http://tongliao-144.oss-cn-hangzhou.aliyuncs.com/index.html
  Online:    http://tongliao-144.oss-cn-hangzhou.aliyuncs.com/index.html?mode=online
==================================================

Tip: On phone, open the Game URL to play!
Share the Online URL&room=XXXXX for online multiplayer
```

## 🎮 开始游戏

### 单人模式
直接在浏览器打开 Game URL 即可游玩

### 在线多人模式
1. 房主打开：`http://your-bucket.oss-region.aliyuncs.com/index.html?mode=online&room=ROOM123`
2. 点击"设置"配置 Supabase（已内置默认配置）
3. 将链接分享给其他玩家
4. 其他玩家点击同一链接即可加入房间

## 💡 常见问题

### Q: 部署失败，提示 AccessDenied
**A**: 检查 AccessKey 是否正确，确保有 OSS 操作权限

### Q: Bucket 名称已被占用
**A**: Bucket 名称必须全局唯一，尝试使用其他名称，如 `tongliao144-你的名字`

### Q: 部署后访问页面是空白
**A**: 
- 等待几分钟让 OSS 生效
- 清除浏览器缓存
- 检查 URL 是否正确

### Q: 在线模式无法连接
**A**: 
- 确认 Supabase 配置正确（代码中已内置测试配置）
- 检查网络连接
- 确保所有玩家使用相同的房间号

## 💰 费用说明

阿里云 OSS 静态托管费用很低：
- **存储费**: 约 ¥0.12/GB/月（游戏文件仅几十KB）
- **流量费**: 约 ¥0.5/GB（根据访问量计算）
- **请求费**: 几乎可以忽略不计

对于个人小游戏，每月费用通常在 **几毛钱到几块钱** 之间。

## 🔧 高级配置

### 自定义域名
如果想使用自己的域名：
1. 在 OSS 控制台绑定域名
2. 配置 CNAME 解析
3. 修改访问 URL

### 启用 HTTPS
OSS 默认支持 HTTPS，只需：
- 使用 `https://` 开头的 URL
- 或在 CDN 中配置 SSL 证书

---

**祝你游戏愉快！** 🎲🃏
