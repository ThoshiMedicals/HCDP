import type { ReactNode } from "react";
import type { IconName } from "@/lib/modules";

const paths: Record<IconName, ReactNode> = {
  home: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z"
    />
  ),
  bell: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 9a6 6 0 1 1 12 0c0 3.5 1.5 5 2 6H4c.5-1 2-2.5 2-6Zm4 10a2 2 0 0 0 4 0"
    />
  ),
  building: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 20V6a2 2 0 0 1 2-2h6v16H4Zm10 0V9h4a2 2 0 0 1 2 2v9h-6ZM8 8h2M8 12h2M8 16h2"
    />
  ),
  users: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 12v-1a3.5 3.5 0 0 0-2.5-3.35M18.5 7.5a2.5 2.5 0 1 1-3.4 0"
    />
  ),
  calendar: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
    />
  ),
  task: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12l2 2 4-4M7 4h7l4 4v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
    />
  ),
  pay: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v12M16 9.5c0-1.4-1.8-2.5-4-2.5s-4 1.1-4 2.5 1.8 2.5 4 2.5 4 1.1 4 2.5-1.8 2.5-4 2.5-4-1.1-4-2.5"
    />
  ),
  chart: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 19V5M4 19h16M8 15V9M12 15V7M16 15v-4"
    />
  ),
  checklist: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 7h10M9 12h10M9 17h10M5 7l1 1 2-2M5 12l1 1 2-2M5 17l1 1 2-2"
    />
  ),
  shield: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-3Z"
    />
  ),
  file: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8l-4-5Zm0 0v5h5"
    />
  ),
  box: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 8.5 12 3l9 5.5V16l-9 5.5L3 16V8.5Zm0 0 9 5.5 9-5.5M12 14v7.5"
    />
  ),
  alert: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v4M12 17h.01M10.3 4.5 2.8 17.2A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.8L13.7 4.5a2 2 0 0 0-3.4 0Z"
    />
  ),
  chat: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5 16.5V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 3.5Z"
    />
  ),
  lock: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 10V8a4 4 0 1 1 8 0v2M7 10h10a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z"
    />
  ),
  globe: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.5 0 4.5-4 4.5-9S14.5 3 12 3 7.5 7 7.5 12s2 9 4.5 9ZM3.5 12h17"
    />
  ),
  search: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-5.2-5.2"
    />
  ),
};

export function Icon({
  name,
  className = "h-[17px] w-[17px]",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden
    >
      {paths[name]}
    </svg>
  );
}
