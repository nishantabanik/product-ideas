import Seg from "../components/seg";

export default function StudioTabs({ active }: { active: "write" | "style" | "board" | "library" | "pillars" | "chat" }) {
  return <Seg label="Studio sections" value={active} options={[
    { value: "write", label: "Write", href: "/studio/write" },
    { value: "style", label: "My style", href: "/studio/style" },
    { value: "board", label: "Board", href: "/studio" },
    { value: "library", label: "Library", href: "/studio/library" },
    { value: "pillars", label: "Pillars", href: "/studio/pillars" },
    { value: "chat", label: "Chat", href: "/studio/chat" },
  ]} />;
}
