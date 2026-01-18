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
        return (
          <Box
            key={name}
            borderStyle="round"
            borderColor={isSelected ? "cyan" : "gray"}
            paddingX={1}
          >
            <Text color={isSelected ? "cyan" : "white"} bold={isSelected}>
              {name}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
