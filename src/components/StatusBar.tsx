import React from "react";
import { Box, Text } from "ink";

interface StatusBarProps {
  hasChanges: boolean;
  message?: string;
}

export function StatusBar({ hasChanges, message }: StatusBarProps) {
  return (
    <Box flexDirection="column" marginTop={1}>
      {/* Separator */}
      <Text color="gray">{"─".repeat(76)}</Text>

      {/* Key bindings */}
      <Box gap={2}>
        <Text>
          <Text color="cyan">[↑↓]</Text> 行移動
        </Text>
        <Text>
          <Text color="cyan">[←→]</Text> スコープ移動
        </Text>
        <Text>
          <Text color="cyan">[Tab]</Text> プロジェクト切替
        </Text>
        <Text>
          <Text color="cyan">[Enter]</Text> 保存
        </Text>
        <Text>
          <Text color="cyan">[q]</Text> 終了
        </Text>
      </Box>

      {/* Status message */}
      {hasChanges && (
        <Box marginTop={1}>
          <Text color="yellow">● 未保存の変更があります</Text>
        </Box>
      )}
      {message && (
        <Box marginTop={1}>
          <Text color="green">{message}</Text>
        </Box>
      )}
    </Box>
  );
}
