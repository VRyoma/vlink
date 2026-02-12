# vlink (ぶりんく) - VTuber向け Link in Bio サービス

## 概要
**vlink (ぶりんく)** は、VTuberやクリエイターが自分のリンク（SNS、配信、グッズなど）を一つにまとめて公開できるサービスです。
Google/YouTubeログインによる本人認証機能を備え、公式チェックマークによる信頼性の担保を実現します。

「一瞬で、もっと輝く自分へ。」をコンセプトに、クリエイターの個性を繋ぎ、輝かせる場所を提供します。

## 主な機能
- **かんたんプロフィール作成**: Googleアカウントでログインするだけで自分専用のリンク集を作成できます。
- **YouTube連携 & 本人認証**: ログイン時にYouTubeチャンネル情報を自動取得。連携済みユーザーには「認証済みバッジ」が付与されます。
- **動的ルーティング**: `link.vvil.jp/username` の形式で、各クリエイターのプロフィールページを公開できます。
- **レスポンシブデザイン**: スマートフォン、PCの両方で見やすいUIを提供します。

## 技術スタック
- **Frontend**: Next.js 15 (App Router)
- **Backend**: Supabase (Auth, Database)
- **Deployment**: Cloudflare Pages / Proxmox LXC

## 開発・運営
- **開発者**: 鏑流馬 流馬 (Ryoma Yabusame)
- **基盤**: 自宅サーバー (Proxmox環境) & Cloudflare
