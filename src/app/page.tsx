"use client";

import { useRef, useState } from "react";

import { CalendarPanel } from "@/app/_components/calendar-panel";
import { ComposeMessage } from "@/app/_components/compose-message";
import { CreateEvent } from "@/app/_components/create-event";
import { GmailPanel } from "@/app/_components/gmail-panel";
import { useOnClickOutside } from "@/lib/use-on-click-outside";

export default function Home() {
  const [composeOpen, setComposeOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(menuRef, () => setMenuOpen(false));

  // Panels stack from right: compose rightmost (24px), event next (460px)
  const composeRight = 24;
  const eventRight = composeOpen ? 460 : 24;

  return (
    <div className="min-h-screen bg-[#f1f3f4]">
      {/* Top App Bar */}
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-[#dadce0] bg-white px-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-base font-bold text-white"
            style={{
              background:
                "linear-gradient(135deg, #4285f4 0%, #34a853 40%, #fbbc05 70%, #ea4335 100%)",
            }}
          >
            G
          </div>
          <span className="hidden text-xl font-normal tracking-wide text-[#5f6368] sm:block">
            Workspace Demo
          </span>
        </div>

        {/* New button */}
        <div ref={menuRef} className="relative ml-auto">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#1557b0]"
          >
            <span className="text-lg leading-none">+</span>
            New
            <span className="text-xs opacity-70">▾</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-[#dadce0] bg-white shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setComposeOpen((o) => !o);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[#202124] transition-colors hover:bg-[#f1f3f4]"
              >
                <span className="text-base">✉</span>
                {composeOpen ? "Close Message" : "New Message"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEventOpen((o) => !o);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 border-t border-[#e8eaed] px-4 py-3 text-sm text-[#202124] transition-colors hover:bg-[#f1f3f4]"
              >
                <span className="text-base">📅</span>
                {eventOpen ? "Close Event" : "New Event"}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[96%] px-4 py-6">
        <div className="flex gap-4">
          <div className="min-w-0 flex-[2]">
            <GmailPanel />
          </div>
          <div className="min-w-0 flex-[1]">
            <CalendarPanel />
          </div>
        </div>
      </main>

      {/* Fixed floating panels */}
      {composeOpen && (
        <ComposeMessage
          onClose={() => setComposeOpen(false)}
          rightOffset={composeRight}
        />
      )}
      {eventOpen && (
        <CreateEvent
          onClose={() => setEventOpen(false)}
          rightOffset={eventRight}
        />
      )}
    </div>
  );
}
