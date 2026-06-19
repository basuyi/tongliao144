# 通辽144 - OSS 部署指南

## 快速部署

### 方法一：使用环境变量（推荐）

1. **获取阿里云 AccessKey**
   - 访问 [RAM控制台](https://ram.console.aliyun.com/manage/ak)
   - 创建或获取 AccessKey ID 和 Secret

2. **设置环境变量**
   ```bash
   set OSS_ACCESS_KEY_ID=你的AccessKeyID
   set OSS_ACCESS_KEY_SECRET=你的AccessKeySecret
   set OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
   set OSS_BUCKET_NAME=tongliao-144
   ```

3. **运行部署**
   ```bash
   python deploy_oss.py
   ```

### 方法二：命令行参数

```bash
python deploy_oss.py <AK_ID> <AK_SECRET> <endpoint> <bucket_name>
```

例如：
```bash
python deploy_oss.py YOUR_ACCESS_KEY YOUR_SECRET_KEY oss-cn-hangzhou.aliyuncs.com tongliao-144
```

## 部署后

部署成功后，你会看到类似以下的输出：

```
==================================================
  Game URL:  http://tongliao-144.oss-cn-hangzhou.aliyuncs.com/index.html
  Online:    http://tongliao-144.oss-cn-hangzhou.aliyuncs.com/index.html?mode=online
==================================================

Tip: On phone, open the Game URL to play!
Share the Online URL&room=XXXXX for online multiplayer
```

## 在线多人游戏

要创建或加入在线房间，在URL后面添加房间号：
- 创建房间：`http://your-bucket.oss-region.aliyuncs.com/index.html?mode=online&room=ROOM123`
- 加入房间：分享上述链接给其他玩家

## 注意事项

- 确保 Bucket 名称是唯一的
- OSS 会产生少量费用（存储和流量费）
- 首次部署需要几分钟生效
- 支持 Supabase 在线模式（需要在代码中配置 Supabase URL 和 Key）
