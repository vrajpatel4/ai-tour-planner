"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  SendIcon,
  Sparkles,
  User2,
  ChevronRight,
  Mic,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  options?: string[];
};

type ChatBoxProps = {
  messages: UiMessage[];
  input: string;
  loading: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onOptionSelect: (option: string) => void;
  disabled?: boolean;
  disabledMessage?: string;
};

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-end gap-3"
    >
      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white shadow-lg relative">
        <Sparkles className="h-4 w-4" />
        <span className="absolute inset-0 rounded-full bg-cyan-400/30 blur-md animate-pulse" />
      </div>

      <div className="flex items-center gap-1 px-4 py-3 rounded-2xl bg-white/90 border shadow-md backdrop-blur">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2 w-2 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full"
            animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

const ChatBox = ({
  messages,
  input,
  loading,
  onInputChange,
  onSend,
  onOptionSelect,
  disabled = false,
  disabledMessage,
}: ChatBoxProps) => {
  const endRef = useRef<HTMLDivElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
      console.log({messages})
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);


  return (
    <div className="relative rounded-[32px] bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.15)]">

      {/* background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-cyan-400/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[200px] bg-blue-400/20 blur-[120px]" />
      </div>

      <div className="flex flex-col gap-4 relative">

        {/* Messages */}
        <section
          className="
        flex-1 h-[62vh] overflow-y-auto
        rounded-[28px]
        border border-white/40
        bg-white/70
        backdrop-blur-xl
        p-5
        space-y-6
        shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]
        "
        >
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="space-y-2"
              >
                {msg.role === "user" ? (
                  <div className="flex justify-end items-end gap-2">
                    <div
                      className="
                    max-w-[75%]
                    px-4 py-3
                    rounded-2xl rounded-br-sm
                    bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
                    text-white text-sm
                    shadow-[0_8px_24px_rgba(15,23,42,0.35)]
                    ring-1 ring-white/10
                    "
                    >
                      {msg.content}
                    </div>

                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                      <User2 className="h-4 w-4 text-slate-600" />
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    {/* AI Avatar */}
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-white flex items-center justify-center shadow-lg relative">
                      <Sparkles className="h-4 w-4" />
                      <span className="absolute inset-0 rounded-full bg-cyan-400/30 blur-md animate-pulse" />
                    </div>

                    <div className="flex-1 space-y-2">
                      <div
                        className="
                      inline-block
                      px-5 py-3.5
                      rounded-2xl rounded-tl-sm
                      bg-white/95
                      border
                      shadow-[0_10px_30px_rgba(15,23,42,0.08)]
                      text-sm text-slate-800
                      "
                      >
                        {msg.content}
                      </div>

                      {msg.options && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {msg.options.map((opt) => (
                            <motion.button
                              key={opt}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => onOptionSelect(opt)}
                              className="
                              text-xs
                              px-4 py-2
                              rounded-full
                              border border-cyan-200
                              bg-gradient-to-r
                              from-cyan-50
                              to-blue-50
                              hover:from-cyan-100
                              hover:to-blue-100
                              text-cyan-700
                              font-medium
                              shadow-sm
                              "
                            >
                              {opt}
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && <TypingIndicator />}

          <div ref={endRef} />
        </section>

        {/* Input */}
        <section>
          {disabled && disabledMessage && (
            <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              {disabledMessage}
            </div>
          )}

          <motion.div
            animate={{
              boxShadow: isFocused
                ? "0 0 0 2px rgba(6,182,212,0.4), 0 8px 30px rgba(6,182,212,0.15)"
                : "0 6px 20px rgba(15,23,42,0.08)",
            }}
            className="
            rounded-[26px]
            border border-white/40
            bg-white/90
            backdrop-blur-xl
            "
          >
            <div className="p-3">

              <Textarea
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
                placeholder="Where do you dream of going?"
                disabled={disabled}
                className="
                w-full
                min-h-[4.5rem]
                border-none
                focus-visible:ring-0
                resize-none
                bg-transparent
                text-sm
                text-slate-700
                placeholder:text-slate-400
                "
              />

              <div className="flex justify-between items-center mt-2">

                <div className="flex gap-2">
                  <button className="h-8 w-8 rounded-full hover:bg-cyan-50 flex items-center justify-center text-slate-400 hover:text-cyan-500">
                    <Paperclip className="h-4 w-4" />
                  </button>

                  <button className="h-8 w-8 rounded-full hover:bg-cyan-50 flex items-center justify-center text-slate-400 hover:text-cyan-500">
                    <Mic className="h-4 w-4" />
                  </button>
                </div>

                <Button
                  onClick={onSend}
                  disabled={disabled || loading || !input.trim()}
                  className="
                  rounded-xl
                  bg-gradient-to-r
                  from-cyan-500
                  via-blue-500
                  to-indigo-600
                  hover:from-cyan-600
                  hover:via-blue-600
                  hover:to-indigo-700
                  shadow-[0_6px_20px_rgba(37,99,235,0.45)]
                  text-white
                  "
                >
                  <SendIcon className="h-4 w-4 mr-1.5" />
                  Send
                </Button>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default ChatBox;
