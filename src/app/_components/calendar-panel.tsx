"use client";

import { useMemo, useState } from "react";

import {
  formatAttendees,
  formatEventWhen,
  LinkifiedText,
} from "@/lib/display";
import { formatWeekLabel, getWeekBounds } from "@/lib/week";
import { api } from "@/trpc/react";

const EVENT_COLORS = [
  "bg-[#1a73e8]",
  "bg-[#0f9d58]",
  "bg-[#f4511e]",
  "bg-[#7986cb]",
  "bg-[#33b679]",
  "bg-[#d50000]",
  "bg-[#8e24aa]",
  "bg-[#f09300]",
];

export function CalendarPanel() {
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);

  const week = useMemo(() => getWeekBounds(weekOffset), [weekOffset]);
  const weekLabel = formatWeekLabel(week.start, week.end);

  const utils = api.useUtils();

  const events = api.calendar.searchEvents.useQuery({
    query: activeSearch,
    weekStart: week.start.toISOString(),
    weekEnd: week.end.toISOString(),
    limit: 50,
    offset: 0,
  });

  const refreshEvents = api.calendar.refreshEvents.useMutation({
    onSuccess: async () => {
      await utils.calendar.searchEvents.invalidate();
    },
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Week Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#dadce0] bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w - 1)}
            aria-label="Previous week"
            className="rounded-full p-2 text-[#5f6368] transition-colors hover:bg-[#f1f3f4]"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w + 1)}
            aria-label="Next week"
            className="rounded-full p-2 text-[#5f6368] transition-colors hover:bg-[#f1f3f4]"
          >
            ›
          </button>
        </div>

        <h2
          suppressHydrationWarning
          className="flex-1 text-lg font-normal text-[#202124]"
        >
          {weekLabel}
        </h2>

        {weekOffset !== 0 && (
          <button
            type="button"
            onClick={() => setWeekOffset(0)}
            className="rounded-full border border-[#dadce0] px-4 py-1.5 text-sm font-medium text-[#1a73e8] transition-colors hover:bg-[#e8f0fe]"
          >
            Today
          </button>
        )}

        <button
          type="button"
          onClick={() =>
            refreshEvents.mutate({
              weekStart: week.start.toISOString(),
              weekEnd: week.end.toISOString(),
            })
          }
          disabled={refreshEvents.isPending}
          className="rounded-full px-3 py-1.5 text-sm text-[#1a73e8] transition-colors hover:bg-[#e8f0fe] disabled:opacity-50"
        >
          {refreshEvents.isPending ? "Refreshing…" : "↻ Refresh"}
        </button>
        {refreshEvents.data && (
          <span className="text-xs text-[#5f6368]">
            {refreshEvents.data.synced} synced
          </span>
        )}
      </div>

      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setActiveSearch(search);
        }}
        className="flex gap-2"
      >
        <div className="flex flex-1 items-center gap-2 rounded-full border border-[#dadce0] bg-white px-4 shadow-sm transition-shadow hover:shadow-md">
          <svg
            className="h-4 w-4 shrink-0 text-[#5f6368]"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events"
            className="flex-1 bg-transparent py-3 text-sm text-[#202124] outline-none placeholder:text-[#5f6368]"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveSearch("");
              }}
              className="text-lg leading-none text-[#5f6368] hover:text-[#202124]"
            >
              ×
            </button>
          )}
        </div>
        <button
          type="submit"
          className="rounded-full bg-[#1a73e8] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1557b0]"
        >
          Search
        </button>
      </form>

      {/* Events List */}
      <div className="overflow-hidden rounded-2xl border border-[#dadce0] bg-white shadow-sm">
        <div className="border-b border-[#dadce0] px-6 py-4">
          <h2 className="text-sm font-medium text-[#202124]">Events</h2>
        </div>

        {events.isLoading && (
          <div className="px-6 py-10 text-center text-sm text-[#5f6368]">
            Loading…
          </div>
        )}
        {events.error && (
          <div className="px-6 py-4 text-sm text-[#d93025]">
            {events.error.message}
          </div>
        )}
        {events.data?.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-[#5f6368]">
            No events this week.
          </div>
        )}
        {events.data && events.data.length > 0 && (
          <ul className="divide-y divide-[#e8eaed]">
            {events.data.map((event, i) => (
              <li
                key={event.id}
                className="flex gap-4 px-6 py-4 transition-colors hover:bg-[#f6f8fc]"
              >
                {/* Color accent bar */}
                <div
                  className={`w-1 shrink-0 self-stretch rounded-sm ${EVENT_COLORS[i % EVENT_COLORS.length]}`}
                />
                <div className="min-w-0 flex-1">
                  {event.htmlLink ? (
                    <a
                      href={event.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-[#1a73e8] hover:underline"
                    >
                      {event.summary ?? "Untitled"}
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-[#202124]">
                      {event.summary ?? "Untitled"}
                    </span>
                  )}
                  {event.start && (
                    <p className="mt-0.5 text-xs text-[#5f6368]">
                      🕐 {formatEventWhen(event.start, event.end)}
                    </p>
                  )}
                  {event.location && (
                    <p className="mt-0.5 text-xs text-[#5f6368]">
                      📍 {event.location}
                    </p>
                  )}
                  {event.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-[#5f6368]">
                      <LinkifiedText text={event.description} />
                    </p>
                  )}
                  {event.attendees.length > 0 && (
                    <p className="mt-0.5 text-xs text-[#5f6368]">
                      👥 {formatAttendees(event.attendees)}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}
