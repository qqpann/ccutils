# TUI Layout Debugging Guide

Inkベースの TUI でレイアウト問題（行のクリッピング等）をデバッグする際のガイド。

## よくある問題: Flexboxレイアウトでの行クリッピング

**症状**: コンテンツ行（パーミッション項目など）がクリップされて消える。特にスクロールが必要な場合に発生しやすく、最初や最後の行が見えなくなる。

**根本原因**: 計算された viewport height と実際のターミナルの空きスペースの不一致。以下の場合に発生：
1. 固定UI要素（margin, padding, border）が正しくカウントされていない
2. 計算のベース値が間違っている（例: `containerHeight` ではなく `terminalHeight` を使用）

## 予防策: 名前付きレイアウト定数

マジックナンバーの代わりに、各UI要素に対して明示的な定数を定義する：

```typescript
const LAYOUT = {
  CONTAINER_PADDING: 2,        // padding={1} → 上1行 + 下1行
  TITLE_LINES: 1,
  TITLE_MARGIN_BOTTOM: 1,      // marginBottom={1}
  TABS_BORDER_TOP: 1,
  TABS_CONTENT: 1,
  TABS_BORDER_BOTTOM: 1,
  TABS_MARGIN_BOTTOM: 1,       // コンポーネント内の marginBottom={1}
  // ... etc
} as const;

const FIXED_UI_LINES = Object.values(LAYOUT).reduce((a, b) => a + b, 0);
```

**見落としやすい行数の発生源**:
- `padding={N}` → 上下両方に N 行追加（合計 2N）
- `marginTop={N}` / `marginBottom={N}` → N 行追加
- `borderStyle` → 上1行 + 下1行
- 空のプレースホルダー行（例: 非表示インジケータ用の " "）

## デバッグ手順

### 1. デバッグ出力を追加

viewport の状態を表示するデバッグ出力をコンポーネントに追加：

```typescript
<Text color="magenta">
  {`[vh=${viewportHeight} sel=${selectedRow} vs=${viewportStart} vis=${visible.length} total=${total}]`}
</Text>
```

### 2. レンダリングテストを作成

`ink-testing-library` を使ってレンダリングテストを作成：

```typescript
const { lastFrame } = render(<Component {...props} />);
const lines = lastFrame()?.split("\n") || [];
const contentLines = lines.filter(l => l.includes("expected-content"));
expect(contentLines.length).toBe(expectedCount);
```

### 3. 様々なターミナル高さでテスト

エッジケースを検出するため、複数の高さでテスト：
- 大きいターミナル（40行以上）- 通常は問題なし
- 小さいターミナル（24-30行）- バグが出やすい
- 境界ケース（固定行 + コンテンツ = ちょうどターミナル高さ）

## containerHeight トリック

Ink にはコンテンツがターミナルをちょうど埋めるとフリッカーが発生する既知の問題がある（ink#359）。回避策：

```typescript
const terminalHeight = stdout?.rows ?? 24;
const containerHeight = terminalHeight - 1;  // -1 でフリッカー防止
```

**重要**: `viewportHeight` は `terminalHeight` ではなく `containerHeight` から計算すること。実際のレンダリングスペースは `containerHeight` だから。

## テストファイル

- `src/components/ThreeColumnPane.test.tsx` - viewport計算とレンダリングのテスト
- `src/app.test.tsx` - シミュレートしたターミナル高さでのアプリレイアウトテスト
