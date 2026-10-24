# SubTally

**把订阅理清，把选择留给自己。** 记录会员、创作者充电、AI 套餐，看清每月花费、分类构成与续费时间。数据默认只保存在本机。

本仓库只存放镜像。小程序体验、截图与完整文档请看 GitHub：
**<https://github.com/Caoran1314/SubTally>**

---

## 支持的标签

| 标签 | 说明 |
|---|---|
| `latest` | main 分支最新构建 |
| `1.2.3` 等 | 固定版本，不随更新变化 |

架构：`linux/amd64`、`linux/arm64`。

## 快速开始

```bash
docker run -d --name subtally \
  -p 8787:8787 \
  -v /path/to/data:/data \
  --restart unless-stopped \
  caowenrui/subtally:latest
```

打开 `http://<IP>:8787` 即可使用。数据都在 `/data`，可随时整目录备份。

## 说明

- 本地优先：不登录也能用，所有数据存本地 SQLite
- 可选同步：开启后云端只有密文，服务端读不到明文
- 也提供微信小程序版本，扫码即用（见 GitHub）

## 相关链接

- 源码与文档：<https://github.com/Caoran1314/SubTally>
- 更新日志：<https://github.com/Caoran1314/SubTally/blob/main/CHANGELOG.md>
