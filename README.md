# vbio

<div align="center">

**VTuber・クリエイター向け Link in Bio サービス**

Google/YouTube連携で本人認証済みアカウントにバッジを表示

[デモサイト](https://bio.vvil.jp) · [ライブデモ](https://bio.vvil.jp/username)

</div>

---

## ✨ 機能

- 🔐 **Google/YouTube OAuth連携** - ログインだけで本人確認・バッジ付与
- 👤 **動的プロフィール** - `/{username}` で各クリエイターのリンク集を公開
- 🔗 **リンク管理** - SNS、配信プラットフォーム、グッズ販売ページなどを一元管理
- ✅ **認証済みバッジ** - YouTube連携済みアカウントに公式マークを表示
- 📱 **レスポンシブデザイン** - モバイル・PC両対応

---

## 🛠 技術スタック

| カテゴリ | 技術 |
|----------|--------|
| **Frontend** | Next.js 15.4 (App Router) |
| **UI** | Tailwind CSS v4 |
| **Backend** | Supabase (Auth + PostgreSQL) |
| **Deployment** | Cloudflare Workers (OpenNext) |

---

## 🚀 クイックスタート

```bash
# リポジトリをクローン
git clone https://github.com/VRyoma/vbio.git
cd vbio

# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.example .env.local
# .env.local に Supabase の接続情報を入力

# 開発サーバーを起動
npm run dev

# http://localhost:3001 にアクセス
```

---

## 📦 スクリプト

| コマンド | 説明 |
|----------|--------|
| `npm run dev` | 開発サーバー起動 (ポート3001) |
| `npm run build` | プロダクションビルド |
| `npm run start` | プロダクションサーバー起動 |
| `npm run pages:build` | Cloudflare Workers 用ビルド |
| `npm run preview` | Wrangler でローカルプレビュー |

---

## 🔧 環境変数

```bash
# .env.local または Cloudflare Workers の環境変数
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🌐 デプロイ

### Cloudflare Workers (本番環境)

```bash
# Cloudflare Workers にデプロイ
npm run pages:build
npx wrangler deploy
```

または、GitHub連携で自動デプロイが設定されています。

---

## 📁 プロジェクト構造

```
vbio/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── admin/         # 管理画面 (認証必須)
│   │   └── [username]/    # 動的プロフィールページ
│   ├── components/       # React コンポーネント
│   └── lib/             # ユーティリティ
├── public/              # 静的アセット
└── supabase/
    └── migrations/       # データベースマイグレーション
```

---

## 🗄 データベーススキーム

### profiles テーブル
| カラム | 型 | 説明 |
|--------|------|--------|
| id | uuid | ユーザーID (Supabase Auth) |
| username | text | ユーザー名 (URL用) |
| display_name | text | 表示名 |
| bio | text | 自己紹介 |
| avatar_url | text | アバター画像URL |
| is_verified | boolean | YouTube認証済みフラグ |
| youtube_handle | text | YouTubeハンドル |
| youtube_channel_id | text | YouTubeチャンネルID |
| youtube_channel_url | text | YouTubeチャンネルURL |

### links テーブル
| カラム | 型 | 説明 |
|--------|------|--------|
| id | uuid | リンクID |
| user_id | uuid | ユーザーID (外部キー) |
| title | text | リンクタイトル |
| url | text | リンク先URL |
| is_visible | boolean | 表示フラグ |
| sort_order | integer | 表示順序 |

---

## 📝 ライセンス

MIT License

---

## 👨‍💻 開発者

**りょうま (Ryoma)**

- [GitHub](https://github.com/VRyoma)
- [Website](https://bio.vvil.jp)

---

Made with ❤️ for VTubers and Creators
