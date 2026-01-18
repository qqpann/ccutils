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
          <Text color="cyan">[↑↓]</Text> Navigate
        </Text>
        <Text>
          <Text color="cyan">[←→]</Text> Move scope
        </Text>
        <Text>
          <Text color="cyan">[Tab]</Text> Switch project
        </Text>
        <Text>
          <Text color="cyan">[Enter]</Text> Save
        </Text>
        <Text>
          <Text color="cyan">[q]</Text> Quit
        </Text>
      </Box>

      {/* Status message */}
      {hasChanges && (
        <Box marginTop={1}>
          <Text color="yellow">● Unsaved changes</Text>
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
