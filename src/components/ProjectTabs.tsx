import React from "react";
import { Box, Text } from "ink";

interface ProjectTabsProps {
  projects: string[];
  selectedIndex: number;
}

export function ProjectTabs({ projects, selectedIndex }: ProjectTabsProps) {
  if (projects.length === 0) {
    return (
      <Box marginBottom={1}>
        <Text color="yellow">No projects found</Text>
      </Box>
    );
  }

  return (
    <Box marginBottom={1} flexDirection="row" gap={1}>
      {projects.map((name, index) => {
        const isSelected = index === selectedIndex;
        // Selected: double border with ▸ marker inside
        // Unselected: single border, no marker
        const borderStyle = isSelected ? "double" : "single";
        // Always reserve space for marker to keep consistent width
        const marker = isSelected ? "▸" : " ";

        return (
          <Box
            key={name}
            borderStyle={borderStyle}
            borderColor={isSelected ? "cyan" : "gray"}
            paddingX={1}
          >
            <Text color="cyan">{marker} </Text>
            <Text color={isSelected ? "cyan" : "white"} bold={isSelected}>
              {name}
            </Text>
            <Text> </Text>
          </Box>
        );
      })}
    </Box>
  );
}
