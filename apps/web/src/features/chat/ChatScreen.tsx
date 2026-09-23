import type { ChatMessage } from "@shila/contracts";
import { useState, type FormEvent } from "react";

import { sendChat } from "../../api/client";

const GREETING: ChatMessage = {
  role: "assistant",
  content: "سلام! خرج‌هایت را بگو تا ثبت کنم. مثلاً: «۱۲۰ هزار تومان به حسن دادم».",
};

export function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || pending) {
      return;
    }

    setMessages((current) => [...current, { role: "user", content: text }]);
    setInput("");
    setPending(true);

    try {
      const reply = await sendChat(text);
      setMessages((current) => [...current, { role: "assistant", content: reply.message }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "خطای ناشناخته";
      setMessages((current) => [...current, { role: "assistant", content: message }]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="chat">
      <header className="chat__header">
        <h1>شیلا</h1>
        <p>دستیار مالی شخصی</p>
      </header>

      <main className="chat__messages">
        {messages.map((message, index) => (
          <div key={index} className={`bubble bubble--${message.role}`}>
            {message.content}
          </div>
        ))}
        {pending && <div className="bubble bubble--assistant bubble--pending">در حال پردازش…</div>}
      </main>

      <form className="chat__composer" onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="خرجت را بنویس…"
          aria-label="پیام"
          autoFocus
        />
        <button type="submit" disabled={pending}>
          ارسال
        </button>
      </form>
    </div>
  );
}
