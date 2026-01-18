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

      {/* Legend */}
      <Box gap={3}>
        <Text>
          <Text color="green">✓</Text>
          <Text color="gray">…</Text>
          <Text>allow</Text>
        </Text>
        <Text>
          <Text color="red">✗</Text>
          <Text color="gray">…</Text>
          <Text>deny</Text>
        </Text>
        <Text color="gray">│</Text>
        <Text>
          <Text color="cyan">U</Text>=User <Text color="cyan">P</Text>=Project <Text color="cyan">L</Text>=Local
        </Text>
      </Box>

      {/* Key bindings */}
      <Box gap={2}>
        <Text>
          <Text color="cyan">[↑↓]</Text> Navigate
        </Text>
        <Text>
          <Text color="cyan">[←→]</Text> Move scope
        </Text>
        <Text>
          <Text color="cyan">[u/p/l]</Text> Toggle scope
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
