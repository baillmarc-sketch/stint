"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Send } from "lucide-react";
import type { StoredMessage } from "@/lib/messages-store";
import { cn } from "@/lib/utils";

export function MessageThread({
  bookingId,
  providerName,
  providerAvatarUrl,
  initialMessages,
}: {
  bookingId: string;
  providerName: string;
  providerAvatarUrl: string;
  initialMessages: StoredMessage[];
}) {
  const [messages, setMessages] = useState<StoredMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    // optimistic
    const optimistic: StoredMessage = {
      id: `tmp_${Date.now()}`,
      sender: "customer",
      body,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    setText("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, body }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.messages)) setMessages(data.messages);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <Image
          src={providerAvatarUrl}
          alt={providerName}
          width={36}
          height={36}
          className="size-9 rounded-full object-cover"
        />
        <div>
          <p className="text-sm font-semibold">{providerName}</p>
          <p className="text-xs text-muted-foreground">Usually replies within a few hours</p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {/* Seeded greeting */}
        <Bubble sender="provider" avatar={providerAvatarUrl}>
          Hi! Thanks for booking — excited for your event. Feel free to share any details here.
        </Bubble>
        {messages.map((m) => (
          <Bubble key={m.id} sender={m.sender} avatar={providerAvatarUrl}>
            {m.body}
          </Bubble>
        ))}
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t border-border p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message ${providerName}…`}
          className="h-10 flex-1 rounded-full border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-gradient text-white disabled:opacity-50"
          aria-label="Send"
        >
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </button>
      </form>
    </div>
  );
}

function Bubble({
  sender,
  avatar,
  children,
}: {
  sender: StoredMessage["sender"];
  avatar: string;
  children: React.ReactNode;
}) {
  const mine = sender === "customer";
  return (
    <div className={cn("flex items-end gap-2", mine && "flex-row-reverse")}>
      {!mine && (
        <Image src={avatar} alt="" width={28} height={28} className="size-7 rounded-full object-cover" />
      )}
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm",
          mine
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-secondary text-secondary-foreground",
        )}
      >
        {children}
      </div>
    </div>
  );
}
